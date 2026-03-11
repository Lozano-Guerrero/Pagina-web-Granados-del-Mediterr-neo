import { isSupabaseConfigured, supabase } from './supabaseClient';

function isJwt(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(Boolean);
}

export async function getFreshAccessToken() {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase no está configurado.');
    }

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
        throw new Error('No se pudo leer tu sesión. Vuelve a iniciar sesión.');
    }

    let session = sessionData?.session ?? null;
    let accessToken = session?.access_token;

    const willExpireSoon = () => {
        const exp = session?.expires_at;
        if (!exp) return false;
        const msLeft = exp * 1000 - Date.now();
        return msLeft <= 60 * 1000; // 60s
    };

    // Si el token expiró o está por expirar, refrescamos antes de llamar Edge Functions.
    if (session && willExpireSoon()) {
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
            throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
        }
        session = refreshed?.session ?? null;
        accessToken = session?.access_token;
    }

    // En algunos edge-cases la sesión guardada puede estar stale; refrescamos.
    if (!isJwt(accessToken)) {
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
            throw new Error('No se pudo refrescar tu sesión. Vuelve a iniciar sesión.');
        }
        session = refreshed?.session ?? null;
        accessToken = session?.access_token;
    }

    if (!isJwt(accessToken)) {
        throw new Error('No hay sesión activa. Vuelve a iniciar sesión.');
    }

    return accessToken;
}

function buildEdgeErrorMessage({ status, parsed, rawText }) {
    const serverMsg = parsed?.error ? String(parsed.error) : null;
    const messageMsg = parsed?.message ? String(parsed.message) : null;
    const detailsMsg = parsed?.details ? String(parsed.details) : null;
    const missingMsg = Array.isArray(parsed?.missing) ? `Faltan: ${parsed.missing.join(', ')}` : null;
    const rawMsg = !parsed && rawText ? `Respuesta: ${String(rawText).slice(0, 180)}` : null;
    const statusMsg = status ? `HTTP ${status}` : null;

    return (
        [serverMsg, messageMsg, detailsMsg, missingMsg, rawMsg, statusMsg]
            .filter(Boolean)
            .join(' — ') || (statusMsg || 'Error.')
    );
}

export async function edgePost(functionName, payload) {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase no está configurado.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Faltan credenciales de Supabase en .env.');
    }

    const endpoint = `${supabaseUrl}/functions/v1/${functionName}`;

    const parse = async (response) => {
        const rawText = await response.text();
        let parsed = null;
        try {
            parsed = rawText ? JSON.parse(rawText) : null;
        } catch {
            parsed = null;
        }
        return { rawText, parsed };
    };

    const doRequest = async (accessToken) => {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload ?? {}),
        });
        const body = await parse(response);
        return { response, ...body };
    };

    let accessToken = await getFreshAccessToken();
    let first = await doRequest(accessToken);

    // Si el JWT expiró entre lecturas o el navegador tiene token stale, intentamos 1 refresh + retry.
    if (first.response.status === 401) {
        const msg = String(first.parsed?.message || first.parsed?.error || first.rawText || '').toLowerCase();
        const looksLikeJwtProblem = msg.includes('invalid jwt') || msg.includes('valid bearer token') || msg.includes('missing bearer');
        if (looksLikeJwtProblem) {
            try {
                await supabase.auth.refreshSession();
                accessToken = await getFreshAccessToken();
                first = await doRequest(accessToken);
            } catch {
                // ignore, we'll throw the original/next error below
            }
        }
    }

    if (!first.response.ok) {
        // En lugar de hacer throw inmediato de "Tu sesión expiró", devolvemos el error real del edge function
        // para que el Dashboard pueda manejar el 401 de expiración de leads como un simple error visual
        // sin romper la sesión del usuario silenciosamente en un useEffect.
        if (first.response.status === 401) {
            console.warn('[edgeFetch] Recibido 401 de Edge Function:', functionName, first.parsed);
        }
        
        throw new Error(buildEdgeErrorMessage({ status: first.response.status, parsed: first.parsed, rawText: first.rawText }));
    }

    return first.parsed ?? null;
}
