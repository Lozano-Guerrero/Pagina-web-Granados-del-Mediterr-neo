import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Brokers.css';
import LozanoGuerreroLogo from '../../assets/lozano-guerrero-group.png';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function BrokerLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user, profile, profileError, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (user && profile) {
            if (profile.is_active === false) {
                // Bloqueo post-auth: si está desactivado, cortamos sesión inmediatamente.
                supabase?.auth?.signOut?.();
                setError('Usuario desactivado. Contacta a un administrador.');
                return;
            }

            const role = String(profile.role || '').toLowerCase();
            const next = (role === 'admin' || role === 'subadmin')
                ? '/admin'
                : (role === 'inmobiliaria' ? '/brokers/inmobiliaria' : '/brokers/dashboard');

            navigate(next, { replace: true });
        }
    }, [loading, navigate, profile, user]);

    useEffect(() => {
        const message = location.state?.message;
        if (message) {
            setError(message);
        }
    }, [location.state]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!isSupabaseConfigured || !supabase) {
            setError('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
            return;
        }

        try {
            setSubmitting(true);
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });
            if (signInError) {
                const raw = String(signInError.message || '').trim();
                const msg = raw.toLowerCase().includes('invalid login credentials')
                    ? 'Credenciales incorrectas'
                    : raw.toLowerCase().includes('email logins are disabled')
                        ? 'El login por correo está deshabilitado en Supabase (Auth Providers).'
                        : raw.toLowerCase().includes('invalid api key')
                            ? 'Credenciales de Supabase inválidas (revisa VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
                            : raw.toLowerCase().includes('user is banned')
                                ? 'Usuario bloqueado. Contacta a un administrador.'
                                : (raw ? `No se pudo iniciar sesión: ${raw}` : 'No se pudo iniciar sesión.');
                setError(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="brokers-page">
            <div className="brokers-card">
                <div>
                    <h1 className="brokers-title">Acceso Brokers</h1>
                    <img
                        className="brokers-logo"
                        src={LozanoGuerreroLogo}
                        alt="Lozano Guerrero Group"
                    />
                    <p className="brokers-subtitle">Ingresa con tus credenciales autorizadas.</p>
                </div>

                {error && <div className="brokers-error">{error}</div>}
                {!error && user && !loading && !profile ? (
                    <div className="brokers-error">
                        Iniciaste sesión, pero no se pudo cargar tu perfil.
                        {profileError?.message ? ` (${profileError.message})` : ''}
                    </div>
                ) : null}

                <form className="brokers-form" onSubmit={handleSubmit}>
                    <div className="brokers-field">
                        <label htmlFor="broker-email">Correo</label>
                        <input
                            id="broker-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@dominio.com"
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="brokers-field">
                        <label htmlFor="broker-password">Contraseña</label>
                        <input
                            id="broker-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <button className="brokers-submit" type="submit" disabled={submitting}>
                        {submitting ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>

                <div className="brokers-login-site">
                    <a
                        href="https://www.lozanoguerrero.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        www.lozanoguerrero.com
                    </a>
                </div>
            </div>
        </div>
    );
}
