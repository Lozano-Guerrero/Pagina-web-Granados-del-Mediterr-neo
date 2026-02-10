// Supabase Edge Function: password-self-service-set
// Flujo público (sin sesión) para:
// - Primera vez: crear contraseña si el usuario fue marcado por admin.
// - Restablecer: crear nueva contraseña si admin habilitó restablecimiento.
//
// Secrets requeridos:
// - SERVICE_ROLE_KEY (o ADMIN_SERVICE_ROLE_KEY o SUPABASE_SERVICE_ROLE_KEY)

import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "first_login" | "reset_password";
type Body = {
  mode: Mode;
  email: string;
  password: string;
  passwordConfirm?: string;
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[A-Za-z]/.test(password)) return "La contraseña debe incluir al menos una letra.";
  if (!/\d/.test(password)) return "La contraseña debe incluir al menos un número.";
  return null;
}

function toBool(value: unknown) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  return false;
}

function mergePasswordFlowMetadata(
  value: unknown,
  nextFlags: { password_setup_required: boolean; password_reset_enabled: boolean },
) {
  const base =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    ...base,
    password_setup_required: nextFlags.password_setup_required,
    password_reset_enabled: nextFlags.password_reset_enabled,
  };
}

type ProfileRow = {
  id: string;
  role?: string | null;
  org_id?: string | null;
  account_status?: string | null;
  is_active?: boolean | null;
};

function normalizeAccountStatus(value: unknown): "active" | "inactive" | "deactivated" | null {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "active") return "active";
  if (status === "inactive") return "inactive";
  if (status === "deactivated") return "deactivated";
  return null;
}

