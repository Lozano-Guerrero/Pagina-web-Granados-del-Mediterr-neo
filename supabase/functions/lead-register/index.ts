// Supabase Edge Function: lead-register
// - Registra leads en HighLevel (LeadConnector) y guarda auditoría en `public.leads`.
// - Requiere usuario autenticado en Supabase Auth y perfil activo en `public.profiles`.
//
// Secrets requeridos (Supabase -> Edge Functions -> Secrets):
// - HIGHLEVEL_PRIVATE_TOKEN
// - HIGHLEVEL_LOCATION_ID
// - HIGHLEVEL_PIPELINE_ID
// - HIGHLEVEL_STAGE_ID
//
// Nota: NO hardcodear tokens/IDs en el repo.

import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const HIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";
const HIGHLEVEL_VERSION = "2021-07-28";

// Fuente: Google Sheet (via n8n webhook). Usado para congelar días de vigencia al crear el lead.
// - P11: días vigencia inicial (columna "Disponible")
// - Q11: días vigencia al pasar a "Reunión" (columna "Separado")
const N8N_CONFIG_URL =
  "https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LeadPayload = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  esquema?: string | null;
  regimen?: string | null;
};

type LotPayload = {
  lotNumber?: string | null;
  type?: string | null;
  areaM2?: number | null;
  pricePerM2?: number | null;
};

type RequestBody = {
  lead: LeadPayload;
  lot?: LotPayload | null;
};

type Esquema = "referidor" | "prospector" | "cerrador";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function normalizeDays(value: number | null, fallback: number): number {
  if (!Number.isFinite(value) || value === null) return fallback;

  // Si viene como porcentaje (0.15 para 15), lo normalizamos como días.
  const maybePercent = value > 0 && value <= 1 ? value * 100 : value;
  const rounded = Math.round(maybePercent);

  return Number.isFinite(rounded) && rounded >= 0 ? rounded : fallback;
}

async function fetchVigenciasFromSheet(): Promise<{ initialDays: number; meetingDays: number }> {
  // Defaults razonables si el webhook falla.
  const defaults = { initialDays: 15, meetingDays: 60 };

  try {
    const res = await fetch(N8N_CONFIG_URL, { method: "GET" });
    if (!res.ok) return defaults;

    const payload = await res.json().catch(() => null);
    const root =
      Array.isArray(payload) && payload[0]
        ? (payload[0].json ?? payload[0])
        : payload;

    const rows: unknown[] =
      root && typeof root === "object" && (root as Record<string, unknown>).lotes
        ? ((root as Record<string, unknown>).lotes as unknown[])
        : [];

    const row11 =
      Array.isArray(rows) ? rows.find((r: any) => Number(r?.row_number) === 11) : null;

    const initialRaw = row11 ? (row11 as any).Disponible ?? (row11 as any).disponible : null;
    const meetingRaw = row11 ? (row11 as any).Separado ?? (row11 as any).separado : null;

    const initialDays = normalizeDays(parseNumeric(initialRaw), defaults.initialDays);
    const meetingDays = normalizeDays(parseNumeric(meetingRaw), defaults.meetingDays);

    return { initialDays, meetingDays };
  } catch {
    return defaults;
  }
}

function normalizeEmail(email: string | null | undefined) {
  const e = (email ?? "").trim().toLowerCase();
  return e.length ? e : null;
}

function normalizePhone(phone: string | null | undefined) {
  const raw = (phone ?? "").trim();
  const digits = raw ? onlyDigits(raw) : "";
  const phoneDigits = digits.length ? digits : null;
  const last10 = phoneDigits && phoneDigits.length >= 10 ? phoneDigits.slice(-10) : null;

  // Heurística simple para construir E.164 (MX-first). Si no se puede, se deja null.
  let e164: string | null = null;
  if (phoneDigits) {
    if (phoneDigits.length === 10) {
      e164 = `+52${phoneDigits}`;
    } else if (phoneDigits.length >= 11 && phoneDigits.length <= 15) {
      e164 = `+${phoneDigits}`;
    }
  }

  return {
    phone_raw: raw.length ? raw : null,
    phone_digits: phoneDigits,
    phone_last10: last10,
    phone_e164: e164,
  };
}

function normalizeEsquema(value: string | null | undefined): Esquema | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (raw === "referidor") return "referidor";
  if (raw === "prospector") return "prospector";
  if (raw === "cerrador") return "cerrador";
  return null;
}

