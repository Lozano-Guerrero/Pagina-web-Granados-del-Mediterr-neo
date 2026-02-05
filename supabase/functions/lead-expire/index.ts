// Supabase Edge Function: lead-expire
// - Marca leads como EXPIRADO cuando `expires_at <= now()`.
// - Actualiza el stage de la Opportunity en HighLevel.
//
// Secrets requeridos:
// - SERVICE_ROLE_KEY (o ADMIN_SERVICE_ROLE_KEY)
// - HIGHLEVEL_PRIVATE_TOKEN
// - HIGHLEVEL_LOCATION_ID
// - HIGHLEVEL_PIPELINE_ID (recomendado para updates)
// - HIGHLEVEL_STAGE_ID_EXPIRADO

import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const HIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const HIGHLEVEL_VERSION = "2021-07-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = { leadIds: string[] };

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
          `[lead-expire] LeadConnector PUT ${path} (q=${locationQueryKey ?? "none"}) -> ${res.status}`,
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
  const hlStageExpirado = Deno.env.get("HIGHLEVEL_STAGE_ID_EXPIRADO");

  const hlMissing: string[] = [];
  if (!hlToken) hlMissing.push("HIGHLEVEL_PRIVATE_TOKEN");
  if (!hlLocationId) hlMissing.push("HIGHLEVEL_LOCATION_ID");
  if (!hlStageExpirado) hlMissing.push("HIGHLEVEL_STAGE_ID_EXPIRADO");
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

  const leadIds = Array.isArray(body?.leadIds) ? body!.leadIds.map((x) => String(x).trim()).filter(Boolean) : [];
  if (leadIds.length === 0) return jsonResponse(400, { error: "leadIds debe contener al menos 1 id." });

  const { data: leads, error: leadsErr } = await adminClient
    .from("leads")
    .select("id, created_by_user_id, inmobiliaria_id, hl_status, hl_opportunity_id, hl_contact_id, lead_first_name, lead_last_name, lead_state, expires_at")
    .in("id", leadIds);

  if (leadsErr) return jsonResponse(500, { error: "No se pudieron cargar leads." });

  const now = new Date();
  const hlAuth: HighLevelAuth = { token: hlToken!, locationId: hlLocationId! };

  const allowedLeads = (Array.isArray(leads) ? leads : []).filter((l) => canAccessLead(profile, userId, l));

  const toExpire = allowedLeads.filter((l: any) => {
    if (l.hl_status !== "CREATED") return false;
    if (l.lead_state === "CERRADO" || l.lead_state === "EXPIRADO") return false;
    const exp = l.expires_at ? new Date(l.expires_at) : null;
    if (!exp || !Number.isFinite(exp.getTime())) return false;
    return exp.getTime() <= now.getTime();
  });

  const idsToExpire = toExpire.map((l: any) => l.id);
  if (idsToExpire.length === 0) {
    return jsonResponse(200, { status: "OK", expired: 0, expiredIds: [] });
  }

  const { error: upErr } = await adminClient
    .from("leads")
    .update({ lead_state: "EXPIRADO", expired_at: now.toISOString() })
    .in("id", idsToExpire);

  if (upErr) return jsonResponse(500, { error: "No se pudo expirar leads." });

  const stageErrors: Array<{ leadId: string; opportunityId: string; error: string; attempts?: unknown }> = [];
  for (const lead of toExpire) {
    if (!lead.hl_opportunity_id) continue;

    const leadName =
      `Granados Lead - ${(lead?.lead_first_name ?? "").trim()} ${(lead?.lead_last_name ?? "").trim()}`.replace(/\s+/g, " ").trim();

    const res = await highLevelUpdateOpportunityStage(hlAuth, {
      opportunityId: lead.hl_opportunity_id,
      stageId: hlStageExpirado!,
      pipelineId: hlPipelineId ?? null,
      contactId: lead?.hl_contact_id ?? null,
      name: leadName.length ? leadName : null,
      status: "open",
    });
    if (!res.ok) {
      console.error("[lead-expire] HighLevel stage update error:", res.error);
      stageErrors.push({
        leadId: lead.id,
        opportunityId: lead.hl_opportunity_id,
        error: res.error ?? "Unknown error",
        attempts: res.attempts ?? null,
      });
    }
  }

  return jsonResponse(200, {
    status: "OK",
    expired: idsToExpire.length,
    expiredIds: idsToExpire,
    highlevel: {
      stageUpdated: stageErrors.length === 0,
      stageErrors,
    },
  });
});
