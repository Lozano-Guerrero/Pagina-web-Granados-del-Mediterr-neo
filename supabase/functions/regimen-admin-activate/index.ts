// Supabase Edge Function: regimen-admin-activate
// Admin: activa un Régimen subido (is_active=true) y pone usuarios objetivo en account_status='inactive'.
// - target='broker' => solo brokers independientes (role=broker AND org_id is null)
// - target='inmobiliaria' => inmobiliarias (role=inmobiliaria)
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

type Body = { regimenId: string };

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
  if (!regimenId) return jsonResponse(400, { error: "regimenId es obligatorio." });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return jsonResponse(401, { error: "Unauthorized.", details: userErr?.message ?? null });
  }

  const callerId = userData.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", callerId)
    .maybeSingle();

  if (!callerProfile || callerProfile.is_active === false) return jsonResponse(403, { error: "Forbidden." });
  const callerRole = String(callerProfile.role ?? "").toLowerCase();
  const isStaff = callerRole === "admin" || callerRole === "subadmin";
  if (!isStaff) return jsonResponse(403, { error: "Forbidden." });

  const { data: regimen, error: regErr } = await adminClient
    .from("regimens_master")
    .select("id, target, version, is_active")
    .eq("id", regimenId)
    .single();

  if (regErr || !regimen) return jsonResponse(404, { error: "Régimen no encontrado." });

  const target = String(regimen.target ?? "").toLowerCase();
  if (target !== "broker" && target !== "inmobiliaria") return jsonResponse(400, { error: "Target inválido." });

  // 1) Desactivar el activo anterior (si existe) y activar este.
  const { error: offErr } = await adminClient
    .from("regimens_master")
    .update({ is_active: false })
    .eq("target", target)
    .eq("is_active", true);
  if (offErr) return jsonResponse(500, { error: "No se pudo desactivar el régimen anterior.", details: offErr.message });

  const { error: onErr } = await adminClient
    .from("regimens_master")
    .update({ is_active: true, activated_at: new Date().toISOString() })
    .eq("id", regimenId);
  if (onErr) return jsonResponse(500, { error: "No se pudo activar el régimen.", details: onErr.message });

  // 2) Marcar usuarios como "inactive" (pendientes) para bloquear registro de leads.
  // No tocamos is_active (eso es "Desactivado" manual).
  let affected = 0;
  if (target === "broker") {
    const { data, error } = await adminClient
      .from("profiles")
      .update({ account_status: "inactive" })
      .eq("role", "broker")
      .is("org_id", null)
      .eq("is_active", true)
      .neq("account_status", "deactivated")
      .select("id");
    if (error) return jsonResponse(500, { error: "No se pudo actualizar el estado de brokers.", details: error.message });
    affected = Array.isArray(data) ? data.length : 0;
  } else {
    const { data, error } = await adminClient
      .from("profiles")
      .update({ account_status: "inactive" })
      .eq("role", "inmobiliaria")
      .eq("is_active", true)
      .neq("account_status", "deactivated")
      .select("id, org_id");
    if (error) return jsonResponse(500, { error: "No se pudo actualizar el estado de inmobiliarias.", details: error.message });
    affected = Array.isArray(data) ? data.length : 0;

    // Mantener coherencia madre-hijo: brokers ligados a una inmobiliaria heredan su status.
    const orgIds = Array.isArray(data)
      ? data.map((row: any) => row?.org_id).filter((v: any) => Boolean(v))
      : [];

    if (orgIds.length) {
      const { error: childErr } = await adminClient
        .from("profiles")
        .update({ account_status: "inactive" })
        .eq("role", "broker")
        .in("org_id", orgIds)
        .eq("is_active", true)
        .neq("account_status", "deactivated");

      if (childErr) {
        console.log("[regimen-admin-activate] No se pudieron actualizar brokers hijos.", childErr);
      }
    }
  }

  return jsonResponse(200, { ok: true, regimenId, target, affectedUsers: affected });
});
