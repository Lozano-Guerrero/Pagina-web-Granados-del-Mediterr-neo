import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import './Brokers.css';
import { supabase } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';
import { useAuth } from '../../contexts/AuthContext.jsx';
import RegimenModule from './RegimenModule.jsx';
import PanelLeftExtras from './PanelLeftExtras.jsx';

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

function KebabMenu({ onEdit, onDeactivate, disabled }) {
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

function ConfirmModal({ title, text, confirmLabel, onCancel, onConfirm, disabled }) {
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
                <div className="brokers-modal-actions">
                    <button type="button" className="brokers-inline-btn" onClick={onCancel} disabled={disabled}>
                        Cancelar
                    </button>
                    <button type="button" className="brokers-inline-btn brokers-inline-btn-green" onClick={onConfirm} disabled={disabled}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BrokerEditModal({ broker, onClose, onSave, saving, errorText }) {
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
        phone: broker.phone || '',
        password: ''
    });

    const submit = (e) => {
        e.preventDefault();
        onSave?.({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password ? form.password : undefined
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
                        <label>Contraseña (opcional)</label>
                        <input type="password" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} />
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
    const [brokerStatusFilter, setBrokerStatusFilter] = useState('active');

    const [notice, setNotice] = useState(null);
    const [error, setError] = useState(null);
    const [brokerModalError, setBrokerModalError] = useState('');
    const [createBrokerModalError, setCreateBrokerModalError] = useState('');

    const [confirm, setConfirm] = useState(null);
    const [actingLead, setActingLead] = useState(false);
    const [editingBroker, setEditingBroker] = useState(null);
    const [creatingBroker, setCreatingBroker] = useState(false);
    const [createBrokerForm, setCreateBrokerForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [deactivateBroker, setDeactivateBroker] = useState(null);
    const [savingBroker, setSavingBroker] = useState(false);

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
                .select('id, public_id, first_name, last_name, email, phone, role, org_id, is_active, created_at')
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
            .filter((b) => b.is_active !== false)
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
            list = list.filter((b) => b.is_active !== false);
        } else if (brokerStatusFilter === 'inactive') {
            list = list.filter((b) => b.is_active === false);
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
        setCreateBrokerForm({ first_name: '', last_name: '', email: '', phone: '', password: '' });
    };

    const createBrokerNow = async (e) => {
        e?.preventDefault?.();
        if (!supabase) return;

        const payload = {
            first_name: createBrokerForm.first_name.trim(),
            last_name: createBrokerForm.last_name.trim(),
            email: createBrokerForm.email.trim(),
            phone: createBrokerForm.phone.trim(),
            password: createBrokerForm.password
        };

        if (!payload.first_name || !payload.last_name || !payload.email || !payload.phone || !payload.password) {
            setCreateBrokerModalError('Completa todos los campos para registrar el broker.');
            return;
        }

        setSavingBroker(true);
        setError(null);
        setCreateBrokerModalError('');
        try {
            const data = await edgePost('inmo-create-broker', payload);
            if (!data?.ok) throw new Error(data?.error || 'No se pudo crear el broker.');

            setNotice({ tone: 'success', text: 'Broker registrado correctamente.' });
            setCreatingBroker(false);
            resetCreateBrokerForm();
            await fetchBrokers();
        } catch (err) {
            setCreateBrokerModalError(sanitizeBackendMessage(err?.message || 'No se pudo crear el broker.'));
        } finally {
            setSavingBroker(false);
        }
    };

    return (
        <div className="brokers-dashboard">
            <div className="brokers-dashboard-card brokers-dashboard-card-wide brokers-dashboard-card-compact">
                <div className="brokers-panel-grid">
                    <div className="brokers-panel-left">
                        <RegimenModule variant="inmobiliaria" />
                        <PanelLeftExtras role="inmobiliaria" />
                    </div>
                    <div className="brokers-panel-right">
                        <div>
                            <div className="brokers-welcome">Bienvenido, {fullName}</div>
                            <h1 className="brokers-title">Panel de Inmobiliaria</h1>
                            <p className="brokers-subtitle">Leads de tu inmobiliaria y brokers asociados.</p>
                        </div>

                        <div className="brokers-actions brokers-actions-compact">
                            <Link to="/brokers/leads" className="brokers-action-card brokers-action-card-compact">Registrar Leads</Link>
                            <Link to="/brokers/cotizador" className="brokers-action-card brokers-action-card-compact">Ir al Cotizador</Link>
                        </div>

                        {error ? <div className="brokers-error">{error}</div> : null}
                        {notice ? (
                            <div className={notice.tone === 'warning' ? 'brokers-warning' : 'brokers-success'}>
                                {notice.text}
                            </div>
                        ) : null}

                        <div className="brokers-subcard">
                    <div className="brokers-leads-table-header brokers-leads-table-header-dashboard">
                        <h2 className="brokers-section-title">Leads</h2>
                        <div className="brokers-helper">
                            {loadingLeads ? 'Cargando…' : `Total: ${filteredLeads.length}`}
                        </div>
                    </div>

                    <div className="brokers-table-controls" aria-label="Filtros de tabla de leads">
                        <input
                            className="brokers-table-search"
                            value={leadSearchText}
                            onChange={(e) => setLeadSearchText(e.target.value)}
                            placeholder="Buscar…"
                            aria-label="Buscar leads"
                        />
                        <select
                            className="brokers-table-select"
                            value={leadOwnerFilter}
                            onChange={(e) => setLeadOwnerFilter(e.target.value)}
                            aria-label="Filtrar por dueño"
                        >
                            <option value="all">Todos</option>
                            <option value="mine">Míos</option>
                            {brokerOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            className="brokers-table-select"
                            value={leadStateFilter}
                            onChange={(e) => setLeadStateFilter(e.target.value)}
                            aria-label="Filtrar por estado"
                        >
                            <option value="all">Todos</option>
                            <option value="VIGENTE">Vigente</option>
                            <option value="REUNION">Reunión</option>
                            <option value="CERRADO">Cerrado</option>
                            <option value="EXPIRADO">Expirado</option>
                        </select>
                    </div>

                    <div className="brokers-table-wrapper">
                        <table className="brokers-table brokers-table-dashboard">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Lead</th>
                                <th>Tel / Correo</th>
                                <th>Lote</th>
                                <th>Esquema</th>
                                <th>Estado</th>
                                <th>Broker</th>
                                <th>Régimen</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.length === 0 && !loadingLeads ? (
                                <tr>
                                    <td colSpan={9} className="brokers-empty">Sin resultados</td>
                                </tr>
                            ) : null}

                            {filteredLeads.map((l) => {
                                const st = (l?.lead_state || 'VIGENTE').toUpperCase();
                                const days = remainingDays(l?.expires_at);
                                const hasVigencia = typeof days === 'number';
                                const isExpired = hasVigencia && days <= 0;
                                const effectiveState = (st !== 'CERRADO' && isExpired) ? 'EXPIRADO' : st;

                                const canMeeting = hasVigencia && effectiveState === 'VIGENTE' && !isExpired;
                                const canClose = hasVigencia && effectiveState === 'REUNION' && !isExpired;

                                const badgeClass =
                                    effectiveState === 'CERRADO'
                                        ? 'brokers-badge-closed'
                                        : (effectiveState === 'EXPIRADO' ? 'brokers-badge-expired' : 'brokers-badge-warning');

                                const badgeText =
                                    effectiveState === 'CERRADO'
                                        ? 'Cerrado'
                                        : (
                                            effectiveState === 'EXPIRADO'
                                                ? 'Expirado'
                                                : (
                                                    effectiveState === 'REUNION'
                                                        ? (hasVigencia ? `Reunión (${days} días)` : 'Reunión (—)')
                                                        : (hasVigencia ? `Vigente (${days} días)` : 'Vigente (—)')
                                                )
                                    );

                                const ownerId = String(l?.created_by_user_id || '');
                                const isOwner = ownerId && ownerId === String(profile?.id || '');
                                const broker = ownerId ? brokersById.get(ownerId) : null;
                                const brokerLabel = isOwner
                                    ? 'Propietario'
                                    : (
                                        broker
                                            ? [broker.public_id, [broker.first_name, broker.last_name].filter(Boolean).join(' ')].filter(Boolean).join(' — ')
                                            : '—'
                                    );

                                return (
                                    <tr key={l.id}>
                                        <td className="brokers-cell-nowrap">
                                            <div className="brokers-cell-nowrap">{formatDateParts(l.created_at).date}</div>
                                            <div className="brokers-cell-muted">{formatDateParts(l.created_at).time}</div>
                                        </td>
                                        <td>
                                            <div className="brokers-lead-name">{l.lead_first_name || '—'}</div>
                                            <div className="brokers-lead-name">{l.lead_last_name || ''}</div>
                                        </td>
                                        <td>
                                            <div className="brokers-cell-nowrap">{l.lead_phone || '—'}</div>
                                            <div className="brokers-cell-muted">{l.lead_email || '—'}</div>
                                        </td>
                                        <td className="brokers-cell-nowrap">
                                            <div className="brokers-cell-nowrap">{l.lot_number ? `LOTE ${l.lot_number}` : '—'}</div>
                                            <div className="brokers-cell-muted">{l.lot_type ? String(l.lot_type) : ''}</div>
                                        </td>
                                        <td className="brokers-cell-nowrap">
                                            {l.esquema ? String(l.esquema).charAt(0).toUpperCase() + String(l.esquema).slice(1) : '—'}
                                        </td>
                                        <td>
                                            <span className={`brokers-badge ${badgeClass}`}>{badgeText}</span>
                                        </td>
                                        <td className="brokers-cell-nowrap">
                                            {isOwner ? (
                                                <span className="brokers-badge brokers-badge-owner">Propietario</span>
                                            ) : (
                                                <div className="brokers-cell-nowrap">{brokerLabel}</div>
                                            )}
                                        </td>
                                        <td className="brokers-cell-nowrap" style={{ textAlign: 'right' }}>{l.regimen || '—'}</td>
                                        <td className="brokers-cell-nowrap">
                                            {canMeeting ? (
                                                <button
                                                    type="button"
                                                    className="brokers-inline-btn brokers-inline-btn-blue"
                                                    disabled={actingLead}
                                                    onClick={() => setConfirm({ type: 'meeting', lead: l })}
                                                >
                                                    Reunión agendada
                                                </button>
                                            ) : null}
                                            {canClose ? (
                                                <button
                                                    type="button"
                                                    className="brokers-inline-btn brokers-inline-btn-green"
                                                    disabled={actingLead}
                                                    onClick={() => setConfirm({ type: 'close', lead: l })}
                                                >
                                                    Venta cerrada
                                                </button>
                                            ) : null}
                                            {!canMeeting && !canClose ? <span className="brokers-cell-muted">—</span> : null}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="brokers-subcard">
                    <div className="brokers-leads-table-header brokers-leads-table-header-dashboard">
                        <h2 className="brokers-section-title">Brokers asociados</h2>
                        <div className="brokers-helper">
                            {loadingBrokers ? 'Cargando…' : `Total: ${filteredBrokers.length}`}
                        </div>
                        <button
                            type="button"
                            className="brokers-inline-btn brokers-inline-btn-blue"
                            onClick={() => setCreatingBroker(true)}
                            disabled={savingBroker}
                        >
                            Registrar broker
                        </button>
                    </div>

                    <div className="brokers-table-controls" aria-label="Filtros de tabla de brokers">
                        <input
                            className="brokers-table-search"
                            value={brokerSearchText}
                            onChange={(e) => setBrokerSearchText(e.target.value)}
                            placeholder="Buscar…"
                            aria-label="Buscar brokers"
                        />
                        <select
                            className="brokers-table-select"
                            value={brokerStatusFilter}
                            onChange={(e) => setBrokerStatusFilter(e.target.value)}
                            aria-label="Filtrar por estado"
                        >
                            <option value="all">Todos</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>

                    <div className="brokers-table-wrapper">
                        <table className="brokers-table brokers-table-dashboard">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBrokers.length === 0 && !loadingBrokers ? (
                                <tr>
                                    <td colSpan={6} className="brokers-empty">Sin resultados</td>
                                </tr>
                            ) : null}

                            {filteredBrokers.map((b) => (
                                <tr key={b.id}>
                                    <td className="brokers-cell-nowrap">{b.public_id || b.id.slice(0, 6).toUpperCase()}</td>
                                    <td>
                                        <div className="brokers-lead-name">{[b.first_name, b.last_name].filter(Boolean).join(' ') || '—'}</div>
                                    </td>
                                    <td className="brokers-cell-muted">{b.email || '—'}</td>
                                    <td className="brokers-cell-nowrap">{b.phone || '—'}</td>
                                    <td>
                                        <span className={`brokers-badge ${b.is_active ? 'brokers-badge-created' : 'brokers-badge-expired'}`}>
                                            {b.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="brokers-cell-nowrap" style={{ textAlign: 'right' }}>
                                        <KebabMenu
                                            disabled={savingBroker}
                                            onEdit={() => { setBrokerModalError(''); setEditingBroker(b); }}
                                            onDeactivate={() => setDeactivateBroker(b)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                    </div>
                </div>

                <button className="brokers-logout" type="button" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>

            {confirm ? (
                <div className="brokers-modal-overlay" role="dialog" aria-modal="true">
                    <div className="brokers-modal">
                        <h3 className="brokers-modal-title">
                            {confirm.type === 'meeting' ? 'Confirmar reunión' : 'Confirmar venta cerrada'}
                        </h3>
                        {confirm.type === 'meeting' ? (
                            <p className="brokers-modal-text">
                                ¿Estás seguro que deseas avanzar este lead? Contará con{' '}
                                <strong>{confirm.lead?.meeting_days ?? '—'}</strong> días de vigencia desde este momento.
                                Esta acción no puede revertirse.
                            </p>
                        ) : (
                            <p className="brokers-modal-text">
                                Esto significa que has logrado cerrar la venta. ¿Confirmas?
                            </p>
                        )}

                        <div className="brokers-modal-actions">
                            <button type="button" className="brokers-inline-btn" onClick={closeConfirm} disabled={actingLead}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={confirm.type === 'meeting' ? 'brokers-inline-btn brokers-inline-btn-blue' : 'brokers-inline-btn brokers-inline-btn-green'}
                                onClick={runLeadAction}
                                disabled={actingLead}
                            >
                                {actingLead ? 'Procesando…' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {editingBroker ? (
                <BrokerEditModal
                    broker={editingBroker}
                    onClose={() => setEditingBroker(null)}
                    onSave={saveBrokerEdits}
                    saving={savingBroker}
                    errorText={brokerModalError}
                />
            ) : null}

            {creatingBroker ? (
                <div
                    className="brokers-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) { setCreatingBroker(false); resetCreateBrokerForm(); }
                    }}
                >
                    <div className="brokers-modal">
                        <h3 className="brokers-modal-title">Registrar broker</h3>
                        <form onSubmit={createBrokerNow} className="brokers-form">
                            {createBrokerModalError ? <div className="brokers-form-error">{createBrokerModalError}</div> : null}
                            <div className="brokers-field">
                                <label>Nombre</label>
                                <input
                                    value={createBrokerForm.first_name}
                                    onChange={(e) => setCreateBrokerForm((v) => ({ ...v, first_name: e.target.value }))}
                                    autoComplete="given-name"
                                />
                            </div>
                            <div className="brokers-field">
                                <label>Apellido</label>
                                <input
                                    value={createBrokerForm.last_name}
                                    onChange={(e) => setCreateBrokerForm((v) => ({ ...v, last_name: e.target.value }))}
                                    autoComplete="family-name"
                                />
                            </div>
                            <div className="brokers-field">
                                <label>Correo</label>
                                <input
                                    value={createBrokerForm.email}
                                    onChange={(e) => setCreateBrokerForm((v) => ({ ...v, email: e.target.value }))}
                                    autoComplete="email"
                                    type="email"
                                />
                            </div>
                            <div className="brokers-field">
                                <label>Celular</label>
                                <input
                                    value={createBrokerForm.phone}
                                    onChange={(e) => setCreateBrokerForm((v) => ({ ...v, phone: e.target.value }))}
                                    autoComplete="tel"
                                />
                            </div>
                            <div className="brokers-field">
                                <label>Contraseña</label>
                                <input
                                    value={createBrokerForm.password}
                                    onChange={(e) => setCreateBrokerForm((v) => ({ ...v, password: e.target.value }))}
                                    autoComplete="new-password"
                                    type="password"
                                />
                            </div>

                            <div className="brokers-modal-actions">
                                <button
                                    type="button"
                                    className="brokers-inline-btn"
                                    onClick={() => { setCreatingBroker(false); resetCreateBrokerForm(); }}
                                    disabled={savingBroker}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="brokers-inline-btn brokers-inline-btn-blue" disabled={savingBroker}>
                                    {savingBroker ? 'Procesando…' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deactivateBroker ? (
                <ConfirmModal
                    title="Desactivar broker"
                    text="¿Seguro? Este broker ya no podrá iniciar sesión."
                    confirmLabel={savingBroker ? 'Procesando…' : 'Desactivar'}
                    onCancel={() => setDeactivateBroker(null)}
                    onConfirm={deactivateBrokerNow}
                    disabled={savingBroker}
                />
            ) : null}
        </div>
    );
}
