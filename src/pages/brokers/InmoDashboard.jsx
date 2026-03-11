import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import './Brokers.css';
import { supabase } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';
import { useAuth } from '../../contexts/AuthContext.jsx';
import SmartOnboarding from '../../components/SmartOnboarding.jsx';
import RegimenModule from './RegimenModule.jsx';
import PanelLeftExtras from './PanelLeftExtras.jsx';
import ReferralsManager from './ReferralsManager.jsx';

function useBodyScrollLock(locked) {
    useEffect(() => {
        if (!locked) return undefined;
        if (typeof window === 'undefined') return undefined;

        const w = window;
        const key = '__granadosBodyScrollLock';
        if (!w[key]) {
            w[key] = { count: 0, prev: null, scrollY: 0 };
        }

        const state = w[key];
        if (state.count === 0) {
            const body = document.body;
            const html = document.documentElement;
            const scrollY = window.scrollY;
            const scrollbarWidth = window.innerWidth - html.clientWidth;
            state.scrollY = scrollY;
            state.prev = {
                bodyOverflow: body.style.overflow,
                bodyPaddingRight: body.style.paddingRight,
                htmlOverflow: html.style.overflow,
            };
            body.style.overflow = 'hidden';
            html.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                body.style.paddingRight = `${scrollbarWidth}px`;
            }
        }

        state.count += 1;

        return () => {
            state.count -= 1;
            if (state.count <= 0) {
                state.count = 0;
                const body = document.body;
                const html = document.documentElement;
                const prev = state.prev || {};
                body.style.overflow = prev.bodyOverflow || '';
                body.style.paddingRight = prev.bodyPaddingRight || '';
                html.style.overflow = prev.htmlOverflow || '';
                window.scrollTo(0, state.scrollY || 0);
                state.prev = null;
            }
        };
    }, [locked]);
}

function formatDateTime(value) {
    try {
        return new Date(value).toLocaleString('es-MX');
    } catch {
        return value ?? '—';
    }
}

function formatDateParts(value) {
    try {
        const d = new Date(value);
        return {
            date: d.toLocaleDateString('es-MX'),
            time: d.toLocaleTimeString('es-MX')
        };
    } catch {
        return { date: String(value ?? '—'), time: '' };
    }
}

