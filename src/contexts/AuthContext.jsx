import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState(null);

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) {
            setLoadingSession(false);
            setSession(null);
            return;
        }

        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSession(data.session ?? null);
            setLoadingSession(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession ?? null);
        });

        return () => {
            mounted = false;
            listener?.subscription?.unsubscribe();
        };
    }, []);

    const refreshProfile = async (currentUserId = session?.user?.id) => {
        if (!currentUserId || !isSupabaseConfigured || !supabase) {
            setProfile(null);
            setProfileError(null);
            return;
        }

        setLoadingProfile(true);
        setProfileError(null);

        // Compat: algunas columnas pueden no existir todavía según migraciones.
        const attempt = await supabase
            .from('profiles')
            .select('id, public_id, first_name, last_name, phone, email, role, org_id, is_active, account_status, created_at')
            .eq('id', currentUserId)
            .maybeSingle();

        let { data, error } = attempt;
        if (error && /public_id|account_status/i.test(String(error.message ?? ''))) {
            const fallback = await supabase
                .from('profiles')
                .select('id, first_name, last_name, phone, email, role, org_id, is_active, created_at')
                .eq('id', currentUserId)
                .maybeSingle();
            data = fallback.data;
            error = fallback.error;
        }

        if (error) setProfileError(error);
        setProfile(data ?? null);
        setLoadingProfile(false);
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (cancelled) return;
            await refreshProfile();
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [session?.user?.id]);

    const value = useMemo(() => {
        return {
            session,
            user: session?.user ?? null,
            profile,
            profileError,
            isSupabaseConfigured,
            loading: loadingSession || loadingProfile,
            refreshProfile
        };
    }, [loadingProfile, loadingSession, profile, profileError, session]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within <AuthProvider>');
    }
    return ctx;
}