async function resolvePostPasswordAccountStatus(
  adminClient: ReturnType<typeof createClient>,
  profile: ProfileRow,
): Promise<"active" | "inactive" | null> {
  const role = String(profile.role ?? "").toLowerCase();
  if (role !== "broker" && role !== "inmobiliaria") return null;

  if (role === "broker" && profile.org_id) {
    const { data: parentInmo, error: parentErr } = await adminClient
      .from("profiles")
      .select("id, is_active, account_status")
      .eq("role", "inmobiliaria")
      .eq("org_id", profile.org_id)
      .limit(1)
      .maybeSingle();

    if (!parentErr && parentInmo?.id) {
      const parentStatus = normalizeAccountStatus(parentInmo.account_status);
      const parentIsActive = parentInmo.is_active !== false;
      return parentIsActive && parentStatus !== "inactive" && parentStatus !== "deactivated"
        ? "active"
        : "inactive";
    }
  }

  const target = role === "inmobiliaria" ? "inmobiliaria" : "broker";

  const { data: activeReg, error: regErr } = await adminClient
    .from("regimens_master")
    .select("id")
    .eq("target", target)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (regErr || !activeReg?.id) {
    // Si no podemos validar régimen vigente, dejamos activo para no bloquear por error técnico.
    return "active";
  }

  const { data: signed, error: signedErr } = await adminClient
    .from("regimens_signed")
    .select("id")
    .eq("user_id", profile.id)
    .eq("regimen_id", activeReg.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (signedErr) {
    return "active";
  }
  return signed?.id ? "active" : "inactive";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey =
    Deno.env.get("SERVICE_ROLE_KEY") ??
    Deno.env.get("ADMIN_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push("SUPABASE_URL");
    if (!serviceRoleKey) missing.push("SERVICE_ROLE_KEY");
    return jsonResponse(500, { error: "Missing Supabase env vars.", missing });
  }

  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const mode = cleanString(body?.mode)?.toLowerCase() as Mode | null;
  const email = cleanString(body?.email)?.toLowerCase();
  const password = cleanString(body?.password);
  const passwordConfirm = cleanString(body?.passwordConfirm);

  if (!mode || (mode !== "first_login" && mode !== "reset_password")) {
    return jsonResponse(400, { error: "mode inválido (first_login | reset_password)." });
  }
  if (!email || !isValidEmail(email)) {
    return jsonResponse(400, { error: "Correo inválido." });
  }
  if (!password) return jsonResponse(400, { error: "password es obligatorio." });
  if (passwordConfirm !== null && password !== passwordConfirm) {
    return jsonResponse(400, { error: "Las contraseñas no coinciden." });
  }

  const pwdError = validatePassword(password);
  if (pwdError) return jsonResponse(400, { error: pwdError });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, email, role, is_active, account_status, org_id")
    .ilike("email", email)
    .maybeSingle();

  if (profileErr) return jsonResponse(500, { error: "No se pudo validar el correo.", details: profileErr.message });
  if (!profile?.id) return jsonResponse(400, { error: "Este correo no está registrado." });

  const isActive = profile.is_active !== false;
  const accountStatus = String(profile.account_status ?? "active").toLowerCase();
  if (!isActive || accountStatus === "deactivated") {
    return jsonResponse(403, { error: "Usuario desactivado. Solicita reactivación con dirección comercial." });
  }

  const { data: authUserData, error: authUserErr } = await adminClient.auth.admin.getUserById(profile.id);
  if (authUserErr || !authUserData?.user) {
    return jsonResponse(500, { error: "No se pudo leer el usuario de Auth.", details: authUserErr?.message ?? null });
  }

  const userMetadata = authUserData.user.user_metadata ?? {};
  const appMetadata = authUserData.user.app_metadata ?? {};
  const passwordSetupRequired =
    toBool((userMetadata as Record<string, unknown>)?.password_setup_required) ||
    toBool((appMetadata as Record<string, unknown>)?.password_setup_required);
  const passwordResetEnabled =
    toBool((userMetadata as Record<string, unknown>)?.password_reset_enabled) ||
    toBool((appMetadata as Record<string, unknown>)?.password_reset_enabled);

  if (mode === "first_login" && passwordResetEnabled) {
    return jsonResponse(400, {
      error: "Este correo debe usar la ventana de restablecer contraseña.",
    });
  }

  if (mode === "first_login" && !passwordSetupRequired) {
    return jsonResponse(400, {
      error: "Este correo no está habilitado para primera vez. Solicita acceso a dirección comercial.",
    });
  }

  if (mode === "reset_password" && !passwordResetEnabled) {
    return jsonResponse(400, {
      error: "Restablecimiento no habilitado para este correo. Solicítalo al equipo de dirección comercial.",
    });
  }

  const nextUserMetadata = mergePasswordFlowMetadata(userMetadata, {
    password_setup_required: false,
    password_reset_enabled: false,
  });
  const nextAppMetadata = mergePasswordFlowMetadata(appMetadata, {
    password_setup_required: false,
    password_reset_enabled: false,
  });

  const { error: updateErr } = await adminClient.auth.admin.updateUserById(profile.id, {
    password,
    email_confirm: true,
    user_metadata: nextUserMetadata,
    app_metadata: nextAppMetadata,
  });

  if (updateErr) {
    return jsonResponse(500, { error: "No se pudo actualizar la contraseña.", details: updateErr.message });
  }

  // Al completar primera vez/restablecer, recalcular el estado funcional:
  // - Broker hijo: hereda estado de su inmobiliaria.
  // - Broker independiente / inmobiliaria: depende del régimen activo firmado.
  const nextAccountStatus = await resolvePostPasswordAccountStatus(adminClient, profile as ProfileRow);
  if (nextAccountStatus) {
    const { error: profileUpErr } = await adminClient
      .from("profiles")
      .update({ account_status: nextAccountStatus })
      .eq("id", profile.id);

    if (profileUpErr && !/account_status/i.test(String(profileUpErr.message ?? ""))) {
      return jsonResponse(500, { error: "No se pudo actualizar el estado del usuario.", details: profileUpErr.message });
    }
  }

  return jsonResponse(200, { ok: true, mode, email: profile.email ?? email });
});