function normalizeRegimen(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  return raw.length ? raw : "PENDIENTE_DEFINIR";
}

type RegimenContext = {
  ok: boolean;
  canRegisterLeads?: boolean;
  blockReason?: string | null;
  regimenName?: string | null;
};

async function getRegimenContext(
  userClient: ReturnType<typeof createClient>,
): Promise<RegimenContext | null> {
  try {
    const { data, error } = await userClient.rpc("get_regimen_context");
    if (error) return null;
    if (!data) return null;
    return data as RegimenContext;
  } catch {
    return null;
  }
}

function pickFirstString(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function extractContacts(payload: unknown): unknown[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  const candidates = [
    obj.contacts,
    obj.data,
    obj.items,
    obj.results,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  // Algunos endpoints responden { contacts: { ... } } o { contact: { ... } }
  if (obj.contact && typeof obj.contact === "object") return [obj.contact];
  return [];
}

function getContactId(contact: unknown): string | null {
  if (!contact || typeof contact !== "object") return null;
  const c = contact as Record<string, unknown>;
  const direct = pickFirstString(c, ["id", "contactId", "_id"]);
  if (direct) return direct;
  const nested = c.contact;
  if (nested && typeof nested === "object") {
    return pickFirstString(nested, ["id", "contactId", "_id"]);
  }
  return null;
}

function getContactEmail(contact: unknown): string | null {
  if (!contact || typeof contact !== "object") return null;
  const c = contact as Record<string, unknown>;
  const email = pickFirstString(c, ["email"]);
  return email ? email.toLowerCase() : null;
}

function getContactPhoneDigits(contact: unknown): string | null {
  if (!contact || typeof contact !== "object") return null;
  const c = contact as Record<string, unknown>;
  const phone = pickFirstString(c, ["phone", "phoneNumber", "phone_number", "mobile", "mobilePhone"]);
  if (!phone) return null;
  const digits = onlyDigits(phone);
  return digits.length ? digits : null;
}

function getContactCreatedAt(contact: unknown): string | null {
  if (!contact || typeof contact !== "object") return null;
  const c = contact as Record<string, unknown>;
  return pickFirstString(c, ["createdAt", "dateAdded", "created_at", "created"]);
}

type HighLevelAuth = {
  token: string;
  locationId: string;
};

async function highLevelFetch(auth: HighLevelAuth, path: string, init?: RequestInit & { query?: Record<string, string | undefined> }) {
  const url = new URL(`${HIGHLEVEL_BASE_URL}${path}`);
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (typeof v === "string" && v.length) url.searchParams.set(k, v);
    }
  }

  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${auth.token}`);
  headers.set("Version", HIGHLEVEL_VERSION);
  headers.set("Accept", "application/json");

  const res = await fetch(url.toString(), { ...init, headers });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`HighLevel ${init?.method ?? "GET"} ${path} failed (${res.status}): ${msg}`);
  }

  return body;
}

async function highLevelGetContact(auth: HighLevelAuth, contactId: string) {
  const body = await highLevelFetch(auth, `/contacts/${encodeURIComponent(contactId)}`, {
    method: "GET",
    query: { locationId: auth.locationId },
  });

  // Normalizamos a un solo objeto contact
  if (body && typeof body === "object" && (body as Record<string, unknown>).contact) {
    return (body as Record<string, unknown>).contact;
  }
  return body;
}

async function highLevelSearchContacts(auth: HighLevelAuth, query: string, limit = 20) {
  const body = await highLevelFetch(auth, "/contacts/", {
    method: "GET",
    query: {
      locationId: auth.locationId,
      query,
      limit: String(limit),
    },
  });
  return extractContacts(body);
}

function bestPhoneMatch(contacts: unknown[], phoneDigits: string): { contact: unknown; matchScore: number } | null {
  const targetLast10 = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : null;

  let best: { contact: unknown; matchScore: number } | null = null;
  for (const c of contacts) {
    const cDigits = getContactPhoneDigits(c);
    if (!cDigits) continue;

    let score = 0;
    if (cDigits === phoneDigits) score = 100;
    else if (targetLast10 && cDigits.endsWith(targetLast10)) score = 80;
    else if (targetLast10 && cDigits.includes(targetLast10)) score = 60;
    else continue;

    if (!best || score > best.matchScore) best = { contact: c, matchScore: score };
    if (score === 100) break;
  }
  return best;
}

function bestEmailMatch(contacts: unknown[], email: string): unknown | null {
  const target = email.toLowerCase();
  for (const c of contacts) {
    const cEmail = getContactEmail(c);
    if (cEmail && cEmail === target) return c;
  }
  return null;
}

async function highLevelCreateContact(
  auth: HighLevelAuth,
  payload: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    tag: string | null;
  },
) {
  const body = await highLevelFetch(auth, "/contacts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locationId: auth.locationId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(payload.companyName ? { companyName: payload.companyName } : {}),
      ...(payload.tag ? { tags: [payload.tag] } : {}),
    }),
  });

  // Intenta extraer id de varias formas
  if (body && typeof body === "object") {
    const asObj = body as Record<string, unknown>;
    const contactLike = asObj.contact ?? asObj.data ?? asObj;
    const id = getContactId(contactLike);
    const createdAt = getContactCreatedAt(contactLike);
    return { id, createdAt, raw: body };
  }

  return { id: null as string | null, createdAt: null as string | null, raw: body };
}

async function highLevelCreateOpportunity(
  auth: HighLevelAuth,
  payload: {
    contactId: string;
    pipelineId: string;
    stageId: string;
    name: string;
    source: string | null;
  },
) {
  const body = await highLevelFetch(auth, "/opportunities/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locationId: auth.locationId,
      pipelineId: payload.pipelineId,
      pipelineStageId: payload.stageId,
      contactId: payload.contactId,
      name: payload.name,
      ...(payload.source ? { source: payload.source } : {}),
      status: "open",
    }),
  });

  if (body && typeof body === "object") {
    const asObj = body as Record<string, unknown>;
    const id =
      pickFirstString(asObj, ["id", "opportunityId"]) ??
      pickFirstString(asObj.opportunity, ["id", "opportunityId"]) ??
      pickFirstString(asObj.data, ["id", "opportunityId"]);
    return { id, raw: body };
  }

  return { id: null as string | null, raw: body };
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
  const hlStageId = Deno.env.get("HIGHLEVEL_STAGE_ID");

  const hlMissing: string[] = [];
  if (!hlToken) hlMissing.push("HIGHLEVEL_PRIVATE_TOKEN");
  if (!hlLocationId) hlMissing.push("HIGHLEVEL_LOCATION_ID");
  if (!hlPipelineId) hlMissing.push("HIGHLEVEL_PIPELINE_ID");
  if (!hlStageId) hlMissing.push("HIGHLEVEL_STAGE_ID");

  if (hlMissing.length) {
    return jsonResponse(500, { error: `Missing ${hlMissing[0]}`, missing: hlMissing });
  }

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

  let profile: any = null;
  let profileErr: any = null;

  {
    const attempt = await adminClient
      .from("profiles")
      .select("id, public_id, role, is_active, account_status, first_name, last_name, email, phone, org_id, is_referred")
      .eq("id", userId)
      .single();

    profile = attempt.data;
    profileErr = attempt.error;

    // Compat: si aún no existe alguna columna nueva en la DB, reintentamos sin ella.
    if (profileErr && (/public_id/i.test(String(profileErr.message ?? "")) || /account_status/i.test(String(profileErr.message ?? "")))) {
      const fallback = await adminClient
        .from("profiles")
        .select("id, role, is_active, first_name, last_name, email, phone, org_id")
        .eq("id", userId)
        .single();

      profile = fallback.data;
      profileErr = fallback.error;
    }
  }

    if (profileErr || !profile) return jsonResponse(403, { error: "Unable to read profile." });
    if (profile.is_active === false) return jsonResponse(403, { error: "Usuario inactivo." });

    const actorPublicId = String(profile?.public_id || "").trim() || userId.slice(0, 6).toUpperCase();

    let body: RequestBody | null = null;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const lead = body?.lead;
  const lot = body?.lot ?? null;
  const firstName = (lead?.firstName ?? "").trim();
  const lastName = (lead?.lastName ?? "").trim();

  if (!firstName || !lastName) {
    return jsonResponse(400, { error: "lead.firstName y lead.lastName son obligatorios." });
  }

  const leadEmail = normalizeEmail(lead?.email ?? null);
  const phoneNorm = normalizePhone(lead?.phone ?? null);
  const esquema = normalizeEsquema(lead?.esquema ?? null);
  const regimenInput = normalizeRegimen(lead?.regimen ?? null);

  if (!esquema) {
    return jsonResponse(400, { error: "Esquema obligatorio.", details: "Valores: referidor|prospector|cerrador" });
  }

  // Bloqueo por Régimen: solo afecta REGISTRO de leads (no login).
  const regimenCtx = await getRegimenContext(userClient);
  if (regimenCtx?.ok && regimenCtx?.canRegisterLeads === false) {
    return jsonResponse(403, { error: regimenCtx.blockReason || "Debes enviar el nuevo régimen firmado para continuar." });
  }

  // Congelamos el régimen del lead con el valor activo aplicable (si existe).
  const regimen = normalizeRegimen(regimenCtx?.regimenName ?? regimenInput);

  if (!phoneNorm.phone_digits && !leadEmail) {
    return jsonResponse(400, { error: "Captura al menos teléfono o email del lead." });
  }

  // Congelar vigencias (P11/Q11) al momento de crear el lead.
  const vigencias = await fetchVigenciasFromSheet();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + vigencias.initialDays * 24 * 60 * 60 * 1000);

  // Contexto del actor + "madre-hijo" usando el esquema actual (org_id).
  const actorName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  const actor = {
    id: userId,
    name: actorName || profile.email || "Usuario",
    email: (profile.email ?? null) as string | null,
    phone: (profile.phone ?? null) as string | null,
  };

  let inmobiliariaId: string | null = null;
  let inmobiliariaName: string | null = null;
  let orgType: "independent" | "inmobiliaria" = "independent";

  if (profile.role === "inmobiliaria") {
    orgType = "inmobiliaria";
    inmobiliariaId = userId;

    if (profile.org_id) {
      const { data: org } = await adminClient
        .from("organizations")
        .select("company_name")
        .eq("id", profile.org_id)
        .single();
      inmobiliariaName = org?.company_name ?? null;
    }

    if (!inmobiliariaName) {
      inmobiliariaName = actor.name;
    }
  } else if (profile.role === "broker" && profile.org_id && !profile.is_referred) {
    const { data: rep } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("org_id", profile.org_id)
      .eq("role", "inmobiliaria")
      .limit(1)
      .maybeSingle();

    if (rep?.id) {
      orgType = "inmobiliaria";
      inmobiliariaId = rep.id;

      const { data: org } = await adminClient
        .from("organizations")
        .select("company_name")
        .eq("id", profile.org_id)
        .single();
      inmobiliariaName =
        (org?.company_name ?? `${rep.first_name ?? ""} ${rep.last_name ?? ""}`.trim()) ||
        rep.email ||
        null;
    }
  }

  const hlAuth: HighLevelAuth = {
    token: hlToken!,
    locationId: hlLocationId!,
  };

  const highLevelCompanyName = orgType === "inmobiliaria" ? (inmobiliariaName ?? null) : null;
  const highLevelSource = profile.role === "inmobiliaria"
    ? `${actor.name} (Rep.)`
    : actor.name;

  const leadRowBase = {
    created_by_user_id: userId,
    created_by_role: profile.role as string,
    inmobiliaria_id: inmobiliariaId,
    inmobiliaria_name: inmobiliariaName,
    lead_first_name: firstName,
    lead_last_name: lastName,
    lead_email: leadEmail,
    lead_phone: phoneNorm.phone_raw,
    lead_phone_digits: phoneNorm.phone_digits,
    esquema,
    regimen,

    // Vigencias (congeladas desde el sheet al momento de crear el lead)
    lead_state: "VIGENTE",
    initial_days: vigencias.initialDays,
    meeting_days: vigencias.meetingDays,
    expires_at: expiresAt.toISOString(),

    lot_number: lot?.lotNumber ?? null,
    lot_type: lot?.type ?? null,
    lot_area_m2: lot?.areaM2 ?? null,
    lot_price_per_m2: lot?.pricePerM2 ?? null,
  };

  const safeInsertLead = async (row: Record<string, unknown>) => {
    const attempt = async (payload: Record<string, unknown>) => {
      const { data, error } = await adminClient.from("leads").insert(payload).select("id").single();
      return { id: data?.id ?? null, error };
    };

    const first = await attempt(row);
    if (!first.error) return first;

    // Si la DB aún no tiene la migración `supabase/leads_vigencias.sql`, reintentamos sin esas columnas.
    const msg = String(first.error?.message ?? "");
    if (
      msg.includes("lead_state") ||
      msg.includes("initial_days") ||
      msg.includes("meeting_days") ||
      msg.includes("expires_at")
    ) {
      const { lead_state, initial_days, meeting_days, expires_at, meeting_set_at, closed_at, expired_at, ...rest } = row;
      return await attempt(rest);
    }

    // Si la DB aún no tiene la migración de esquema/régimen, reintentamos sin esas columnas.
    if (msg.includes("esquema") || msg.includes("regimen")) {
      const { esquema, regimen, ...rest } = row;
      return await attempt(rest);
    }

    return first;
  };

  try {
    // 1) Buscar contacto primero por celular (digits)
    let existingContact: unknown | null = null;
    let matchType: "phone" | "email" | null = null;

    if (phoneNorm.phone_digits) {
      const queries = Array.from(
        new Set(
          [
            phoneNorm.phone_digits,
            phoneNorm.phone_last10,
            phoneNorm.phone_e164 ? onlyDigits(phoneNorm.phone_e164) : null,
          ].filter((v): v is string => Boolean(v)),
        ),
      );

      for (const q of queries) {
        const contacts = await highLevelSearchContacts(hlAuth, q, 20);
        const best = bestPhoneMatch(contacts, phoneNorm.phone_digits);
        if (best?.contact) {
          existingContact = best.contact;
          matchType = "phone";
          break;
        }
      }
    }

    // 2) Si no hubo match por teléfono y existe email, buscar por email
    if (!existingContact && leadEmail) {
      const contacts = await highLevelSearchContacts(hlAuth, leadEmail, 20);
      const best = bestEmailMatch(contacts, leadEmail);
      if (best) {
        existingContact = best;
        matchType = "email";
      }
    }

    // 3) Si existe, registrar auditoría y regresar EXISTS
    if (existingContact) {
      const contactId = getContactId(existingContact);
      let existingSince: string | null = getContactCreatedAt(existingContact);

      // Si no viene fecha en el search, pedimos el contacto completo.
      if (contactId && !existingSince) {
        try {
          const full = await highLevelGetContact(hlAuth, contactId);
          existingSince = getContactCreatedAt(full) ?? null;
        } catch {
          // best-effort; no bloquear por esto
        }
      }

      const { id: leadRowId } = await safeInsertLead({
        ...leadRowBase,
        hl_status: "EXISTS",
        hl_contact_id: contactId,
        hl_existing_since: existingSince,
        hl_match_type: matchType,
      });

      return jsonResponse(200, {
        status: "EXISTS",
        message: "Este lead ya fue registrado anteriormente.",
        matchType,
        existingSince,
        contactId,
        leadRowId,
      });
    }

    // 4) Crear contacto
    const createContactRes = await highLevelCreateContact(hlAuth, {
      firstName,
      lastName,
      email: leadEmail,
      phone: phoneNorm.phone_e164 ?? phoneNorm.phone_raw,
      companyName: highLevelCompanyName,
      tag: esquema,
    });

    const contactId = createContactRes.id;
    if (!contactId) {
      const { id: leadRowId } = await safeInsertLead({
        ...leadRowBase,
        hl_status: "ERROR",
        hl_error: "HighLevel: No se pudo obtener contactId al crear contacto.",
      });
      return jsonResponse(500, { error: "HighLevel: no se pudo crear contacto.", leadRowId });
    }

    // 5) Crear oportunidad
    const oppName = `${actorPublicId} - ${firstName} ${lastName}`.trim();
    const createOppRes = await highLevelCreateOpportunity(hlAuth, {
      contactId,
      pipelineId: hlPipelineId!,
      stageId: hlStageId!,
      name: oppName,
      source: highLevelSource,
    });

    const opportunityId = createOppRes.id;
    if (!opportunityId) {
      const { id: leadRowId } = await safeInsertLead({
        ...leadRowBase,
        hl_status: "ERROR",
        hl_contact_id: contactId,
        hl_error: "HighLevel: oportunidad creada sin ID (o fallo al crear oportunidad).",
      });
      return jsonResponse(500, { error: "HighLevel: no se pudo crear oportunidad.", contactId, leadRowId });
    }

    const { id: leadRowId } = await safeInsertLead({
      ...leadRowBase,
      hl_status: "CREATED",
      hl_contact_id: contactId,
      hl_opportunity_id: opportunityId,
    });

    return jsonResponse(200, {
      status: "CREATED",
      contactId,
      opportunityId,
      leadRowId,
    });
  } catch (err) {
    const msg = String(err?.message ?? err ?? "Unknown error");
    const { id: leadRowId } = await safeInsertLead({
      ...leadRowBase,
      hl_status: "ERROR",
      hl_error: msg,
    });
    return jsonResponse(500, { status: "ERROR", error: "Lead register failed.", details: msg, leadRowId });
  }
});
