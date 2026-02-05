// Supabase Edge Function: regimen-admin-start-upload
// Admin: inicia la subida de un nuevo Régimen (PDF) para brokers o inmobiliarias.
// Flujo:
// 1) Crea registro en public.regimens_master (is_active=false)
// 2) Devuelve signed upload URL + token para subir el PDF a Storage (bucket privado)
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

function safeFileName(fileName: string) {
  const name = fileName.replace(/[/\\?%*:|"<>]/g, "-").trim();
  return name.length ? name : "regimen.pdf";
}

function ensurePdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

type Body = {
  target: "broker" | "inmobiliaria";
  displayName?: string;
  fileName: string;
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

  const target = cleanString(body?.target) as Body["target"] | null;
  const rawFileName = cleanString(body?.fileName);
  const displayNameInput = cleanString(body?.displayName);

  if (!target || !["broker", "inmobiliaria"].includes(target)) {
    return jsonResponse(400, { error: "target inválido (broker|inmobiliaria)." });
  }
  if (!rawFileName) return jsonResponse(400, { error: "fileName es obligatorio." });

  const fileName = safeFileName(rawFileName);
  if (!ensurePdf(fileName)) {
    return jsonResponse(400, { error: "Solo se aceptan PDFs." });
  }

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
    .select("id, role, is_active")
    .eq("id", callerId)
    .single();

  if (callerProfileErr || !callerProfile) return jsonResponse(403, { error: "Unable to read caller profile." });
  if (callerProfile.is_active === false) return jsonResponse(403, { error: "Usuario desactivado." });
  {
    const role = String(callerProfile.role ?? "").toLowerCase();
    const isStaff = role === "admin" || role === "subadmin";
    if (!isStaff) return jsonResponse(403, { error: "Forbidden." });
  }

  const { data: maxRow, error: maxErr } = await adminClient
    .from("regimens_master")
    .select("version")
    .eq("target", target)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) return jsonResponse(500, { error: "No se pudo leer la versión actual.", details: maxErr.message });

  const nextVersion = Number(maxRow?.version ?? 0) + 1;
  const autoDisplayName =
    target === "broker" ? `Régimen Brokers v${nextVersion}` : `Régimen Inmobiliarias v${nextVersion}`;
  const displayName = displayNameInput ?? autoDisplayName;

  const storageBucket = "regimens_master";
  const storagePath = `${target}/v${nextVersion}/${fileName}`;

  const { data: inserted, error: insErr } = await adminClient
    .from("regimens_master")
    .insert({
      target,
      version: nextVersion,
      display_name: displayName,
      file_name: fileName,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      is_active: false,
      created_by_user_id: callerId,
    })
    .select("id, target, version, display_name, storage_bucket, storage_path, is_active")
    .single();

  if (insErr || !inserted) {
    return jsonResponse(500, { error: "No se pudo crear el registro del régimen.", details: insErr?.message ?? null });
  }

  const { data: uploadData, error: uploadErr } = await adminClient.storage
    .from(storageBucket)
    .createSignedUploadUrl(storagePath);

  if (uploadErr || !uploadData?.signedUrl || !uploadData?.token) {
    return jsonResponse(500, {
      error: "No se pudo generar URL de subida.",
      details: uploadErr?.message ?? null,
    });
  }

  return jsonResponse(200, {
    ok: true,
    regimen: inserted,
    upload: {
      bucket: storageBucket,
      path: storagePath,
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
    },
  });
});
