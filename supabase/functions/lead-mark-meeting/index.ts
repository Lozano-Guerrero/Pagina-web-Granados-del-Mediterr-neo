// Supabase Edge Function: lead-mark-meeting
// - Cambia un lead a estado REUNION y resetea su vigencia usando `meeting_days` congelado.
// - Actualiza el stage de la Opportunity en HighLevel.
//
// Secrets requeridos:
// - SERVICE_ROLE_KEY (o ADMIN_SERVICE_ROLE_KEY)
// - HIGHLEVEL_PRIVATE_TOKEN
// - HIGHLEVEL_LOCATION_ID
// - HIGHLEVEL_PIPELINE_ID (recomendado para updates)
// - HIGHLEVEL_STAGE_ID_REUNION

import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const HIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const HIGHLEVEL_VERSION = "2021-07-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = { leadId: string };

type HighLevelAuth = {
  token: string;
  locationId: string;
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function canAccessLead(profile: { role: string }, userId: string, lead: any) {
  const role = String(profile.role ?? "").toLowerCase();
  if (role === "admin" || role === "subadmin") return true;
  if (role === "inmobiliaria") {
    return lead?.created_by_user_id === userId || lead?.inmobiliaria_id === userId;
  }
  return lead?.created_by_user_id === userId;
}

async function highLevelRawFetch(auth: HighLevelAuth, path: string, init?: RequestInit) {
  const url = new URL(`${HIGHLEVEL_BASE_URL}${path}`);
  url.searchParams.set("locationId", auth.locationId);

  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${auth.token}`);
  headers.set("Version", HIGHLEVEL_VERSION);
  headers.set("Accept", "application/json");

  const res = await fetch(url.toString(), { ...init, headers });
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

async function highLevelRawFetchWithQuery(
  auth: HighLevelAuth,
  path: string,
  init: RequestInit | undefined,
  locationQueryKey: string | null,
) {
  const url = new URL(`${HIGHLEVEL_BASE_URL}${path}`);
  if (locationQueryKey) url.searchParams.set(locationQueryKey, auth.locationId);

  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${auth.token}`);
  headers.set("Version", HIGHLEVEL_VERSION);
  headers.set("Accept", "application/json");

  const res = await fetch(url.toString(), { ...init, headers });
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

async function highLevelUpdateOpportunityStage(
  auth: HighLevelAuth,
  params: {
    opportunityId: string;
    stageId: string;
    pipelineId?: string | null;
    contactId?: string | null;
    name?: string | null;
    status?: string | null;
  },
) {
  const opportunityId = params.opportunityId;
  const stageId = params.stageId;
  const pipelineId = params.pipelineId ?? null;
  const contactId = params.contactId ?? null;
  const name = params.name ?? null;
  const status = params.status ?? "open";

  const pathBase = `/opportunities/${encodeURIComponent(opportunityId)}`;
  const paths = [pathBase, `${pathBase}/`];
  const locationQueryKeys: Array<string | null> = ["locationId", "location_id", null];

  const payloads: Record<string, unknown>[] = [
    {
      ...(pipelineId ? { pipelineId } : {}),
      pipelineStageId: stageId,
      ...(contactId ? { contactId } : {}),
      ...(name ? { name } : {}),
      ...(status ? { status } : {}),
    },
    {
      ...(pipelineId ? { pipelineId } : {}),
      pipelineStageId: stageId,
    },
  ];

  const attempts: Array<{
    method: string;
    path: string;
    locationQueryKey: string | null;
    status: number;
    body: unknown;
  }> = [];

  let last: { ok: boolean; status: number; body: unknown } | null = null;
  for (const locationQueryKey of locationQueryKeys) {
    for (const path of paths) {
      for (const body of payloads) {
        const res = await highLevelRawFetchWithQuery(
          auth,
          path,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
          locationQueryKey,
        );

        console.log(
          `[lead-mark-meeting] LeadConnector PUT ${path} (q=${locationQueryKey ?? "none"}) -> ${res.status}`,
          res.body,
        );

        attempts.push({
          method: "PUT",
          path,
          locationQueryKey,
          status: res.status,
          body: res.body,
        });

        last = res;
        if (res.ok && res.status >= 200 && res.status < 300) {
          return { ok: true, status: res.status, body: res.body, attempts };
        }
      }
    }
  }

  const errBody = last?.body ? (typeof last.body === "string" ? last.body : JSON.stringify(last.body)) : "";
  return {
    ok: false,
    status: last?.status ?? 0,
    error: `No se pudo actualizar el stage (HTTP ${last?.status ?? "?"}): ${errBody}`,
    attempts,
  };
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

  const hlToken = Deno.env.get("HIGHLEVEL_PRIVATE_TOKEN");
  const hlLocationId = Deno.env.get("HIGHLEVEL_LOCATION_ID");
  const hlPipelineId = Deno.env.get("HIGHLEVEL_PIPELINE_ID");
  const hlStageReunion = Deno.env.get("HIGHLEVEL_STAGE_ID_REUNION");

  const hlMissing: string[] = [];
  if (!hlToken) hlMissing.push("HIGHLEVEL_PRIVATE_TOKEN");
  if (!hlLocationId) hlMissing.push("HIGHLEVEL_LOCATION_ID");
  if (!hlStageReunion) hlMissing.push("HIGHLEVEL_STAGE_ID_REUNION");
  if (hlMissing.length) return jsonResponse(500, { error: `Missing ${hlMissing[0]}`, missing: hlMissing });

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

  const userId = userData.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) return jsonResponse(403, { error: "Unable to read profile." });
  if (profile.is_active === false) return jsonResponse(403, { error: "Usuario inactivo." });

  let body: RequestBody | null = null;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const leadId = (body?.leadId ?? "").trim();
  if (!leadId) return jsonResponse(400, { error: "leadId es obligatorio." });

  const { data: lead, error: leadErr } = await adminClient
    .from("leads")
    .select("id, created_by_user_id, inmobiliaria_id, hl_status, hl_opportunity_id, hl_contact_id, lead_first_name, lead_last_name, lead_state, expires_at, meeting_days")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) return jsonResponse(404, { error: "Lead no encontrado." });
  if (!canAccessLead(profile, userId, lead)) return jsonResponse(403, { error: "Forbidden." });

  if (lead.hl_status !== "CREATED") {
    return jsonResponse(400, { error: "Solo se pueden avanzar leads con hl_status=CREATED." });
  }

  const now = new Date();
  const expiresAt = lead.expires_at ? new Date(lead.expires_at) : null;
  if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= now.getTime()) {
    return jsonResponse(409, { error: "Lead expirado. Actualiza la tabla.", status: "EXPIRADO" });
  }

  if (lead.lead_state !== "VIGENTE") {
    return jsonResponse(400, { error: "Solo se puede avanzar a REUNION desde estado VIGENTE." });
  }

  const meetingDays = Number.isFinite(Number(lead.meeting_days)) ? Number(lead.meeting_days) : 0;
  const nextExpiresAt = new Date(now.getTime() + Math.max(0, meetingDays) * 24 * 60 * 60 * 1000);

  const { data: updated, error: upErr } = await adminClient
    .from("leads")
    .update({
      lead_state: "REUNION",
      meeting_set_at: now.toISOString(),
      expires_at: nextExpiresAt.toISOString(),
    })
    .eq("id", leadId)
    .select("id, lead_state, expires_at, meeting_days, hl_opportunity_id")
    .single();

  if (upErr || !updated) return jsonResponse(500, { error: "No se pudo actualizar el lead." });

  const hlAuth: HighLevelAuth = { token: hlToken!, locationId: hlLocationId! };
  let stageUpdated = true;
  let stageError: string | null = null;
  let stageAttempts: unknown = null;

  if (updated.hl_opportunity_id) {
    const leadName =
      `Granados Lead - ${(lead?.lead_first_name ?? "").trim()} ${(lead?.lead_last_name ?? "").trim()}`.replace(/\s+/g, " ").trim();

    const res = await highLevelUpdateOpportunityStage(hlAuth, {
      opportunityId: updated.hl_opportunity_id,
      stageId: hlStageReunion!,
      pipelineId: hlPipelineId ?? null,
      contactId: lead?.hl_contact_id ?? null,
      name: leadName.length ? leadName : null,
      status: "open",
    });
    stageUpdated = res.ok;
    stageError = res.ok ? null : (res.error ?? null);
    stageAttempts = res.ok ? null : (res.attempts ?? null);
  } else {
    console.log("[lead-mark-meeting] Lead sin hl_opportunity_id; se omite update de stage.");
  }

  return jsonResponse(200, {
    status: "OK",
    leadId: updated.id,
    lead_state: updated.lead_state,
    expires_at: updated.expires_at,
    meeting_days: updated.meeting_days,
    highlevel: {
      stageUpdated,
      stageError,
      ...(stageAttempts ? { stageAttempts } : {}),
    },
  });
});
