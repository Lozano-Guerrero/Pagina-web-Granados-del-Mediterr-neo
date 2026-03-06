import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Brokers.css';
import LozanoGuerreroLogo from '../../assets/lozano-guerrero-group.png';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext.jsx';

function validateBasicPassword(password) {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Za-z]/.test(password)) return 'La contraseña debe incluir al menos una letra.';
    if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número.';
    return null;
}

function buildEdgeErrorMessage({ status, parsed, rawText }) {
    const serverMsg = parsed?.error ? String(parsed.error) : null;
    const messageMsg = parsed?.message ? String(parsed.message) : null;
    const detailsMsg = parsed?.details ? String(parsed.details) : null;
    const rawMsg = !parsed && rawText ? `Respuesta: ${String(rawText).slice(0, 180)}` : null;
    const statusMsg = status ? `HTTP ${status}` : null;
    return [serverMsg, messageMsg, detailsMsg, rawMsg, statusMsg].filter(Boolean).join(' — ') || 'Error.';
}

export default function BrokerLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [helperMode, setHelperMode] = useState(null); // 'first_login' | 'reset_password' | null
    const [helperEmail, setHelperEmail] = useState('');
    const [helperPassword, setHelperPassword] = useState('');
    const [helperPasswordConfirm, setHelperPasswordConfirm] = useState('');
    const [helperError, setHelperError] = useState('');
    const [helperSuccess, setHelperSuccess] = useState('');
    const [helperSubmitting, setHelperSubmitting] = useState(false);
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
                    ? 'Credenciales incorrectas. Si es tu primera vez o tienes restablecimiento habilitado, usa las opciones de abajo.'
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

    const toggleHelperMode = (mode) => {
        setHelperError('');
        setHelperSuccess('');
        setHelperPassword('');
        setHelperPasswordConfirm('');
        setHelperEmail((prev) => prev || email.trim());
        setHelperMode((prev) => (prev === mode ? null : mode));
    };

    const handleHelperSubmit = async (event) => {
        event.preventDefault();
        setHelperError('');
        setHelperSuccess('');

        if (!helperMode) return;
        if (!isSupabaseConfigured || !supabase) {
            setHelperError('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
            return;
        }

        const normalizedEmail = helperEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            setHelperError('Ingresa tu correo.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setHelperError('Ingresa un correo válido.');
            return;
        }
        if (!helperPassword) {
            setHelperError('Ingresa una contraseña.');
            return;
        }
        if (helperPassword !== helperPasswordConfirm) {
            setHelperError('Las contraseñas no coinciden.');
            return;
        }

        const pwdError = validateBasicPassword(helperPassword);
        if (pwdError) {
            setHelperError(pwdError);
            return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            setHelperError('Faltan credenciales de Supabase en .env.');
            return;
        }

        try {
            setHelperSubmitting(true);

            const response = await fetch(`${supabaseUrl}/functions/v1/password-self-service-set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: supabaseAnonKey
                },
                body: JSON.stringify({
                    mode: helperMode,
                    email: normalizedEmail,
                    password: helperPassword,
                    passwordConfirm: helperPasswordConfirm
                })
            });

            const rawText = await response.text();
            let parsed = null;
            try {
                parsed = rawText ? JSON.parse(rawText) : null;
            } catch {
                parsed = null;
            }

            if (!response.ok) {
                setHelperError(buildEdgeErrorMessage({ status: response.status, parsed, rawText }));
                return;
            }

            setHelperSuccess(
                helperMode === 'first_login'
                    ? 'Contraseña creada correctamente. Ya puedes iniciar sesión.'
                    : 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.'
            );
            setEmail(normalizedEmail);
            setPassword(helperPassword);
            setHelperPassword('');
            setHelperPasswordConfirm('');
        } catch (err) {
            setHelperError(String(err?.message || 'No se pudo procesar la solicitud.'));
        } finally {
            setHelperSubmitting(false);
        }
    };

    const helperTitle = helperMode === 'first_login'
        ? '¿Primera vez iniciando sesión?'
        : 'Restablecer contraseña';
    const helperMessage = helperMode === 'first_login'
        ? 'Solicita acceso a tu inmobiliaria o al equipo de dirección comercial Lozano Guerrero.'
        : 'Solicita acceso a tu inmobiliaria o al equipo de dirección comercial Lozano Guerrero para habilitar el restablecimiento.';
    const helperActionLabel = helperMode === 'first_login' ? 'Crear contraseña' : 'Restablecer contraseña';
    const whatsappMessage = helperMode === 'first_login'
        ? 'Hola, necesito solicitar acceso para iniciar sesión por primera vez.'
        : 'Hola, necesito solicitar reactivación para restablecer mi contraseña.';
    const whatsappHref = `https://wa.me/528110184874?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <div className="brokers-page">
            <div className="brokers-card">
                <div>
                    <h1 className="brokers-title">Acceso Brokers</h1>
                    <a href="https://www.lozanoguerrero.com/" target="_blank" rel="noopener noreferrer">
                        <img
                            className="brokers-logo"
                            src={LozanoGuerreroLogo}
                            alt="Lozano Guerrero Group"
                        />
                    </a>
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

                <div className="brokers-login-links">
                    <button
                        type="button"
                        className={`brokers-login-link-btn ${helperMode === 'first_login' ? 'active' : ''}`}
                        onClick={() => toggleHelperMode('first_login')}
                    >
                        ¿Primera vez iniciando sesión?
                    </button>
                    <button
                        type="button"
                        className={`brokers-login-link-btn ${helperMode === 'reset_password' ? 'active' : ''}`}
                        onClick={() => toggleHelperMode('reset_password')}
                    >
                        Restablecer contraseña
                    </button>
                </div>

                {helperMode ? (
                    <div className="brokers-helper-card">
                        <div className="brokers-helper-title">{helperTitle}</div>
                        <p className="brokers-helper-text">{helperMessage}</p>
                        <a className="brokers-whatsapp-btn" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                            WhatsApp 81 1018 4874
                        </a>
                        <div className="brokers-helper">
                            {helperMode === 'first_login'
                                ? 'Este formulario solo funciona con correos registrados.'
                                : 'Este formulario solo funciona con correos autorizados por admin o inmobiliaria para restablecimiento.'}
                        </div>

                        {helperError ? <div className="brokers-error">{helperError}</div> : null}
                        {helperSuccess ? <div className="brokers-success">{helperSuccess}</div> : null}

                        <form className="brokers-form brokers-helper-form" onSubmit={handleHelperSubmit}>
                            <div className="brokers-field">
                                <label htmlFor="helper-email">Correo</label>
                                <input
                                    id="helper-email"
                                    type="email"
                                    value={helperEmail}
                                    onChange={(e) => setHelperEmail(e.target.value)}
                                    placeholder="correo@dominio.com"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            <div className="brokers-field">
                                <label htmlFor="helper-password">Nueva contraseña</label>
                                <input
                                    id="helper-password"
                                    type="password"
                                    value={helperPassword}
                                    onChange={(e) => setHelperPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <div className="brokers-field">
                                <label htmlFor="helper-password-confirm">Confirmar contraseña</label>
                                <input
                                    id="helper-password-confirm"
                                    type="password"
                                    value={helperPasswordConfirm}
                                    onChange={(e) => setHelperPasswordConfirm(e.target.value)}
                                    placeholder="Repite tu contraseña"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <button className="brokers-submit" type="submit" disabled={helperSubmitting}>
                                {helperSubmitting ? 'Procesando...' : helperActionLabel}
                            </button>
                        </form>
                    </div>
                ) : null}

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
