// Supabase Edge Function: regimen-user-submit
// Finaliza el envío del régimen firmado:
// - Inserta fila en public.regimens_signed
// - Cambia profiles.account_status='active' (no toca is_active)
// Brokers hijos NO pueden acceder.
//
// Secrets requeridos:
// - SERVICE_ROLE_KEY (o ADMIN_SERVICE_ROLE_KEY)
//
// Env provistos por Supabase:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY

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

function cleanString(value: unknown) {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

type Body = {
  regimenId: string;
  fileName: string;
  storagePath: string;
};

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

  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const regimenId = cleanString(body?.regimenId);
  const fileName = cleanString(body?.fileName);
  const storagePath = cleanString(body?.storagePath);
  if (!regimenId || !fileName || !storagePath) {
    return jsonResponse(400, { error: "regimenId, fileName y storagePath son obligatorios." });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return jsonResponse(401, { error: "Unauthorized." });

  const callerId = userData.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: me } = await adminClient
    .from("profiles")
    .select("id, role, is_active, account_status, org_id, is_referred")
    .eq("id", callerId)
    .maybeSingle();

  if (!me || me.is_active === false || me.account_status === "deactivated") {
    return jsonResponse(403, { error: "Usuario desactivado." });
  }

  const role = String(me.role ?? "").toLowerCase();
  if (role !== "broker" && role !== "inmobiliaria") return jsonResponse(403, { error: "Forbidden." });

  if (role === "broker" && me.org_id) {
    const { data: parent } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "inmobiliaria")
      .eq("org_id", me.org_id)
      .eq("is_active", true)
      .maybeSingle();
    if (parent?.id) {
      return jsonResponse(403, { error: "Los brokers ligados a una inmobiliaria no pueden enviar régimen firmado." });
    }
  }

  const isReferred = me.is_referred === true;
  let target = role;
  if (isReferred) {
    const suffix = role === "inmobiliaria" ? "_referida" : "_referido";
    target = `${role}${suffix}`;
  }
  const { data: activeReg } = await adminClient
    .from("regimens_master")
    .select("id, target, is_active")
    .eq("id", regimenId)
    .maybeSingle();

  if (!activeReg?.id) return jsonResponse(404, { error: "Régimen no encontrado." });
  if (String(activeReg.target ?? "") !== target) return jsonResponse(403, { error: "Régimen inválido para este rol." });
  if (activeReg.is_active !== true) return jsonResponse(400, { error: "Este régimen no está activo." });

  const { error: insErr } = await adminClient
    .from("regimens_signed")
    .insert({
      user_id: callerId,
      regimen_id: regimenId,
      file_name: fileName,
      storage_bucket: "regimens_signed",
      storage_path: storagePath,
    });

  if (insErr) return jsonResponse(500, { error: "No se pudo guardar el PDF firmado.", details: insErr.message });

  const { error: upErr } = await adminClient
    .from("profiles")
    .update({ account_status: "active" })
    .eq("id", callerId);

  if (upErr) return jsonResponse(500, { error: "No se pudo actualizar el estado.", details: upErr.message });

  // Mantener coherencia madre-hijo: si la inmobiliaria representante firma y queda activa,
  // sus brokers hijos también deben quedar activos (sin tocar desactivados manualmente).
  if (target === "inmobiliaria" && me.org_id) {
    const { error: childErr } = await adminClient
      .from("profiles")
      .update({ account_status: "active" })
      .eq("role", "broker")
      .eq("org_id", me.org_id)
      .eq("is_active", true)
      .neq("account_status", "deactivated");

    if (childErr) {
      console.log("[regimen-user-submit] No se pudieron activar brokers hijos.", childErr);
    }
  }

  return jsonResponse(200, { ok: true, account_status: "active" });
});
