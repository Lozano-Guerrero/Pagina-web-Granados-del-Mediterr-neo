/// <reference lib="deno.ns" />
// Supabase Edge Function: create-referred-user
// - Permite a brokers e inmobiliarias (no referidos) registrar otros brokers o inmobiliarias como referidos.
// - Usa service role (solo backend).
//
// Deploy:
// npx -y supabase functions deploy create-referred-user --use-api --no-verify-jwt

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
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function generatePublicId(prefix: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${prefix}${out}`;
}

function generateTemporaryPassword(length = 26) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

type Body = {
  role: 'broker' | 'inmobiliaria';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string; // Para inmobiliarias
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
    return jsonResponse(500, { error: "Missing Supabase env vars." });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return jsonResponse(401, { error: "Unauthorized." });

  // Decode the JWT payload to extract user ID (sub) without needing a second network call.
  // This is safe because the Supabase Edge runtime already verified the JWT signature.
  let callerId: string | null = null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      callerId = typeof payload?.sub === "string" ? payload.sub : null;
    }
  } catch {
    callerId = null;
  }

  if (!callerId) {
    // Fallback: try getUser via userClient
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return jsonResponse(401, { error: "Unauthorized.", details: userErr?.message ?? "No user returned" });
    }
    callerId = userData.user.id;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerProfErr } = await adminClient
    .from("profiles")
    .select("id, role, is_active, is_referred, account_status")
    .eq("id", callerId)
    .single();

  if (callerProfErr || !callerProfile) return jsonResponse(403, { error: "Unable to read caller profile." });
  if (callerProfile.is_active === false || callerProfile.account_status !== 'active') return jsonResponse(403, { error: "Usuario inactivo no puede referir." });
  if (callerProfile.is_referred === true) return jsonResponse(403, { error: "Los usuarios referidos no pueden referir a otros." });
  if (!['broker', 'inmobiliaria'].includes(String(callerProfile.role ?? "").toLowerCase())) {
    return jsonResponse(403, { error: "Solo brokers o inmobiliarias pueden usar esta función." });
  }

  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const role = cleanString(body?.role)?.toLowerCase();
  const first_name = cleanString(body?.first_name);
  const last_name = cleanString(body?.last_name);
  const email = cleanString(body?.email);
  const phone = cleanString(body?.phone);
  const company_name = cleanString(body?.company_name);

  if (!role || !first_name || !last_name || !email || !phone) {
    return jsonResponse(400, { error: "Campos obligatorios: rol, nombre, apellido, correo y celular." });
  }

  if (role !== 'broker' && role !== 'inmobiliaria') {
    return jsonResponse(400, { error: "El rol de referido debe ser broker o inmobiliaria." });
  }

  if (role === 'inmobiliaria' && !company_name) {
    return jsonResponse(400, { error: "El nombre de la empresa es obligatorio para inmobiliarias." });
  }

  let orgId: string | null = null;

  if (role === 'inmobiliaria') {
    const { data: org, error: orgErr } = await adminClient
      .from("organizations")
      .insert({ company_name })
      .select("id")
      .single();

    if (orgErr) {
      return jsonResponse(500, { error: "Failed to create organization.", details: orgErr.message });
    }
    orgId = org?.id ?? null;
  }

  const temporaryPassword = generateTemporaryPassword();
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      password_setup_required: true,
      password_reset_enabled: false,
    },
    app_metadata: {
      password_setup_required: true,
      password_reset_enabled: false,
    },
  });

  if (createErr || !created?.user) {
    return jsonResponse(500, { error: "Failed to create user.", details: createErr?.message ?? null });
  }

  const prefix = role === 'inmobiliaria' ? 'INM-' : 'BRK-';
  let publicId: string | null = null;
  try {
    const { data: rpcData, error: rpcErr } = await adminClient.rpc("generate_public_id", { prefix });
    if (!rpcErr && typeof rpcData === "string" && rpcData.trim()) publicId = rpcData.trim();
  } catch {
    publicId = null;
  }

  if (!publicId) publicId = generatePublicId(prefix);

  const baseProfile = {
    id: created.user.id,
    first_name,
    last_name,
    email,
    phone,
    role,
    org_id: orgId,
    is_active: true,
    account_status: "inactive",
    is_referred: true,
    referred_by: callerId
  } as Record<string, unknown>;

  const { error: upErr } = await adminClient
    .from("profiles")
    .upsert({ ...baseProfile, public_id: publicId }, { onConflict: "id" });

  if (upErr) {
     return jsonResponse(500, { error: "User created but profile update failed.", details: upErr.message });
  }

  return jsonResponse(200, {
    ok: true,
    user_id: created.user.id,
    public_id: publicId,
    password_setup_required: true,
  });
});
