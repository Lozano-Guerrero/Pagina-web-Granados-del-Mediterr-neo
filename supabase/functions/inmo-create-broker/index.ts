// Supabase Edge Function: inmo-create-broker
// - Permite a una inmobiliaria (role=inmobiliaria) registrar brokers "hijos" en su misma org_id.
// - Usa service role (solo backend). NO hardcodea keys.
//
// Secrets requeridos:
// - SERVICE_ROLE_KEY (o ADMIN_SERVICE_ROLE_KEY)
//
// Deploy:
// npx -y supabase functions deploy inmo-create-broker --use-api --no-verify-jwt

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
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
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
  if (!token) return jsonResponse(401, { error: "Unauthorized.", details: "This endpoint requires a valid Bearer token" });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return jsonResponse(401, { error: "Unauthorized.", details: userErr?.message ?? null });
  }

  const callerId = userData.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerProfErr } = await adminClient
    .from("profiles")
    .select("id, role, is_active, org_id, account_status")
    .eq("id", callerId)
    .single();

  if (callerProfErr || !callerProfile) return jsonResponse(403, { error: "Unable to read caller profile." });
  if (callerProfile.is_active === false) return jsonResponse(403, { error: "Usuario inactivo." });
  if (String(callerProfile.role ?? "").toLowerCase() !== "inmobiliaria") return jsonResponse(403, { error: "Forbidden." });
  if (!callerProfile.org_id) return jsonResponse(400, { error: "Tu cuenta no está vinculada a una inmobiliaria (org_id). Contacta al admin." });

  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const first_name = cleanString(body?.first_name);
  const last_name = cleanString(body?.last_name);
  const email = cleanString(body?.email);
  const phone = cleanString(body?.phone);

  if (!first_name || !last_name || !email || !phone) {
    return jsonResponse(400, { error: "Campos obligatorios: nombre, apellido, correo y celular." });
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

  let publicId: string | null = null;
  try {
    const { data: rpcData, error: rpcErr } = await adminClient.rpc("generate_public_id", { prefix: "BRK-" });
    if (!rpcErr && typeof rpcData === "string" && rpcData.trim()) publicId = rpcData.trim();
  } catch {
    publicId = null;
  }

  if (!publicId) publicId = generatePublicId("BRK-");

  const baseProfile = {
    id: created.user.id,
    first_name,
    last_name,
    email,
    phone,
    role: "broker",
    org_id: callerProfile.org_id,
    is_active: true,
    // Nuevo broker inicia INACTIVO hasta completar primera configuración de contraseña.
    account_status: "inactive",
  } as Record<string, unknown>;

  // Compat si la DB aún no tiene public_id.
  const { error: upErr } = await adminClient
    .from("profiles")
    .upsert({ ...baseProfile, public_id: publicId }, { onConflict: "id" });

  if (upErr) {
    const msg = String(upErr?.message ?? "");
    const missingPublicId = /public_id/i.test(msg) && /does not exist|unknown/i.test(msg);
    const missingAccountStatus = /account_status/i.test(msg) && /does not exist|unknown/i.test(msg);

    if (missingPublicId && missingAccountStatus) {
      // Retry sin public_id y sin account_status
      const { account_status, ...rest } = baseProfile as Record<string, unknown>;
      const { error: retryErr } = await adminClient.from("profiles").upsert(rest, { onConflict: "id" });
      if (retryErr) return jsonResponse(500, { error: "User created but profile update failed.", details: retryErr.message });
      publicId = null;
    } else if (missingPublicId) {
      // Retry sin public_id
      const { error: retryErr } = await adminClient.from("profiles").upsert(baseProfile, { onConflict: "id" });
      if (retryErr) return jsonResponse(500, { error: "User created but profile update failed.", details: retryErr.message });
      publicId = null;
    } else if (missingAccountStatus) {
      // Retry sin account_status
      const { account_status, ...rest } = baseProfile as Record<string, unknown>;
      const { error: retryErr } = await adminClient.from("profiles").upsert({ ...rest, public_id: publicId }, { onConflict: "id" });
      if (retryErr) return jsonResponse(500, { error: "User created but profile update failed.", details: retryErr.message });
    } else {
      return jsonResponse(500, { error: "User created but profile update failed.", details: upErr.message });
    }
  }

  return jsonResponse(200, {
    ok: true,
    user_id: created.user.id,
    public_id: publicId,
    password_setup_required: true,
  });
});
