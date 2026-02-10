// Supabase Edge Function: admin-create-user
// - Crea usuarios en Supabase Auth usando service role (solo desde el backend).
// - Requiere que el caller sea admin (según profiles.role).
//
// Deploy (ejemplo):
// supabase functions deploy admin-create-user
// supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//
// Frontend: supabase.functions.invoke('admin-create-user', { body: {...} })

import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateUserPayload = {
  role: "broker" | "inmobiliaria" | "subadmin" | "admin";
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  org_id?: string | null;
  company_name?: string;
};

function cleanString(value: unknown) {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

function generateTemporaryPassword(length = 26) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function pickPublicIdPrefix(role: CreateUserPayload["role"]) {
  if (role === "admin") return "ADM-";
  if (role === "subadmin") return "SUB-";
  if (role === "inmobiliaria") return "INM-";
  return "BRK-";
}

function generatePublicId(prefix: string) {
  // 6 caracteres alfanuméricos en mayúsculas (A-Z0-9)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return `${prefix}${out}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    // NOTE: Some environments may not expose secrets prefixed with SUPABASE_.
    // We support multiple names to make setup resilient.
    const serviceRoleKey =
      Deno.env.get("SERVICE_ROLE_KEY") ??
      Deno.env.get("ADMIN_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      const missing: string[] = [];
      if (!supabaseUrl) missing.push("SUPABASE_URL");
      if (!anonKey) missing.push("SUPABASE_ANON_KEY");
      if (!serviceRoleKey) missing.push("SERVICE_ROLE_KEY (o ADMIN_SERVICE_ROLE_KEY o SUPABASE_SERVICE_ROLE_KEY)");

      return new Response(JSON.stringify({ error: "Missing Supabase env vars.", missing }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Invalid Authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client con token del usuario (para validar que sea admin)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Passing the JWT explicitly is more reliable across runtimes.
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized.", details: userErr?.message ?? null }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;
    const { data: callerProfile, error: callerProfileErr } = await userClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerId)
      .single();

    if (callerProfileErr || !callerProfile) {
      return new Response(JSON.stringify({ error: "Unable to read caller profile." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerRole = String(callerProfile.role ?? "").toLowerCase();
    const isAdminCaller = callerRole === "admin";
    const isSubAdminCaller = callerRole === "subadmin";

    if (callerProfile.is_active === false || (!isAdminCaller && !isSubAdminCaller)) {
      return new Response(JSON.stringify({ error: "Forbidden." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as CreateUserPayload;
    const roleInput = cleanString(payload?.role)?.toLowerCase();
    const email = cleanString(payload?.email)?.toLowerCase();
    const providedPassword = cleanString(payload?.password);

    if (!email || !roleInput) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["broker", "inmobiliaria", "subadmin", "admin"].includes(roleInput)) {
      return new Response(JSON.stringify({ error: "role inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestedRole = roleInput as CreateUserPayload["role"];
    const requiresSelfPasswordSetup = requestedRole === "broker" || requestedRole === "inmobiliaria";
    const effectivePassword = requiresSelfPasswordSetup ? generateTemporaryPassword() : providedPassword;
    if (!effectivePassword) {
      return new Response(JSON.stringify({ error: "password es obligatorio para usuarios staff." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Solo el admin "real" puede crear staff (admin/subadmin).
    if ((requestedRole === "admin" || requestedRole === "subadmin") && !isAdminCaller) {
      return new Response(JSON.stringify({ error: "Forbidden.", details: "Solo admin puede crear sub-admins." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let orgId: string | null = payload.org_id ?? null;
    // Nuevos usuarios (broker/inmobiliaria) siempre inician INACTIVOS hasta completar
    // su primer acceso (creación/restablecimiento de contraseña).
    let initialAccountStatus: "active" | "inactive" = ["admin", "subadmin"].includes(requestedRole) ? "active" : "inactive";

    if (requestedRole === "inmobiliaria") {
      if (!payload.company_name) {
        return new Response(JSON.stringify({ error: "company_name is required for inmobiliaria." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: org, error: orgErr } = await adminClient
        .from("organizations")
        .insert({ company_name: payload.company_name })
        .select("id")
        .single();

      if (orgErr) {
        return new Response(JSON.stringify({ error: "Failed to create organization.", details: orgErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      orgId = org?.id ?? null;
    }

    // Nota: incluso brokers hijos quedan "inactive" al crearse.
    // La herencia de estado de inmobiliaria se aplica después del primer acceso.

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: effectivePassword,
      email_confirm: true,
      user_metadata: {
        password_setup_required: requiresSelfPasswordSetup,
        password_reset_enabled: false,
      },
      app_metadata: {
        password_setup_required: requiresSelfPasswordSetup,
        password_reset_enabled: false,
      },
    });

    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ error: "Failed to create user.", details: createErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prefix = pickPublicIdPrefix(requestedRole);

    let publicId: string | null = null;
    try {
      const { data: rpcData, error: rpcErr } = await adminClient.rpc("generate_public_id", { prefix });
      if (!rpcErr && typeof rpcData === "string" && rpcData.trim()) {
        publicId = rpcData.trim();
      }
    } catch {
      publicId = null;
    }

    // Fallback: generación local (si aún no existe la función generate_public_id en la DB).
    if (!publicId) {
      publicId = generatePublicId(prefix);
    }

    // El trigger debería crear profiles automáticamente, pero usamos upsert para no depender del timing.
    const baseProfile = {
      id: created.user.id,
      first_name: payload.first_name ?? null,
      last_name: payload.last_name ?? null,
      phone: payload.phone ?? null,
      email: email ?? null,
      role: requestedRole,
      org_id: orgId,
      account_status: initialAccountStatus,
    } as Record<string, unknown>;

    let updateErr: any = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const { error: upErr } = await adminClient
        .from("profiles")
        .upsert({ ...baseProfile, public_id: publicId }, { onConflict: "id" });

      if (!upErr) {
        updateErr = null;
        break;
      }

      updateErr = upErr;

      const msg = String(upErr?.message ?? "");
      const missingPublicIdColumn = /public_id/i.test(msg) && /does not exist|unknown/i.test(msg);
      if (missingPublicIdColumn) {
        // Compat: si la DB aún no tiene `public_id`, no bloqueamos la creación del usuario.
        const { error: retryErr } = await adminClient
          .from("profiles")
          .upsert(baseProfile, { onConflict: "id" });

        if (!retryErr) {
          updateErr = null;
          publicId = null;
          break;
        }

        updateErr = retryErr;
        break;
      }

      const missingAccountStatusColumn = /account_status/i.test(msg) && /does not exist|unknown/i.test(msg);
      if (missingAccountStatusColumn) {
        const { account_status, ...rest } = baseProfile as Record<string, unknown>;
        const { error: retryErr } = await adminClient
          .from("profiles")
          .upsert(rest, { onConflict: "id" });
        if (!retryErr) {
          updateErr = null;
          break;
        }
        updateErr = retryErr;
        break;
      }

      // 23505 = unique_violation
      const isUniqueViolation = String(upErr?.code ?? "") === "23505" || /duplicate key/i.test(String(upErr?.message ?? ""));
      if (isUniqueViolation && attempt < 7) {
        publicId = generatePublicId(prefix);
        continue;
      }

      break;
    }

    if (updateErr) {
      return new Response(JSON.stringify({ error: "User created but profile update failed.", details: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      user_id: created.user.id,
      org_id: orgId,
      public_id: publicId,
      password_setup_required: requiresSelfPasswordSetup,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error.", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