function remainingDays(expiresAt) {
    if (!expiresAt) return null;
    const ts = new Date(expiresAt).getTime();
    if (!Number.isFinite(ts)) return null;
    const diff = ts - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function sanitizeBackendMessage(value) {
    if (!value) return value;
    return String(value)
        .replace(/HighLevel/gi, 'el sistema')
        .replace(/LeadConnector/gi, 'el sistema')
        .replace(/leadconnectorhq/gi, 'el sistema');
}

function normalizeAccountStatus(value) {
    const status = String(value ?? '').trim().toLowerCase();
    if (status === 'deactivated') return 'deactivated';
    if (status === 'inactive') return 'inactive';
    if (status === 'active') return 'active';
    return null;
}

function getBrokerStatusUi(broker) {
    const status = normalizeAccountStatus(broker?.account_status);
    if (status === 'deactivated' || broker?.is_active === false) {
        return { key: 'deactivated', label: 'Desactivado', badgeClass: 'brokers-badge-expired' };
    }
    if (status === 'inactive') {
        return { key: 'inactive', label: 'Inactivo', badgeClass: 'brokers-badge-warning' };
    }
    return { key: 'active', label: 'Activo', badgeClass: 'brokers-badge-created' };
}

function parseFunctionError(fnErr) {
    const res = fnErr?.context;
    const status = res?.status ?? null;

    return (async () => {
        let rawText = '';
        try {
            rawText = res ? await res.text() : '';
        } catch {
            rawText = '';
        }

        let parsed = null;
        try {
            parsed = rawText ? JSON.parse(rawText) : null;
        } catch {
            parsed = null;
        }

        const msg = parsed?.error || parsed?.message || parsed?.details || rawText || fnErr?.message || 'Error.';
        const safeMsg = sanitizeBackendMessage(msg);
        return status ? `${safeMsg} (HTTP ${status})` : safeMsg;
    })();
}

function KebabMenu({ onEdit, onDeactivate, onShowInvitation, disabled }) {
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState(null); // { top, left, placement }
    const btnRef = React.useRef(null);
    const popoverRef = React.useRef(null);
    const menuIdRef = React.useRef(`kebab_${Math.random().toString(36).slice(2)}`);

    useEffect(() => {
        if (!open) return undefined;
        try {
            const rect = btnRef.current?.getBoundingClientRect?.();
            if (rect) {
                const estimatedHeight = 92; // 2 items + padding
                const spaceAbove = rect.top;
                // Preferimos abrir arriba para evitar que el menú se corte en contenedores con scroll.
                const placement = spaceAbove >= estimatedHeight + 12 ? 'top' : 'bottom';
                setAnchor({
                    top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
                    left: rect.right,
                    placement
                });
            }
        } catch {
            setAnchor(null);
        }

        // Enforce: solo 1 menú abierto a la vez (en toda la página).
        try {
            window.dispatchEvent(
                new CustomEvent('granados:kebab-open', { detail: { id: menuIdRef.current } })
            );
        } catch {
            // ignore
        }

        const onGlobalOpen = (e) => {
            const otherId = e?.detail?.id;
            if (otherId && otherId !== menuIdRef.current) setOpen(false);
        };

        const onScroll = () => setOpen(false);
        const onResize = () => setOpen(false);
        const onDoc = (e) => {
            const target = e.target;
            if (btnRef.current && btnRef.current.contains(target)) return;
            if (popoverRef.current && popoverRef.current.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc, { capture: true });
        // `scroll` no burbujea; escucharlo en document con capture evita que el menú se "quede flotando"
        // cuando scrollean contenedores internos (tablas con overflow).
        document.addEventListener('scroll', onScroll, { capture: true, passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('granados:kebab-open', onGlobalOpen);
        return () => {
            document.removeEventListener('mousedown', onDoc, { capture: true });
            document.removeEventListener('scroll', onScroll, { capture: true });
            window.removeEventListener('resize', onResize);
            window.removeEventListener('granados:kebab-open', onGlobalOpen);
        };
    }, [open]);

    return (
        <div className="kebab-menu">
            <button
                ref={btnRef}
                type="button"
                className="kebab-btn"
                onClick={() => setOpen((v) => !v)}
                disabled={disabled}
                aria-label="Acciones"
            >
                ⋯
            </button>
            {open && anchor && typeof document !== 'undefined'
                ? createPortal(
                    <div
                        ref={popoverRef}
                        className="kebab-popover"
                        role="menu"
                        style={{
                            top: `${anchor.top}px`,
                            left: `${anchor.left}px`,
                            transform: anchor.placement === 'bottom' ? 'translateX(-100%)' : 'translate(-100%, -100%)'
                        }}
                    >
                        <button type="button" className="kebab-item" onClick={() => { setOpen(false); onEdit?.(); }}>
                            Ver / Editar
                        </button>
                        <button type="button" className="kebab-item" style={{ color: '#027a48' }} onClick={() => { setOpen(false); onShowInvitation?.(); }}>
                            Ver invitación
                        </button>
                        <button type="button" className="kebab-item danger" onClick={() => { setOpen(false); onDeactivate?.(); }}>
                            Eliminar
                        </button>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
}

function ConfirmModal({ title, text, confirmLabel, onCancel, onConfirm, disabled, errorText, tone = 'green' }) {
    useBodyScrollLock(true);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onCancel?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return (
        <div
            className="brokers-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCancel?.();
            }}
        >
            <div className="brokers-modal">
                <h3 className="brokers-modal-title">{title}</h3>
                <p className="brokers-modal-text">{text}</p>
                {errorText ? <div className="brokers-form-error">{errorText}</div> : null}
                <div className="brokers-modal-actions">
                    <button type="button" className="brokers-inline-btn" onClick={onCancel} disabled={disabled}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={`brokers-inline-btn ${tone === 'blue' ? 'brokers-inline-btn-blue' : 'brokers-inline-btn-green'}`}
                        onClick={onConfirm}
                        disabled={disabled}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BrokerEditModal({ broker, onClose, onSave, saving, errorText, onEnablePasswordReset }) {
    useBodyScrollLock(true);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const [form, setForm] = useState({
        first_name: broker.first_name || '',
        last_name: broker.last_name || '',
        email: broker.email || '',
        phone: broker.phone || ''
    });

    const submit = (e) => {
        e.preventDefault();
        onSave?.({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim()
        });
    };

    return (
        <div
            className="brokers-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="brokers-modal">
                <div className="brokers-modal-title-row">
                    <h3 className="brokers-modal-title">Editar broker</h3>
                    <button type="button" className="brokers-modal-x" onClick={onClose} disabled={saving} aria-label="Cerrar">
                        ×
                    </button>
                </div>
                <form onSubmit={submit} className="brokers-form">
                    {errorText ? <div className="brokers-form-error">{errorText}</div> : null}
                    <div className="brokers-field">
                        <label>ID</label>
                        <input value={broker.public_id || broker.id} readOnly />
                    </div>
                    <div className="brokers-field">
                        <label>Nombre</label>
                        <input value={form.first_name} onChange={(e) => setForm((v) => ({ ...v, first_name: e.target.value }))} />
                    </div>
                    <div className="brokers-field">
                        <label>Apellido</label>
                        <input value={form.last_name} onChange={(e) => setForm((v) => ({ ...v, last_name: e.target.value }))} />
                    </div>
                    <div className="brokers-field">
                        <label>Correo</label>
                        <input type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} />
                    </div>
                    <div className="brokers-field">
                        <label>Celular</label>
                        <input value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} />
                    </div>
                    <div className="brokers-field">
                        <label>Acceso</label>
                        <div className="brokers-helper">
                            Invalida la contraseña actual y habilita el restablecimiento para este broker.
                        </div>
                        <button
                            type="button"
                            className="brokers-inline-btn brokers-inline-btn-blue"
                            onClick={() => onEnablePasswordReset?.(broker)}
                            disabled={saving}
                        >
                            Habilitar restablecimiento de contraseña
                        </button>
                    </div>
                    <div className="brokers-modal-actions">
                        <button type="button" className="brokers-inline-btn" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="brokers-inline-btn brokers-inline-btn-blue" disabled={saving}>
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function InmoDashboard() {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [brokers, setBrokers] = useState([]);
    const [loadingBrokers, setLoadingBrokers] = useState(false);

    const [leadSearchText, setLeadSearchText] = useState('');
    const [leadStateFilter, setLeadStateFilter] = useState('all');
    const [leadOwnerFilter, setLeadOwnerFilter] = useState('all');

    const [brokerSearchText, setBrokerSearchText] = useState('');
    const [brokerStatusFilter, setBrokerStatusFilter] = useState('all');

    const [notice, setNotice] = useState(null);
    const [error, setError] = useState(null);
    const [brokerModalError, setBrokerModalError] = useState('');
    const [createBrokerModalError, setCreateBrokerModalError] = useState('');
    const [resetPasswordError, setResetPasswordError] = useState('');

    const [confirm, setConfirm] = useState(null);
    const [actingLead, setActingLead] = useState(false);
    const [editingBroker, setEditingBroker] = useState(null);
    const [creatingBroker, setCreatingBroker] = useState(false);
    const [createBrokerForm, setCreateBrokerForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });
    const [deactivateBroker, setDeactivateBroker] = useState(null);
    const [resetPasswordBroker, setResetPasswordBroker] = useState(null);
    const [savingBroker, setSavingBroker] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const [createdBrokerData, setCreatedBrokerData] = useState(null);
    const [copyingMessage, setCopyingMessage] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('granados_inmo_onboarding_seen')) {
            const timer = setTimeout(() => setShowOnboarding(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);


    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    // Lock scroll + allow ESC to close the create-broker modal
    useBodyScrollLock(Boolean(creatingBroker));
    useEffect(() => {
        if (!creatingBroker) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setCreatingBroker(false);
                resetCreateBrokerForm();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creatingBroker]);

    const fullName = useMemo(() => {
        const first = profile?.first_name?.trim() || '';
        const last = profile?.last_name?.trim() || '';
        const combined = `${first} ${last}`.trim();
        return combined || profile?.email || '—';
    }, [profile?.email, profile?.first_name, profile?.last_name]);

    const fetchLeads = async () => {
        if (!supabase) return;
        setLoadingLeads(true);
        setError(null);

        const baseQuery = () => supabase
            .from('leads')
            .select('id, created_at, created_by_user_id, lead_first_name, lead_last_name, lead_email, lead_phone, hl_status, lead_state, expires_at, meeting_days, lot_number, lot_type, esquema, regimen')
            .eq('hl_status', 'CREATED')
            .eq('inmobiliaria_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(300);

        try {
            const { data, error: qErr } = await baseQuery().eq('is_deleted', false);
            if (qErr) throw qErr;
            setLeads(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = String(err?.message ?? '');
            if (/is_deleted/i.test(msg)) {
                const { data, error: qErr } = await baseQuery();
                if (qErr) {
                    setError(`No se pudieron cargar leads. ${qErr.message ?? ''}`.trim());
                } else {
                    setLeads(Array.isArray(data) ? data : []);
                }
            } else {
                setError(`No se pudieron cargar leads. ${msg}`.trim());
            }
        } finally {
            setLoadingLeads(false);
        }
    };

    const fetchBrokers = async () => {
        if (!supabase) return;
        if (!profile?.org_id) {
            setBrokers([]);
            return;
        }

        setLoadingBrokers(true);
        try {
            const { data, error: qErr } = await supabase
                .from('profiles')
                .select('id, public_id, first_name, last_name, email, phone, role, org_id, is_active, account_status, created_at')
                .eq('role', 'broker')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false })
                .limit(500);

            if (qErr) throw qErr;
            setBrokers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            const msg = String(err?.message ?? '');
            if (/row level security|permission denied/i.test(msg)) {
                setError('No se pudieron cargar los brokers por permisos (RLS). Ejecuta `supabase/profiles_inmobiliaria_read_brokers.sql` en Supabase.');
            } else {
                setError('No se pudieron cargar los brokers de tu inmobiliaria.');
            }
        } finally {
            setLoadingBrokers(false);
        }
    };

    useEffect(() => {
        fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchBrokers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.org_id]);

    const filteredLeads = useMemo(() => {
        const q = leadSearchText.trim().toLowerCase();
        const targetState = String(leadStateFilter || 'all').toUpperCase();

        return leads.filter((l) => {
            const st = (l?.lead_state || 'VIGENTE').toUpperCase();
            const days = remainingDays(l?.expires_at);
            const hasVigencia = typeof days === 'number';
            const isExpired = hasVigencia && days <= 0;
            const effectiveState = (st !== 'CERRADO' && isExpired) ? 'EXPIRADO' : st;

            if (targetState !== 'ALL' && effectiveState !== targetState) return false;

            if (leadOwnerFilter === 'mine') {
                if (String(l.created_by_user_id || '') !== String(profile?.id || '')) return false;
            } else if (leadOwnerFilter.startsWith('broker:')) {
                const id = leadOwnerFilter.replace('broker:', '');
                if (String(l.created_by_user_id || '') !== id) return false;
            }

            if (!q) return true;

            const createdById = String(l?.created_by_user_id || '');
            const ownerLabel =
                createdById && createdById === String(profile?.id || '')
                    ? 'Propietario'
                    : '';
            const createdByBroker = createdById
                ? brokers.find((b) => String(b?.id || '') === createdById)
                : null;
            const createdByLabel = createdByBroker
                ? [createdByBroker.public_id, createdByBroker.first_name, createdByBroker.last_name, createdByBroker.email]
                    .filter(Boolean)
                    .join(' ')
                : ownerLabel;

            const haystack = [
                l?.lead_first_name,
                l?.lead_last_name,
                l?.lead_phone,
                l?.lead_email,
                l?.lot_number,
                l?.lot_type,
                l?.esquema,
                l?.regimen,
                effectiveState,
                createdByLabel
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [leads, leadOwnerFilter, leadSearchText, leadStateFilter, profile?.id, brokers]);

    const brokerOptions = useMemo(() => {
        return brokers
            .filter((b) => getBrokerStatusUi(b).key === 'active')
            .map((b) => ({
                value: `broker:${b.id}`,
                label: [b.public_id, [b.first_name, b.last_name].filter(Boolean).join(' ')].filter(Boolean).join(' — ') || b.email || b.id
            }));
    }, [brokers]);

    const brokersById = useMemo(() => {
        const map = new Map();
        (brokers || []).forEach((b) => {
            if (b?.id) map.set(String(b.id), b);
        });
        return map;
    }, [brokers]);

    const filteredBrokers = useMemo(() => {
        const q = brokerSearchText.trim().toLowerCase();
        let list = brokers;

        if (brokerStatusFilter === 'active') {
            list = list.filter((b) => getBrokerStatusUi(b).key === 'active');
        } else if (brokerStatusFilter === 'inactive') {
            list = list.filter((b) => getBrokerStatusUi(b).key !== 'active');
        }

        if (!q) return list;
        return list.filter((b) => {
            const haystack = [b.public_id, b.first_name, b.last_name, b.email, b.phone]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [brokers, brokerSearchText, brokerStatusFilter]);

    const handleLogout = async () => {
        await supabase?.auth?.signOut?.();
        navigate('/brokers', { replace: true });
    };

    const closeConfirm = () => setConfirm(null);

    const runLeadAction = async () => {
        if (!supabase || !confirm?.lead) return;
        setActingLead(true);
        setError(null);

        try {
            const fnName = confirm.type === 'meeting' ? 'lead-mark-meeting' : 'lead-close';
            const data = await edgePost(fnName, { leadId: confirm.lead.id });

            if (data?.highlevel?.stageUpdated === false) {
                setNotice({ tone: 'warning', text: data?.highlevel?.stageError || 'Se actualizó el estado, pero no se pudo sincronizar el stage.' });
            } else {
                setNotice({ tone: 'success', text: confirm.type === 'meeting' ? 'Reunión agendada.' : 'Venta cerrada.' });
            }

            closeConfirm();
            await fetchLeads();
        } catch (err) {
            setError(sanitizeBackendMessage(err?.message ?? 'No se pudo actualizar el lead.'));
        } finally {
            setActingLead(false);
        }
    };

    const saveBrokerEdits = async (payload) => {
        if (!supabase || !editingBroker) return;
        setSavingBroker(true);
        setError(null);
        setBrokerModalError('');

        try {
            await edgePost('manage-user', {
                action: 'update',
                userId: editingBroker.id,
                updates: payload
            });

            setNotice({ tone: 'success', text: 'Broker actualizado.' });
            setEditingBroker(null);
            await fetchBrokers();
        } catch (err) {
            const msg = sanitizeBackendMessage(err?.message ?? 'No se pudo actualizar el broker.');
            setBrokerModalError(msg);
        } finally {
            setSavingBroker(false);
        }
    };

    const deactivateBrokerNow = async () => {
        if (!supabase || !deactivateBroker) return;
        setSavingBroker(true);
        setError(null);

        try {
            await edgePost('manage-user', {
                action: 'deactivate',
                userId: deactivateBroker.id
            });

            setNotice({ tone: 'warning', text: 'Broker desactivado.' });
            setDeactivateBroker(null);
            await fetchBrokers();
        } catch (err) {
            setError(sanitizeBackendMessage(err?.message ?? 'No se pudo desactivar el broker.'));
        } finally {
            setSavingBroker(false);
        }
    };

    const resetCreateBrokerForm = () => {
        setCreateBrokerForm({ first_name: '', last_name: '', email: '', phone: '' });
    };

    const createBrokerNow = async (e) => {
        e?.preventDefault?.();
        if (!supabase) return;

        const payload = {
            first_name: createBrokerForm.first_name.trim(),
            last_name: createBrokerForm.last_name.trim(),
            email: createBrokerForm.email.trim(),
            phone: createBrokerForm.phone.trim()
        };

        if (!payload.first_name || !payload.last_name || !payload.email || !payload.phone) {
            setCreateBrokerModalError('Completa todos los campos para registrar el broker.');
            return;
        }

        setSavingBroker(true);
        setError(null);
        setCreateBrokerModalError('');
        try {
            const data = await edgePost('inmo-create-broker', payload);
            if (!data?.ok) throw new Error(data?.error || 'No se pudo crear el broker.');

            setCreatedBrokerData({
                first_name: payload.first_name,
                email: payload.email,
                loginUrl: 'https://www.granadosdelmediterraneo.com/brokers'
            });

            setCreatingBroker(false);
            resetCreateBrokerForm();
            await fetchBrokers();
        } catch (err) {
            setCreateBrokerModalError(sanitizeBackendMessage(err?.message || 'No se pudo crear el broker.'));
        } finally {
            setSavingBroker(false);
        }
    };

    const enableBrokerPasswordResetNow = async () => {
        if (!supabase || !resetPasswordBroker) return;
        setSavingBroker(true);
        setResetPasswordError('');
        setError(null);
        try {
            await edgePost('manage-user', {
                action: 'enable_password_reset',
                userId: resetPasswordBroker.id
            });
            setNotice({
                tone: 'warning',
                text: 'Restablecimiento habilitado: el broker quedó INACTIVO hasta completar su nueva contraseña desde "Restablecer contraseña".'
            });
            setResetPasswordBroker(null);
            setEditingBroker(null);
            await fetchBrokers();
        } catch (err) {
            setResetPasswordError(sanitizeBackendMessage(err?.message ?? 'No se pudo habilitar restablecimiento de contraseña.'));
        } finally {
            setSavingBroker(false);
        }
    };


    // This is the start of the new return block.
    return (
        <div className="brokers-page-v2">
            <div className="brokers-shell-v2 brokers-v2-fade-in">

                {/* TOP BAR: REGIMEN */}
                <div className="brokers-v2-top-bar" id="tutorial-inmo-regimen">
                    <RegimenModule variant="horizontal" />
                </div>

                <div className="brokers-v2-grid">
                    {/* MAIN CONTENT */}
                    <div className="brokers-v2-main" style={{ minWidth: 0 }}>
                        <div className="brokers-v2-card">
                            <div className="dashboard-v2-header" id="tutorial-inmo-header">
                                <div className="dashboard-v2-header-left">
                                    <h1 className="dashboard-v2-title">Panel de Inmobiliaria</h1>
                                    <p className="brokers-v2-text-muted">Leads de tu inmobiliaria y brokers asociados.</p>
                                </div>
                                <div className="dashboard-v2-header-right" id="tutorial-agency-status">
                                    <strong style={{ fontSize: '1.1rem' }}>Estado Agencia</strong>
                                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                        {profile?.org_name || 'Inmobiliaria'}:{' '}
                                        {profile?.account_status === 'active' ? (
                                            <span className="regimen-state ok">ACTIVA</span>
                                        ) : (
                                            <span className="regimen-state danger">INACTIVA</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && <div className="brokers-error" style={{ marginBottom: '20px' }}>{error}</div>}
                            {notice && (
                                <div className={notice.tone === 'warning' ? 'brokers-warning' : 'brokers-success'} style={{ marginBottom: '20px' }}>
                                    {notice.text}
                                </div>
                            )}

                            <div className="dashboard-v2-actions" id="tutorial-inmo-actions">
                                <Link to="/brokers/leads" className="btn-v2-primary">
                                    + Nuevo lead
                                </Link>
                                <button onClick={() => setCreatingBroker(true)} className="btn-v2-secondary" style={{ background: '#374C64', color: '#fff' }}>
                                    + Registrar Broker
                                </button>
                                <Link to="/brokers/cotizador" className="btn-v2-secondary">
                                    Ir a cotizador
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" fill="white" />
                                        <path d="M10 8l4 4-4 4" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Link>
                            </div>

                            {/* SECCIÓN LEADS */}
                            <div className="dashboard-v2-header" style={{ marginTop: '40px', borderBottom: '1px solid #eee', paddingBottom: '12px' }} id="tutorial-inmo-leads">
                                <h2 className="dashboard-v2-title" style={{ fontSize: '1.25rem' }}>Leads de la Agencia</h2>
                                <div className="brokers-v2-text-muted" style={{ fontSize: '0.9rem' }}>
                                    {loadingLeads ? 'Cargando...' : `Total: ${filteredLeads.length}`}
                                </div>
                            </div>

                            <div className="dashboard-v2-filters">
                                <div style={{ position: 'relative', flex: 2 }}>
                                    <input
                                        className="input-v2-pill"
                                        value={leadSearchText}
                                        onChange={(e) => setLeadSearchText(e.target.value)}
                                        placeholder="Buscar lead..."
                                        style={{ paddingLeft: '44px' }}
                                    />
                                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                        </svg>
                                    </div>
                                </div>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <select
                                        className="select-v2-pill"
                                        value={leadOwnerFilter}
                                        onChange={(e) => setLeadOwnerFilter(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                    >
                                        <option value="all">Todos los dueños</option>
                                        <option value="mine">Míos</option>
                                        {brokerOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* LEADS TABLE DESKTOP */}
                            <div className="table-v2-container" id="tutorial-leads-table">
                                <div className="table-v2-header table-v2-grid-layout" style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(140px, 1.2fr) minmax(140px, 1.2fr) 100px 100px 120px 100px' }}>
                                    <span>Fecha</span>
                                    <span>Lead / Dueño</span>
                                    <span>Tel / Correo</span>
                                    <span>Lote</span>
                                    <span>Esquema</span>
                                    <span>Estado</span>
                                    <span style={{ textAlign: 'center' }}>Acción</span>
                                </div>
                                <div className="table-v2-body">
                                    {filteredLeads.map((l) => {
                                        const st = String(l?.lead_state || 'VIGENTE').toUpperCase();
                                        const days = remainingDays(l?.expires_at);
                                        const hasVigencia = typeof days === 'number';
                                        const isExpired = hasVigencia && days <= 0;
                                        const effectiveState = (st !== 'CERRADO' && isExpired) ? 'EXPIRADO' : st;
                                        const canMeeting = hasVigencia && effectiveState === 'VIGENTE' && !isExpired;
                                        const canClose = hasVigencia && effectiveState === 'REUNION' && !isExpired;

                                        const badgeClass = effectiveState === 'CERRADO' ? 'brokers-badge-closed' : (effectiveState === 'EXPIRADO' ? 'brokers-badge-expired' : 'brokers-badge-warning');
                                        const badgeText = effectiveState === 'CERRADO' ? 'Cerrado' : (effectiveState === 'EXPIRADO' ? 'Expirado' : (effectiveState === 'REUNION' ? `Reunión (${days}d)` : `Vigente (${days}d)`));

                                        const ownerId = String(l.created_by_user_id || '');
                                        const isMine = ownerId === String(profile?.id || '');
                                        const ownerObj = brokersById.get(ownerId);
                                        const ownerLabel = isMine ? 'Tú (Inmo)' : (ownerObj ? `${ownerObj.first_name} ${ownerObj.last_name}` : '—');

                                        return (
                                            <div key={l.id} className="brokers-table-row-v2 table-v2-grid-layout" style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(140px, 1.2fr) minmax(140px, 1.2fr) 100px 100px 120px 100px' }}>
                                                <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                    <div>{formatDateParts(l.created_at).date}</div>
                                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{formatDateParts(l.created_at).time}</div>
                                                </div>
                                                <div className="t-v2-cell-truncate">
                                                    <div style={{ fontWeight: '700' }}>{l.lead_first_name} {l.lead_last_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>{ownerLabel}</div>
                                                </div>
                                                <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                    <div>{l.lead_phone}</div>
                                                    <div className="t-v2-cell-truncate" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{l.lead_email}</div>
                                                </div>
                                                <div style={{ fontWeight: '600' }}>{l.lot_number ? `Lote ${l.lot_number}` : '—'}</div>
                                                <div style={{ fontSize: '0.85rem' }}>{l.esquema}</div>
                                                <div><span className={`brokers-badge ${badgeClass}`}>{badgeText}</span></div>
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    {canMeeting && <button onClick={() => setConfirm({ type: 'meeting', lead: l })} className="table-v2-action-btn blue">Agendar</button>}
                                                    {canClose && <button onClick={() => setConfirm({ type: 'close', lead: l })} className="table-v2-action-btn green">Cerrar</button>}
                                                    {!canMeeting && !canClose && <span style={{ color: '#9ca3af' }}>—</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* LEADS MOBILE LIST */}
                            <div className="leads-mobile-grid">
                                {filteredLeads.map((l) => {
                                    const st = String(l?.lead_state || 'VIGENTE').toUpperCase();
                                    const days = remainingDays(l?.expires_at);
                                    const hasVigencia = typeof days === 'number';
                                    const isExpired = hasVigencia && days <= 0;
                                    const effectiveState = (st !== 'CERRADO' && isExpired) ? 'EXPIRADO' : st;
                                    const canMeeting = hasVigencia && effectiveState === 'VIGENTE' && !isExpired;
                                    const canClose = hasVigencia && effectiveState === 'REUNION' && !isExpired;
                                    const badgeText = effectiveState === 'CERRADO' ? 'Cerrado' : (effectiveState === 'EXPIRADO' ? 'Expirado' : (effectiveState === 'REUNION' ? 'Reunión' : 'Vigente'));

                                    const ownerId = String(l.created_by_user_id || '');
                                    const isMine = ownerId === String(profile?.id || '');
                                    const ownerObj = brokersById.get(ownerId);
                                    const ownerLabel = isMine ? 'Tú (Inmo)' : (ownerObj ? `${ownerObj.first_name} ${ownerObj.last_name}` : '—');

                                    return (
                                        <div key={l.id} className="lead-v2-mobile-card">
                                            <div className={`lead-v2-mobile-card-header state-${effectiveState.toLowerCase()}`}>{badgeText} {hasVigencia && !isExpired ? `(${days}d)` : ''}</div>
                                            <h4>{l.lead_first_name} {l.lead_last_name}</h4>
                                            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '700', marginBottom: '8px' }}>Dueño: {ownerLabel}</div>
                                            <div className="lead-v2-mobile-detail">{l.lead_phone}</div>
                                            <div className="lead-v2-mobile-detail" style={{ color: '#9ca3af' }}>{l.lead_email}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                                <div className="lead-v2-mobile-detail">Lote {l.lot_number || '—'}</div>
                                                <div className="lead-v2-mobile-detail">{l.esquema || '—'}</div>
                                            </div>
                                            {(canMeeting || canClose) && (
                                                <button
                                                    onClick={() => setConfirm({ type: canMeeting ? 'meeting' : 'close', lead: l })}
                                                    className={`lead-v2-mobile-btn ${canMeeting ? 'brokers-inline-btn-blue' : 'brokers-inline-btn-green'}`}
                                                    style={{ border: 'none', color: '#fff', fontWeight: '700', padding: '8px', marginTop: '12px', width: '100%', borderRadius: '8px' }}
                                                >
                                                    {canMeeting ? 'Marcar Reunión' : 'Cerrar Venta'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* SECCIÓN BROKERS */}
                            <div className="dashboard-v2-header" style={{ marginTop: '60px', borderBottom: '1px solid #eee', paddingBottom: '12px' }} id="tutorial-inmo-brokers">
                                <h2 className="dashboard-v2-title" style={{ fontSize: '1.25rem' }}>Brokers de tu Inmobiliaria</h2>
                                <div className="brokers-v2-text-muted" style={{ fontSize: '0.9rem' }}>
                                    {loadingBrokers ? 'Cargando...' : `Total: ${filteredBrokers.length}`}
                                </div>
                            </div>

                            <div className="dashboard-v2-filters">
                                <div style={{ position: 'relative', flex: 2 }}>
                                    <input
                                        className="input-v2-pill"
                                        value={brokerSearchText}
                                        onChange={(e) => setBrokerSearchText(e.target.value)}
                                        placeholder="Buscar broker por nombre, email o ID..."
                                        style={{ paddingLeft: '44px' }}
                                    />
                                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                        </svg>
                                    </div>
                                </div>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <select
                                        className="select-v2-pill"
                                        value={brokerStatusFilter}
                                        onChange={(e) => setBrokerStatusFilter(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="active">Activos</option>
                                        <option value="inactive">Inactivos / Desactivados</option>
                                    </select>
                                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* BROKERS TABLE DESKTOP */}
                            <div className="table-v2-container" id="tutorial-brokers-table">
                                <div className="table-v2-header table-v2-grid-layout" style={{ gridTemplateColumns: '80px 1.5fr 1.5fr 120px 100px 60px' }}>
                                    <span>ID</span>
                                    <span>Nombre Completo</span>
                                    <span>Contacto</span>
                                    <span>Miembro desde</span>
                                    <span>Estado</span>
                                    <span style={{ textAlign: 'center' }}>Acción</span>
                                </div>
                                <div className="table-v2-body">
                                    {filteredBrokers.map((b) => {
                                        const ui = getBrokerStatusUi(b);
                                        return (
                                            <div key={b.id} className="brokers-table-row-v2 table-v2-grid-layout" style={{ gridTemplateColumns: '80px 1.5fr 1.5fr 120px 100px 60px' }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>{b.public_id || '—'}</div>
                                                <div style={{ fontWeight: '700' }}>{b.first_name} {b.last_name}</div>
                                                <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                    <div>{b.phone || '—'}</div>
                                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{b.email}</div>
                                                </div>
                                                <div style={{ fontSize: '0.85rem' }}>{formatDateParts(b.created_at).date}</div>
                                                <div><span className={`brokers-badge ${ui.badgeClass}`}>{ui.label}</span></div>
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <KebabMenu
                                                        onEdit={() => setEditingBroker(b)}
                                                        onDeactivate={() => setDeactivateBroker(b)}
                                                        onShowInvitation={() => setCreatedBrokerData({
                                                            first_name: b.first_name,
                                                            email: b.email,
                                                            loginUrl: 'https://www.granadosdelmediterraneo.com/brokers'
                                                        })}
                                                        disabled={savingBroker}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* BROKERS MOBILE LIST */}
                            <div className="leads-mobile-grid" style={{ marginTop: '20px' }}>
                                {filteredBrokers.map((b) => {
                                    const ui = getBrokerStatusUi(b);
                                    return (
                                        <div key={b.id} className="lead-v2-mobile-card" style={{ borderLeft: `4px solid ${ui.key === 'active' ? '#027a48' : '#b42318'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <span className={`brokers-badge ${ui.badgeClass}`}>{ui.label}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ID: {b.public_id || '—'}</span>
                                            </div>
                                            <h4 style={{ margin: '0 0 8px 0' }}>{b.first_name} {b.last_name}</h4>
                                            <div className="lead-v2-mobile-detail">{b.phone || '—'}</div>
                                            <div className="lead-v2-mobile-detail" style={{ color: '#9ca3af', marginBottom: '12px' }}>{b.email}</div>
                                                <button
                                                    onClick={() => setCreatedBrokerData({
                                                        first_name: b.first_name,
                                                        email: b.email,
                                                        loginUrl: 'https://www.granadosdelmediterraneo.com/brokers'
                                                    })}
                                                    className="brokers-inline-btn"
                                                    style={{ flex: 1, fontSize: '0.75rem', color: '#027a48' }}
                                                    disabled={savingBroker}
                                                >
                                                    Invitación
                                                </button>
                                                <button
                                                    onClick={() => setEditingBroker(b)}
                                                    className="brokers-inline-btn"
                                                    style={{ flex: 1, fontSize: '0.75rem' }}
                                                    disabled={savingBroker}
                                                >
                                                    Gestionar
                                                </button>
                                                <button
                                                    onClick={() => setDeactivateBroker(b)}
                                                    className="brokers-inline-btn"
                                                    style={{ color: '#b42318', fontSize: '0.75rem' }}
                                                    disabled={savingBroker}
                                                >
                                                    Eliminar
                                                </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {!(profile?.referred_by || profile?.is_referred) && (
                                <div id="tutorial-inmo-referrals">
                                    <ReferralsManager profile={profile} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <aside className="brokers-v2-sidebar" id="tutorial-inmo-sidebar">
                        <div className="user-sidebar-card">
                            <div className="user-sidebar-profile">
                                <div className="user-sidebar-avatar">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 21v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="user-sidebar-info">
                                    <h3>{fullName}</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '2px 0 8px' }}>Administrador Agencia</p>
                                    <button onClick={handleLogout} className="user-sidebar-logout">Cerrar sesión</button>
                                </div>
                            </div>
                        </div>

                        <div className="user-sidebar-card">
                            <h4 className="sidebar-v2-label">Gestión de Agencia</h4>
                            <p className="sidebar-v2-desc">Como administrador de {profile?.org_name || 'tu inmobiliaria'}, puedes visualizar todos los leads generados por tus brokers y gestionar sus accesos.</p>
                        </div>

                        <div className="user-sidebar-card">
                            <h4 className="sidebar-v2-label">Tutorial Interactivo</h4>
                            <p className="sidebar-v2-desc">Aprende a usar todas las herramientas de tu panel en un par de minutos.</p>
                            <button onClick={() => setShowOnboarding(true)} className="sidebar-v2-btn" style={{ background: '#fff', color: '#0f172a' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                <span>Iniciar recorrido</span>
                            </button>
                        </div>

                        <PanelLeftExtras role="inmobiliaria" />

                        <div className="user-sidebar-card sidebar-v2-card-green">
                            <h4 className="sidebar-v2-label">Soporte Inmobiliarias</h4>
                            <p className="sidebar-v2-desc">¿Necesitas ayuda con la gestión de tu equipo o carga masiva de leads?</p>
                            <a
                                href="https://wa.me/5219981234567"
                                target="_blank"
                                rel="noreferrer"
                                className="sidebar-v2-btn sidebar-v2-btn-green"
                            >
                                Contactar soporte
                            </a>
                        </div>
                    </aside>
                </div>
            </div>

            {/* MODALES */}
            {createdBrokerData && (
                <div className="brokers-modal-overlay" role="dialog" aria-modal="true">
                    <div className="brokers-modal" style={{ maxWidth: '450px' }}>
                        <div className="brokers-modal-title-row">
                            <h3 className="brokers-modal-title">¡Broker registrado con éxito!</h3>
                        </div>
                        <div style={{ marginBottom: '20px', lineHeight: '1.5' }}>
                            <p>Copia y envía este mensaje a <strong>{createdBrokerData.first_name}</strong> para facilitar su acceso:</p>
                            
                            <div style={{ 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                padding: '16px', 
                                borderRadius: '12px', 
                                marginTop: '12px',
                                fontSize: '0.9rem',
                                color: '#334155',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {`¡Bienvenido al equipo! Se ha creado tu acceso al portal de Granados del Mediterráneo.

Tu cuenta: ${createdBrokerData.email}
Acceso: ${createdBrokerData.loginUrl}

Instrucciones: Al ingresar por primera vez, haz clic en 'Olvidé mi contraseña' para generar tu clave personal y activar tu cuenta.`}
                            </div>
                        </div>

                        <div className="brokers-modal-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                            <button 
                                onClick={() => {
                                        const msg = `¡Bienvenido al equipo! Se ha creado tu acceso al portal de Granados del Mediterráneo.\n\nTu cuenta: ${createdBrokerData.email}\nAcceso: ${createdBrokerData.loginUrl}\n\nInstrucciones: Al ingresar por primera vez, haz clic en 'Olvidé mi contraseña' para generar tu clave personal y activar tu cuenta.\n\n¡Mucho éxito!`;
                                    navigator.clipboard.writeText(msg);
                                    setCopyingMessage(true);
                                    setTimeout(() => setCopyingMessage(false), 2000);
                                }} 
                                className="btn-v2-primary" 
                                style={{ width: '100%' }}
                            >
                                {copyingMessage ? '¡Copiado!' : 'Copiar mensaje'}
                            </button>
                            <button 
                                onClick={() => setCreatedBrokerData(null)} 
                                className="brokers-inline-btn" 
                                style={{ width: '100%', border: 'none' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {creatingBroker && (
                <div className="brokers-modal-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) { setCreatingBroker(false); resetCreateBrokerForm(); } }}>
                    <div className="brokers-modal">
                        <div className="brokers-modal-title-row">
                            <h3 className="brokers-modal-title">Registrar nuevo broker</h3>
                            <button className="brokers-modal-x" onClick={() => { setCreatingBroker(false); resetCreateBrokerForm(); }}>×</button>
                        </div>
                        <form onSubmit={createBrokerNow} className="brokers-form">
                            {createBrokerModalError && <div className="brokers-form-error">{createBrokerModalError}</div>}
                            <div className="brokers-leads-grid">
                                <div className="brokers-field">
                                    <label>Nombre(s)</label>
                                    <input value={createBrokerForm.first_name} onChange={(e) => setCreateBrokerForm(v => ({ ...v, first_name: e.target.value }))} required />
                                </div>
                                <div className="brokers-field">
                                    <label>Apellido(s)</label>
                                    <input value={createBrokerForm.last_name} onChange={(e) => setCreateBrokerForm(v => ({ ...v, last_name: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="brokers-field">
                                <label>Correo electrónico</label>
                                <input type="email" value={createBrokerForm.email} onChange={(e) => setCreateBrokerForm(v => ({ ...v, email: e.target.value }))} required />
                            </div>
                            <div className="brokers-field">
                                <label>Teléfono celular</label>
                                <input type="tel" value={createBrokerForm.phone} onChange={(e) => setCreateBrokerForm(v => ({ ...v, phone: e.target.value }))} required />
                            </div>

                            <div className="brokers-legal-text" style={{ marginTop: '0', marginBottom: '16px', color: '#027a48', background: '#ecfdf3', padding: '10px', borderRadius: '8px', border: '1px solid #abefc6' }}>
                                <strong>💡 Importante:</strong> Al finalizar el registro, verás un mensaje personalizado que podrás compartir a tu broker para facilitar su acceso.
                            </div>

                            <div className="brokers-modal-actions">
                                <button type="button" className="brokers-inline-btn" onClick={() => { setCreatingBroker(false); resetCreateBrokerForm(); }}>Cancelar</button>
                                <button type="submit" className="btn-v2-primary" style={{ padding: '0 24px', height: '40px' }} disabled={savingBroker}>
                                    {savingBroker ? 'Registrando...' : 'Registrar Broker'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingBroker && (
                <BrokerEditModal
                    broker={editingBroker}
                    onClose={() => setEditingBroker(null)}
                    onSave={saveBrokerEdits}
                    saving={savingBroker}
                    errorText={brokerModalError}
                    onEnablePasswordReset={(b) => setResetPasswordBroker(b)}
                />
            )}

            {confirm && (
                <ConfirmModal
                    title={confirm.type === 'meeting' ? 'Confirmar reunión' : 'Confirmar venta cerrada'}
                    text={confirm.type === 'meeting' ? '¿Deseas marcar este lead como Reunión para la agencia?' : '¿Confirmas que este lead ha cerrado una venta exitosa?'}
                    confirmLabel={actingLead ? 'Procesando…' : 'Confirmar'}
                    onCancel={closeConfirm}
                    onConfirm={runLeadAction}
                    disabled={actingLead}
                    tone={confirm.type === 'close' ? 'blue' : 'green'}
                />
            )}

            {deactivateBroker && (
                <ConfirmModal
                    title="Desactivar Broker"
                    text={`¿Estás seguro que deseas desactivar a ${deactivateBroker.first_name} ${deactivateBroker.last_name}? Perderá el acceso al panel inmediatamente.`}
                    confirmLabel={savingBroker ? 'Desactivando...' : 'Desactivar'}
                    onCancel={() => setDeactivateBroker(null)}
                    onConfirm={deactivateBrokerNow}
                    disabled={savingBroker}
                    tone="blue"
                />
            )}

            {resetPasswordBroker && (
                <ConfirmModal
                    title="Restablecer Contraseña"
                    text={`Se invalidará la contraseña actual de ${resetPasswordBroker.first_name}. Deberá usar la función "Olvidé mi contraseña" para ingresar.`}
                    confirmLabel={savingBroker ? 'Procesando...' : 'Confirmar restablecimiento'}
                    onCancel={() => setResetPasswordBroker(null)}
                    onConfirm={enableBrokerPasswordResetNow}
                    disabled={savingBroker}
                    errorText={resetPasswordError}
                    tone="blue"
                />
            )}

            {showOnboarding && (
                <SmartOnboarding 
                    storageKey="granados_inmo_onboarding_seen"
                    onDismiss={() => setShowOnboarding(false)}
                    onComplete={() => setShowOnboarding(false)}
                    steps={[
                        {
                            title: "Bienvenido al Panel de Inmobiliaria",
                            content: "Centraliza el estado de tu agencia, administra los leads de tus asesores y expande tu equipo con facilidad. Si tu cuenta está inactiva la puedes activar en el apartado de régimen.",
                            target: "#tutorial-inmo-header",
                            placement: "bottom"
                        },
                        {
                            title: "Régimen Condominal",
                            content: "Aquí puedes firmar y aceptar el Régimen Condominal para estar de acuerdo con los términos de uso de la plataforma y activar tu cuenta interactiva.",
                            target: "#tutorial-inmo-regimen",
                            placement: "bottom"
                        },
                        {
                            title: "Acciones Rápidas",
                            content: "Registra Leads tú mismo, añade un Broker para que trabaje en tu inmobiliaria, o entra al Cotizador.",
                            target: "#tutorial-inmo-actions",
                            placement: "bottom"
                        },
                        {
                            title: "Leads de la Agencia",
                            content: "Supervisa toda la tubería de ventas de tu inmobiliaria. Filtra por estado de venta o búsqueda global.",
                            target: "#tutorial-inmo-leads",
                            placement: "top"
                        },
                        {
                            title: "Tus Brokers",
                            content: "Gestiona los accesos de tus Brokers, modifícalos o desactívalos si es necesario, y observa quién trae qué Lead.",
                            target: "#tutorial-inmo-brokers",
                            placement: "top"
                        },
                        (!(profile?.referred_by || profile?.is_referred) ? {
                            title: "Alianzas y Referidos",
                            content: "Añade nuevos Brokers o Inmobiliarias como Referidos para potenciar tus comisiones. Expande tu equipo de afiliados.",
                            target: "#tutorial-inmo-referrals",
                            placement: "top"
                        } : null),
                        {
                            title: "Tu Perfil y Soporte",
                            content: "Finalmente, contáctanos inmediatamente en WhatsApp o revisa los roles y ajustes de este Panel Lateral.",
                            target: "#tutorial-inmo-sidebar",
                            placement: "left"
                        },
                        {
                            title: "¡Comencemos!",
                            content: "Disfruta de la nueva experiencia y las herramientas actualizadas en tu panel interactivo.",
                            target: null,
                            placement: "center"
                        }
                    ].filter(Boolean)}
                />
            )}
        </div>
    );
}
