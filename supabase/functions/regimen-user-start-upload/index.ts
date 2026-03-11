// Supabase Edge Function: regimen-user-start-upload
// Inmobiliaria o Broker independiente: inicia la subida del PDF firmado.
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

function safeFileName(fileName: string) {
  const name = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._\-\s]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/^[-_]+|[-_]+$/g, "")
    .trim();
  return name.length ? name : "regimen-firmado.pdf";
}

function ensurePdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

type Body = { fileName: string };

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

  const rawFileName = cleanString(body?.fileName);
  if (!rawFileName) return jsonResponse(400, { error: "fileName es obligatorio." });
  const fileName = safeFileName(rawFileName);
  if (!ensurePdf(fileName)) return jsonResponse(400, { error: "Solo se aceptan PDFs." });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return jsonResponse(401, { error: "Unauthorized.", details: userErr?.message ?? null });
  }

  const callerId = userData.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: me, error: meErr } = await adminClient
    .from("profiles")
    .select("id, role, is_active, account_status, org_id, is_referred")
    .eq("id", callerId)
    .single();

  if (meErr || !me) return jsonResponse(403, { error: "Unable to read profile." });
  if (me.is_active === false || me.account_status === "deactivated") return jsonResponse(403, { error: "Usuario desactivado." });

  const role = String(me.role ?? "").toLowerCase();
  if (role !== "broker" && role !== "inmobiliaria") return jsonResponse(403, { error: "Forbidden." });

  // Broker hijo: si tiene org_id y existe una inmobiliaria con el mismo org_id, no debe poder subir/descargar.
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
  const { data: activeReg, error: regErr } = await adminClient
    .from("regimens_master")
    .select("id, display_name, version, target, storage_bucket, storage_path")
    .eq("target", target)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (regErr) return jsonResponse(500, { error: "No se pudo leer el régimen activo.", details: regErr.message });
  if (!activeReg?.id) return jsonResponse(400, { error: "No hay un régimen activo para este rol." });

  const storageBucket = "regimens_signed";
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const storagePath = `${target}/${callerId}/${activeReg.id}/${stamp}-${fileName}`;

  const { data: uploadData, error: uploadErr } = await adminClient.storage
    .from(storageBucket)
    .createSignedUploadUrl(storagePath);

  if (uploadErr || !uploadData?.signedUrl || !uploadData?.token) {
    return jsonResponse(500, { error: "No se pudo generar URL de subida.", details: uploadErr?.message ?? null });
  }

  return jsonResponse(200, {
    ok: true,
    target,
    regimen: {
      id: activeReg.id,
      display_name: activeReg.display_name,
      version: activeReg.version,
    },
    upload: {
      bucket: storageBucket,
      path: storagePath,
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
      fileName,
    },
  });
});
