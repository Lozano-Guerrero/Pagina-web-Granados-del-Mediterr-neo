import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Phone,
    Mail,
    Briefcase,
    MapPin,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    ClipboardCheck
} from 'lucide-react';
import './Brokers.css';
import './LeadFormEnhanced.css';
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

const STEPS = [
    { id: 1, title: 'Contacto', icon: User },
    { id: 2, title: 'Operación', icon: Briefcase },
    { id: 3, title: 'Selección de Lote', icon: MapPin },
];

export default function LeadRegister({ onComplete, onCancel }) {
    const navigate = useNavigate();
    const DEFAULT_REGIMEN = 'PENDIENTE_DEFINIR';
    const [step, setStep] = useState(1);
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
    const [availableLots, setAvailableLots] = useState([]);
    const [loadingLots, setLoadingLots] = useState(false);

    useEffect(() => {
        if (!message) return undefined;
        if (message.tone === 'warning') {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        let cancelled = false;
        const fetchLots = async () => {
            setLoadingLots(true);
            try {
                const res = await fetch('https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1');
                if (!res.ok) throw new Error('Error al cargar lotes');
                const data = await res.json();
                const root = (Array.isArray(data) && data[0]) ? (data[0].json || data[0]) : data;
                const lotes = root.lotes || (Array.isArray(root) ? root : []);

                const filterAvailable = lotes
                    .filter(l => {
                        const st = (l.estado || l.Estado || '').toUpperCase();
                        return st === 'DISPONIBLE';
                    })
                    .map(l => {
                        const rawNum = String(l.titulo || l.Titulo || l.Título || l.Numero || l.numero || l.id || l.Id || l.LOTE || l.Lote || '').trim();
                        let numClean = rawNum.replace(/lote\s*/i, '').trim();
                        if (!numClean && rawNum) numClean = rawNum;

                        return {
                            numero: numClean,
                            tipo: (l.tipo || l.Tipo || 'A').toUpperCase()
                        };
                    })
                    .filter(l => l.numero)
                    .sort((a, b) => {
                        const numA = parseInt(a.numero.replace(/\D/g, '')) || 0;
                        const numB = parseInt(b.numero.replace(/\D/g, '')) || 0;
                        return numA - numB;
                    });

                if (!cancelled) setAvailableLots(filterAvailable);
            } catch (err) {
                console.error("Fallo al cargar disponibilidad:", err);
            } finally {
                if (!cancelled) setLoadingLots(false);
            }
        };

        fetchLots();
        return () => { cancelled = true; };
    }, []);

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
    }, []);

    const validation = useMemo(() => {
        const next = {};
        if (step === 1) {
            if (!form.firstName.trim()) next.firstName = 'Nombre obligatorio.';
            if (!form.lastName.trim()) next.lastName = 'Apellido obligatorio.';

            const phoneDigits = onlyDigits(form.phone);
            if (!phoneDigits) next.phone = 'Teléfono obligatorio.';
            else if (phoneDigits.length < 10) next.phone = 'Teléfono inválido.';

            if (!form.email.trim()) next.email = 'Correo obligatorio.';
            else if (!isValidEmail(form.email)) next.email = 'Correo inválido.';
        }

        if (step === 2) {
            if (!form.esquema) next.esquema = 'Esquema obligatorio.';
        }

        return next;
    }, [form.email, form.esquema, form.firstName, form.lastName, form.phone, step]);

    const isStepValid = useMemo(() => {
        return Object.keys(validation).length === 0;
    }, [validation]);

    const getFieldError = (key) => {
        const shouldShow = submitAttempted || Boolean(touched[key]);
        return shouldShow ? validation[key] : null;
    };

    const handleChange = (key) => (e) => {
        const val = e.target.value;
        setForm((prev) => {
            const next = { ...prev, [key]: val };
            if (key === 'lotNumber') {
                const found = availableLots.find(l => l.numero === val);
                if (found) next.lotType = found.tipo;
                else next.lotType = '';
            }
            return next;
        });
    };

    const handleBlur = (key) => () => {
        setTouched((prev) => ({ ...prev, [key]: true }));
    };

    const nextStep = () => {
        setSubmitAttempted(true);
        if (isStepValid) {
            setStep(prev => Math.min(prev + 1, 3));
            setSubmitAttempted(false);
        }
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitAttempted(true);

        if (!isStepValid) return;

        if (!supabase) {
            setError('Supabase no está configurado.');
            return;
        }

        if (regimenCtx?.ok && regimenCtx?.canRegisterLeads === false) {
            setError(regimenCtx?.blockReason || 'Debes enviar el nuevo régimen firmado para continuar.');
            return;
        }

        setSubmitting(true);
        setMessage(null);
        setError(null);

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
                setMessage({ tone: 'warning', text: `${baseMessage}${sinceText}` });
            } else {
                setMessage({ tone: 'success', text: 'Lead registrado correctamente.' });
                setForm({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: '',
                    esquema: '',
                    regimen: form.regimen,
                    lotNumber: '',
                    lotType: '',
                });
                setTouched({});
                setSubmitAttempted(false);
                if (onComplete) {
                    setTimeout(() => onComplete(), 1500);
                }
            }
        } catch (err) {
            setError(sanitizeBackendMessage(err?.message ?? 'No se pudo registrar el lead.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isSupabaseConfigured) {
        return (
            <div className="brokers-placeholder">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <AlertCircle size={48} color="#b42318" style={{ marginBottom: 16 }} />
                    <h1>Configuración Requerida</h1>
                    <p className="brokers-error">Supabase no está configurado.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="premium-card register-lead-card">
            <div className="brokers-leads-header">
                <div>
                    <h1 className="brokers-title brokers-title-left">Registrar Prospecto</h1>
                    <p className="brokers-subtitle brokers-subtitle-left">Completa los pasos para dar de alta a tu cliente.</p>
                </div>
                {onCancel && (
                    <button className="premium-btn secondary btn-sm" onClick={onCancel}>
                        <ChevronLeft size={18} /> Cancelar
                    </button>
                )}
            </div>

            {/* Status Stepper */}
            <div className="premium-stepper">
                {STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;
                    return (
                        <React.Fragment key={s.id}>
                            <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="stepper-icon">
                                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                </div>
                                <span className="stepper-title">{s.title}</span>
                            </div>
                            {idx < STEPS.length - 1 && <div className="stepper-line" />}
                        </React.Fragment>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {message ? (
                    <motion.div
                        key="message"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`message-overlay ${message.tone === 'warning' ? 'warning' : 'success'}`}
                    >
                        <div className="message-content">
                            {message.tone === 'success' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
                            <h2>{message.tone === 'success' ? '¡Éxito!' : 'Nota Importante'}</h2>
                            <p>{message.text}</p>
                            <div className="overlay-actions-lux">
                                <button onClick={() => setMessage(null)} className="premium-btn">Entendido</button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.form
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="brokers-form brokers-leads-form premium-form"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        {error && <div className="brokers-error">{error}</div>}
                        {regimenError && <div className="brokers-error">{regimenError}</div>}

                        <div className="leads-step-content">
                            {step === 1 && (
                                <div className="form-grid-2">
                                    <div className="premium-field">
                                        <label><User size={14} /> Nombre</label>
                                        <input value={form.firstName} onChange={handleChange('firstName')} onBlur={handleBlur('firstName')} placeholder="Ej: Juan" />
                                        {getFieldError('firstName') && <span className="error-text">{getFieldError('firstName')}</span>}
                                    </div>
                                    <div className="premium-field">
                                        <label><User size={14} /> Apellido</label>
                                        <input value={form.lastName} onChange={handleChange('lastName')} onBlur={handleBlur('lastName')} placeholder="Ej: Pérez" />
                                        {getFieldError('lastName') && <span className="error-text">{getFieldError('lastName')}</span>}
                                    </div>
                                    <div className="premium-field">
                                        <label><Phone size={14} /> Teléfono</label>
                                        <input value={form.phone} onChange={handleChange('phone')} onBlur={handleBlur('phone')} inputMode="tel" placeholder="10 dígitos" />
                                        {getFieldError('phone') && <span className="error-text">{getFieldError('phone')}</span>}
                                    </div>
                                    <div className="premium-field">
                                        <label><Mail size={14} /> Correo Electrónico</label>
                                        <input value={form.email} onChange={handleChange('email')} onBlur={handleBlur('email')} type="email" placeholder="email@ejemplo.com" />
                                        {getFieldError('email') && <span className="error-text">{getFieldError('email')}</span>}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="form-grid-2">
                                    <div className="premium-field">
                                        <label><Briefcase size={14} /> Esquema de Venta</label>
                                        <select value={form.esquema} onChange={handleChange('esquema')} onBlur={handleBlur('esquema')}>
                                            <option value="">Selecciona una opción…</option>
                                            <option value="referidor">Referidor</option>
                                            <option value="prospector">Prospector</option>
                                            <option value="cerrador">Cerrador</option>
                                        </select>
                                        {getFieldError('esquema') && <span className="error-text">{getFieldError('esquema')}</span>}
                                    </div>
                                    <div className="premium-field disabled">
                                        <label><ClipboardCheck size={14} /> Régimen Fiscal Activo</label>
                                        <input value={loadingRegimen ? 'Cargando…' : form.regimen} disabled />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="form-grid-2">
                                    <div className="premium-field full-width">
                                        <div className="disclaimer-mini-lux">
                                            <AlertCircle size={14} />
                                            <span>Esta información es de <strong>referencia inicial</strong> para conocer la preferencia del cliente y será validada al generar una cotización.</span>
                                        </div>
                                    </div>
                                    <div className="premium-field">
                                        <label><MapPin size={14} /> Seleccionar Lote (Opcional)</label>
                                        <select value={form.lotNumber} onChange={handleChange('lotNumber')} disabled={loadingLots}>
                                            <option value="">{loadingLots ? 'Cargando disponibilidad...' : 'Selecciona un lote...'}</option>
                                            {availableLots.map(l => (
                                                <option key={l.numero} value={l.numero}>Lote {l.numero}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="premium-field disabled">
                                        <label><MapPin size={14} /> Tipo de Lote Detectado</label>
                                        <input value={form.lotType} disabled placeholder="Se llenará al elegir lote" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="premium-form-actions">
                            {step > 1 && (
                                <button type="button" className="premium-btn secondary" onClick={prevStep} disabled={submitting}>
                                    <ChevronLeft size={18} /> Anterior
                                </button>
                            )}
                            {step < 3 ? (
                                <button type="button" className="premium-btn" onClick={nextStep}>
                                    Siguiente <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button type="button" className="premium-btn primary" onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'Registrando…' : 'Finalizar Registro'}
                                </button>
                            )}
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
