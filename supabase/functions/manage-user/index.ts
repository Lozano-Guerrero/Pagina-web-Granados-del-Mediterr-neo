// Supabase Edge Function: manage-user
// - Admin: puede editar/desactivar brokers e inmobiliarias.
// - Inmobiliaria: puede editar/desactivar solo brokers de su misma org_id.
//
// Secrets requeridos:
// - SERVICE_ROLE_KEY (o ADMIN_SERVICE_ROLE_KEY)
//
// Nota: Este endpoint NO borra físicamente usuarios.
// Para bloquear acceso, usamos profiles.is_active=false y el frontend corta la sesión.

import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type RequestBody = {
  action: "update" | "deactivate" | "reactivate";
  userId: string;
  updates?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };
};

function cleanString(value: unknown) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey =
    Deno.env.get("SERVICE_ROLE_KEY") ??
    Deno.env.get("ADMIN_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push("SUPABASE_URL");
    if (!anonKey) missing.push("SUPABASE_ANON_KEY");
    if (!serviceRoleKey) missing.push("SERVICE_ROLE_KEY");
    return jsonResponse(500, { error: "Missing Supabase env vars.", missing });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return jsonResponse(401, { error: "Missing Authorization token." });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return jsonResponse(401, { error: "Unauthorized.", details: userErr?.message ?? null });
  }

  const callerId = userData.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerProfileErr } = await adminClient
    .from("profiles")
    .select("id, role, is_active, org_id")
    .eq("id", callerId)
    .single();

  if (callerProfileErr || !callerProfile) return jsonResponse(403, { error: "Unable to read caller profile." });
  if (callerProfile.is_active === false) return jsonResponse(403, { error: "Usuario inactivo." });

  let body: RequestBody | null = null;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const action = body?.action;
  const targetUserId = cleanString(body?.userId);
  if (!action || !targetUserId) return jsonResponse(400, { error: "action y userId son obligatorios." });

  const { data: targetProfile, error: targetErr } = await adminClient
    .from("profiles")
    .select("id, role, org_id, is_active, account_status")
    .eq("id", targetUserId)
    .maybeSingle();

  // Compat: si aún no existe account_status en la DB, reintenta sin esa columna.
  let finalTargetProfile = targetProfile as any;
  if (targetErr && /account_status/i.test(String(targetErr.message ?? ""))) {
    const fallback = await adminClient
      .from("profiles")
      .select("id, role, org_id, is_active")
      .eq("id", targetUserId)
      .maybeSingle();
    finalTargetProfile = fallback.data;
  }

  if (!finalTargetProfile) return jsonResponse(404, { error: "Usuario no encontrado." });

  const callerRole = String(callerProfile.role ?? "").toLowerCase();
  const targetRole = String(finalTargetProfile.role ?? "").toLowerCase();

  const isAdmin = callerRole === "admin";
  const isSubAdmin = callerRole === "subadmin";
  const isStaff = isAdmin || isSubAdmin;
  const isInmobiliaria = callerRole === "inmobiliaria";

  if (!isStaff && !isInmobiliaria) return jsonResponse(403, { error: "Forbidden." });

  // Sub-admin: NO puede administrar al usuario admin.
  if (isSubAdmin && targetRole === "admin") {
    return jsonResponse(403, { error: "Forbidden.", details: "No puedes administrar al usuario admin." });
  }

  if (isInmobiliaria) {
    if (targetRole !== "broker") return jsonResponse(403, { error: "Solo puedes administrar brokers." });
    if (!callerProfile.org_id || String(finalTargetProfile.org_id ?? "") !== String(callerProfile.org_id)) {
      return jsonResponse(403, { error: "Solo puedes administrar brokers de tu inmobiliaria." });
    }
  }

  if (action === "deactivate") {
    const { error: upErr } = await adminClient
      .from("profiles")
      .update({ is_active: false, account_status: "deactivated" })
      .eq("id", targetUserId);

    if (upErr) return jsonResponse(500, { error: "No se pudo desactivar el usuario.", details: upErr.message });

    return jsonResponse(200, { ok: true, action, userId: targetUserId, is_active: false });
  }

  if (action === "reactivate") {
    if (!isStaff) return jsonResponse(403, { error: "Solo staff puede reactivar usuarios." });

    // Regla: si el usuario vuelve a estar habilitado pero no ha firmado el régimen ACTIVO vigente,
    // debe quedar account_status='inactive' para bloquear registro de leads.
    // - Aplica a: inmobiliaria y broker independiente.
    // - Brokers hijos: NO firman; su bloqueo depende del representante, así que los dejamos active.

    let nextAccountStatus: "active" | "inactive" = "active";

    try {
      const isBroker = targetRole === "broker";
      const isInmobiliaria = targetRole === "inmobiliaria";

      const orgId = String(finalTargetProfile.org_id ?? "").trim() || null;

      // Detectar broker hijo: broker con org_id y existe representante inmobiliaria con mismo org_id.
      let isChildBroker = false;
      if (isBroker && orgId) {
        const { data: parent } = await adminClient
          .from("profiles")
          .select("id")
          .eq("role", "inmobiliaria")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .maybeSingle();
        isChildBroker = Boolean(parent?.id);
      }

      if (isChildBroker) {
        nextAccountStatus = "active";
      } else if (isBroker || isInmobiliaria) {
        const target = isInmobiliaria ? "inmobiliaria" : "broker";

        // Leer régimen activo
        const { data: activeReg, error: regErr } = await adminClient
          .from("regimens_master")
          .select("id, target, is_active, version")
          .eq("target", target)
          .eq("is_active", true)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!regErr && activeReg?.id) {
          // Verificar si firmó el régimen activo
          const { data: signed, error: signedErr } = await adminClient
            .from("regimens_signed")
            .select("id")
            .eq("user_id", targetUserId)
            .eq("regimen_id", activeReg.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!signedErr && !signed?.id) {
            nextAccountStatus = "inactive";
          }
        }
      }
    } catch {
      // best-effort: si falla la verificación, reactivamos como active para no bloquear por error técnico.
      nextAccountStatus = "active";
    }

    const { error: upErr } = await adminClient
      .from("profiles")
      .update({ is_active: true, account_status: nextAccountStatus })
      .eq("id", targetUserId);

    if (upErr) return jsonResponse(500, { error: "No se pudo reactivar el usuario.", details: upErr.message });

    return jsonResponse(200, {
      ok: true,
      action,
      userId: targetUserId,
      is_active: true,
      account_status: nextAccountStatus,
    });
  }

  if (action !== "update") return jsonResponse(400, { error: "Acción inválida." });

  const updates = body?.updates ?? {};
  const nextFirst = cleanString(updates.first_name);
  const nextLast = cleanString(updates.last_name);
  const nextEmail = cleanString(updates.email);
  const nextPhone = cleanString(updates.phone);
  const nextPassword = cleanString(updates.password);

  // 1) Actualizar Auth (email/password) si aplica.
  if (nextEmail || nextPassword) {
    const authPayload: Record<string, unknown> = {};
    if (nextEmail) {
      authPayload.email = nextEmail;
      authPayload.email_confirm = true;
    }
    if (nextPassword) {
      authPayload.password = nextPassword;
    }

    const { error: authUpErr } = await adminClient.auth.admin.updateUserById(targetUserId, authPayload);
    if (authUpErr) {
      return jsonResponse(500, { error: "No se pudo actualizar credenciales.", details: authUpErr.message });
    }
  }

  // 2) Actualizar Profile (campos no esenciales)
  const profilePayload: Record<string, unknown> = {};
  if (nextFirst !== null) profilePayload.first_name = nextFirst;
  if (nextLast !== null) profilePayload.last_name = nextLast;
  if (nextEmail !== null) profilePayload.email = nextEmail;
  if (nextPhone !== null) profilePayload.phone = nextPhone;

  if (Object.keys(profilePayload).length) {
    const { error: profErr } = await adminClient
      .from("profiles")
      .update(profilePayload)
      .eq("id", targetUserId);

    if (profErr) return jsonResponse(500, { error: "No se pudo actualizar el perfil.", details: profErr.message });
  }

  return jsonResponse(200, { ok: true, action, userId: targetUserId });
});
