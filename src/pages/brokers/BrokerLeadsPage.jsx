import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Brokers.css';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';

function formatDateTime(value) {
    try {
        return new Date(value).toLocaleString('es-MX');
    } catch {
        return value ?? '—';
    }
}

function onlyDigits(value) {
    return String(value ?? '').replace(/\D+/g, '');
}

function sanitizeBackendMessage(value) {
    if (!value) return value;
    return String(value)
        .replace(/HighLevel/gi, 'el sistema')
        .replace(/LeadConnector/gi, 'el sistema')
        .replace(/leadconnectorhq/gi, 'el sistema');
}

function isValidEmail(value) {
    const email = String(value ?? '').trim();
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function BrokerLeadsPage() {
    const DEFAULT_REGIMEN = 'PENDIENTE_DEFINIR';
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        esquema: '',
        regimen: DEFAULT_REGIMEN,
        lotNumber: '',
        lotType: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [regimenCtx, setRegimenCtx] = useState(null);
    const [loadingRegimen, setLoadingRegimen] = useState(false);
    const [regimenError, setRegimenError] = useState(null);

    useEffect(() => {
        if (!message) return undefined;
        const timer = setTimeout(() => setMessage(null), 5000);
        return () => clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        if (!supabase) return;
        let cancelled = false;
        setLoadingRegimen(true);
        setRegimenError(null);
        supabase
            .rpc('get_regimen_context')
            .then(({ data, error: rpcErr }) => {
                if (cancelled) return;
                if (rpcErr) {
                    setRegimenError(sanitizeBackendMessage(rpcErr.message));
                    setRegimenCtx(null);
                    return;
                }
                setRegimenCtx(data ?? null);
                const nextName = String(data?.regimenName || DEFAULT_REGIMEN).trim() || DEFAULT_REGIMEN;
                setForm((prev) => ({ ...prev, regimen: nextName }));
            })
            .finally(() => {
                if (cancelled) return;
                setLoadingRegimen(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validation = useMemo(() => {
        const next = {};
        if (!form.firstName.trim()) next.firstName = 'Nombre obligatorio.';
        if (!form.lastName.trim()) next.lastName = 'Apellido obligatorio.';

        const phoneDigits = onlyDigits(form.phone);
        if (!phoneDigits) next.phone = 'Teléfono obligatorio.';
        else if (phoneDigits.length < 10) next.phone = 'Teléfono inválido.';

        if (!form.email.trim()) next.email = 'Correo obligatorio.';
        else if (!isValidEmail(form.email)) next.email = 'Correo inválido.';

        if (!form.esquema) next.esquema = 'Esquema obligatorio.';

        return next;
    }, [form.email, form.esquema, form.firstName, form.lastName, form.phone]);

    const isValid = useMemo(() => {
        return Object.keys(validation).length === 0;
    }, [validation]);

    const getFieldError = (key) => {
        const shouldShow = submitAttempted || Boolean(touched[key]);
        return shouldShow ? validation[key] : null;
    };

    const handleChange = (key) => (e) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleBlur = (key) => () => {
        setTouched((prev) => ({ ...prev, [key]: true }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setSubmitAttempted(true);

        if (!supabase) {
            setError('Supabase no está configurado.');
            return;
        }

        if (regimenCtx?.ok && regimenCtx?.canRegisterLeads === false) {
            setError(regimenCtx?.blockReason || 'Debes enviar el nuevo régimen firmado para continuar.');
            return;
        }

        if (!isValid) return;

        setSubmitting(true);
        try {
            const phoneDigits = onlyDigits(form.phone);
            const payload = {
                lead: {
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    phone: phoneDigits || null,
                    email: form.email.trim().toLowerCase() || null,
                    esquema: String(form.esquema || '').trim() || null,
                    regimen: String(form.regimen || DEFAULT_REGIMEN).trim() || DEFAULT_REGIMEN,
                },
                lot: {
                    lotNumber: form.lotNumber.trim() || null,
                    type: form.lotType.trim() || null,
                    areaM2: null,
                    pricePerM2: null,
                },
            };

            const data = await edgePost('lead-register', payload);

            if (data?.status === 'EXISTS') {
                const baseMessage = data.message || 'Este lead ya fue registrado anteriormente.';
                const sinceText = data.existingSince ? ` Registrado el: ${formatDateTime(data.existingSince)}.` : '';
                const matchLabel = data.matchType === 'phone' ? 'teléfono' : (data.matchType === 'email' ? 'correo' : null);
                const matchText = matchLabel ? ` Match: ${matchLabel}.` : '';
                setMessage({ tone: 'warning', text: `${baseMessage}${sinceText}${matchText}` });
            } else if (data?.status === 'CREATED') {
                setMessage({ tone: 'success', text: 'Lead registrado correctamente.' });
            } else {
                setMessage({ tone: 'success', text: 'Lead procesado.' });
            }

            setForm((prev) => ({
                ...prev,
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                esquema: '',
                // Régimen es solo lectura y viene del contexto activo; no lo reseteamos a "por definir".
                regimen: prev.regimen,
            }));
            setTouched({});
            setSubmitAttempted(false);
        } catch (err) {
            setError(sanitizeBackendMessage(err?.message ?? 'No se pudo registrar el lead.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isSupabaseConfigured) {
        return (
            <div className="brokers-placeholder">
                <div>
                    <h1>Registrar Leads</h1>
                    <p className="brokers-error">Supabase no está configurado. Revisa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.</p>
                    <Link className="brokers-back-link" to="/brokers/dashboard">Volver al panel</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="brokers-dashboard">
            <div className="brokers-dashboard-card brokers-leads-card">
                <div className="brokers-leads-header">
                    <div>
                        <h1 className="brokers-title brokers-title-left">Registrar Leads</h1>
                        <p className="brokers-subtitle brokers-subtitle-left">Captura un lead y se registrará en el sistema.</p>
                    </div>
                    <Link className="brokers-back-link brokers-back-link-tight" to="/brokers/dashboard">Volver al panel</Link>
                </div>

                {error ? <div className="brokers-error">{error}</div> : null}
                {regimenError ? <div className="brokers-error">{regimenError}</div> : null}
                {message ? (
                    <div className={message.tone === 'warning' ? 'brokers-warning' : 'brokers-success'}>
                        {message.text}
                    </div>
                ) : null}
                {regimenCtx?.ok && regimenCtx?.canRegisterLeads === false && regimenCtx?.blockReason ? (
                    <div className="brokers-warning">{regimenCtx.blockReason}</div>
                ) : null}

                <form className="brokers-form brokers-leads-form" onSubmit={handleSubmit}>
                    <div className="brokers-leads-grid">
                        <div className="brokers-field">
                            <label>Nombre</label>
                            <input value={form.firstName} onChange={handleChange('firstName')} onBlur={handleBlur('firstName')} autoComplete="given-name" />
                            {getFieldError('firstName') ? <div className="brokers-field-error">{getFieldError('firstName')}</div> : null}
                        </div>
                        <div className="brokers-field">
                            <label>Apellido</label>
                            <input value={form.lastName} onChange={handleChange('lastName')} onBlur={handleBlur('lastName')} autoComplete="family-name" />
                            {getFieldError('lastName') ? <div className="brokers-field-error">{getFieldError('lastName')}</div> : null}
                        </div>
                        <div className="brokers-field">
                            <label>Teléfono</label>
                            <input value={form.phone} onChange={handleChange('phone')} onBlur={handleBlur('phone')} inputMode="tel" autoComplete="tel" />
                            {getFieldError('phone') ? <div className="brokers-field-error">{getFieldError('phone')}</div> : null}
                        </div>
                        <div className="brokers-field">
                            <label>Correo</label>
                            <input value={form.email} onChange={handleChange('email')} onBlur={handleBlur('email')} type="email" autoComplete="email" />
                            {getFieldError('email') ? <div className="brokers-field-error">{getFieldError('email')}</div> : null}
                        </div>
                        <div className="brokers-field">
                            <label>Esquema</label>
                            <select value={form.esquema} onChange={handleChange('esquema')} onBlur={handleBlur('esquema')}>
                                <option value="">Selecciona…</option>
                                <option value="referidor">Referidor</option>
                                <option value="prospector">Prospector</option>
                                <option value="cerrador">Cerrador</option>
                            </select>
                            {getFieldError('esquema') ? <div className="brokers-field-error">{getFieldError('esquema')}</div> : null}
                        </div>
                        <div className="brokers-field">
                            <label>Régimen</label>
                            <input value={loadingRegimen ? 'Cargando…' : form.regimen} disabled />
                        </div>
                        <div className="brokers-field">
                            <label>Lote (opcional)</label>
                            <input value={form.lotNumber} onChange={handleChange('lotNumber')} placeholder="Ej: 21" />
                        </div>
                        <div className="brokers-field">
                            <label>Tipo (opcional)</label>
                            <input value={form.lotType} onChange={handleChange('lotType')} placeholder="A / AA / AAA" />
                        </div>
                    </div>

                    <button className="brokers-submit" type="submit" disabled={submitting}>
                        {submitting ? 'Registrando…' : 'Registrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
