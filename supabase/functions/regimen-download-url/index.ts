// Supabase Edge Function: regimen-download-url
// Genera signed URL de descarga para:
// - Régimen master (activo o por id si admin)
// - PDF firmado (own si usuario, cualquiera si admin)
//
// Brokers hijos NO pueden descargar master ni subir firmado.
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

type Body =
  | { kind: "master"; target?: "broker" | "inmobiliaria"; regimenId?: string }
  | { kind: "signed"; signedId: string };

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

  const kind = cleanString((body as any)?.kind) as Body["kind"] | null;
  if (!kind || (kind !== "master" && kind !== "signed")) {
    return jsonResponse(400, { error: "kind inválido (master|signed)." });
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
    .select("id, role, is_active, account_status, org_id")
    .eq("id", callerId)
    .maybeSingle();

  if (!me || me.is_active === false || me.account_status === "deactivated") {
    return jsonResponse(403, { error: "Usuario desactivado." });
  }

  const role = String(me.role ?? "").toLowerCase();
  const isStaff = role === "admin" || role === "subadmin";

  const isChildBroker = async () => {
    if (role !== "broker" || !me.org_id) return false;
    const { data: parent } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "inmobiliaria")
      .eq("org_id", me.org_id)
      .eq("is_active", true)
      .maybeSingle();
    return Boolean(parent?.id);
  };

  if (kind === "master") {
    const requestedTarget = cleanString((body as any)?.target) as "broker" | "inmobiliaria" | null;
    const requestedRegimenId = cleanString((body as any)?.regimenId);

    // Brokers hijos no pueden descargar master.
    if (!isStaff && (await isChildBroker())) {
      return jsonResponse(403, { error: "No tienes permiso para descargar el régimen." });
    }

    let effectiveTarget: "broker" | "inmobiliaria" | null = null;
    if (isStaff) {
      if (!requestedTarget || !["broker", "inmobiliaria"].includes(requestedTarget)) {
        return jsonResponse(400, { error: "target es obligatorio para admin (broker|inmobiliaria)." });
      }
      effectiveTarget = requestedTarget;
    } else {
      if (role === "inmobiliaria") effectiveTarget = "inmobiliaria";
      else if (role === "broker") effectiveTarget = "broker";
      else return jsonResponse(403, { error: "Forbidden." });
    }

    let regimenRow: any = null;
    if (isStaff && requestedRegimenId) {
      const { data, error } = await adminClient
        .from("regimens_master")
        .select("id, target, display_name, storage_bucket, storage_path")
        .eq("id", requestedRegimenId)
        .maybeSingle();
      if (error) return jsonResponse(500, { error: "No se pudo leer el régimen.", details: error.message });
      regimenRow = data;
    } else {
      const { data, error } = await adminClient
        .from("regimens_master")
        .select("id, target, display_name, storage_bucket, storage_path, version")
        .eq("target", effectiveTarget)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return jsonResponse(500, { error: "No se pudo leer el régimen activo.", details: error.message });
      regimenRow = data;
    }

    if (!regimenRow?.id) return jsonResponse(404, { error: "No hay régimen disponible." });

    const bucket = String(regimenRow.storage_bucket ?? "regimens_master");
    const path = String(regimenRow.storage_path ?? "");
    if (!path) return jsonResponse(500, { error: "Régimen sin storage_path." });

    const { data: urlData, error: urlErr } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 10);

    if (urlErr || !urlData?.signedUrl) {
      return jsonResponse(500, { error: "No se pudo generar URL de descarga.", details: urlErr?.message ?? null });
    }

    return jsonResponse(200, {
      ok: true,
      kind: "master",
      target: effectiveTarget,
      regimenId: regimenRow.id,
      displayName: regimenRow.display_name ?? null,
      url: urlData.signedUrl,
    });
  }

  // kind === "signed"
  const signedId = cleanString((body as any)?.signedId);
  if (!signedId) return jsonResponse(400, { error: "signedId es obligatorio." });

  const { data: signedRow, error: signedErr } = await adminClient
    .from("regimens_signed")
    .select("id, user_id, storage_bucket, storage_path, file_name")
    .eq("id", signedId)
    .maybeSingle();

  if (signedErr) return jsonResponse(500, { error: "No se pudo leer el firmado.", details: signedErr.message });
  if (!signedRow?.id) return jsonResponse(404, { error: "Archivo no encontrado." });

  if (!isStaff && String(signedRow.user_id) !== callerId) {
    return jsonResponse(403, { error: "Forbidden." });
  }

  const bucket = String(signedRow.storage_bucket ?? "regimens_signed");
  const path = String(signedRow.storage_path ?? "");
  if (!path) return jsonResponse(500, { error: "Firmado sin storage_path." });

  const { data: urlData, error: urlErr } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 10);

  if (urlErr || !urlData?.signedUrl) {
    return jsonResponse(500, { error: "No se pudo generar URL de descarga.", details: urlErr?.message ?? null });
  }

  return jsonResponse(200, { ok: true, kind: "signed", signedId, fileName: signedRow.file_name ?? null, url: urlData.signedUrl });
});
