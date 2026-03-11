import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Brokers.css';
import { supabase } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';
import { useAuth } from '../../contexts/AuthContext.jsx';
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

function formatDateParts(value) {
    try {
        const d = new Date(value);
        return {
            date: d.toLocaleDateString('es-MX'),
            time: d.toLocaleTimeString('es-MX'),
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

async function parseFunctionError(fnErr) {
    const res = fnErr?.context;
    const status = res?.status ?? null;

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
}

function ConfirmModal({ title, text, confirmLabel, onCancel, onConfirm, disabled, tone = 'primary' }) {
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
                <div className="brokers-modal-title-row">
                    <h3 className="brokers-modal-title">{title}</h3>
                    <button className="brokers-modal-x" type="button" onClick={onCancel} disabled={disabled} aria-label="Cerrar">
                        ×
                    </button>
                </div>
                <p className="brokers-modal-text">{text}</p>
                <div className="brokers-modal-actions">
                    <button type="button" className="brokers-inline-btn" onClick={onCancel} disabled={disabled}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={`brokers-inline-btn ${tone === 'danger' ? '' : 'brokers-inline-btn-blue'}`}
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

import SmartOnboarding from '../../components/SmartOnboarding.jsx';

export default function BrokerDashboard() {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [loadingLeads, setLoadingLeads] = useState(false);
    const [leads, setLeads] = useState([]);
    const [leadSearchText, setLeadSearchText] = useState('');
    const [leadStateFilter, setLeadStateFilter] = useState('all'); // all | VIGENTE | REUNION | CERRADO | EXPIRADO
    const [notice, setNotice] = useState(null);
    const [error, setError] = useState(null);
    const [confirm, setConfirm] = useState(null); // { type: 'meeting' | 'close', lead }
    const [acting, setActing] = useState(false);
    const expiring = useRef(false);

    // Tutorial state
    const [showOnboarding, setShowOnboarding] = useState(false);

    const fullName = useMemo(() => {
        const first = profile?.first_name?.trim() || '';
        const last = profile?.last_name?.trim() || '';
        const combined = `${first} ${last}`.trim();
        return combined || profile?.email || '—';
    }, [profile?.email, profile?.first_name, profile?.last_name]);

    const isLinkedBroker = String(profile?.role || '').toLowerCase() === 'broker' && Boolean(profile?.org_id);

    useEffect(() => {
        if (!localStorage.getItem('granados_broker_onboarding_seen')) {
            const timer = setTimeout(() => setShowOnboarding(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    const fetchLeads = async () => {
        if (!supabase || !profile?.id) return;
        setLoadingLeads(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase
                .from('leads')
                .select('id, created_at, lead_first_name, lead_last_name, lead_email, lead_phone, hl_status, lead_state, expires_at, meeting_days, lot_number, lot_type, esquema, regimen, hl_opportunity_id')
                .eq('hl_status', 'CREATED')
                .eq('created_by_user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(200);

            if (qErr) throw qErr;
            setLeads(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(`No se pudieron cargar leads. ${sanitizeBackendMessage(err?.message ?? '')}`.trim());
        } finally {
            setLoadingLeads(false);
        }
    };

    useEffect(() => {
        if (profile?.id) {
            fetchLeads();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]);

    useEffect(() => {
        if (!supabase) return;
        // Guard: solo intentar expirar UNA vez por sesión para evitar loops.
        if (expiring.current) return;

        const candidates = (leads || []).filter((l) => {
            const st = String(l?.lead_state || '').toUpperCase();
            if (st === 'CERRADO' || st === 'EXPIRADO') return false;
            if (!l?.expires_at) return false;
            return new Date(l.expires_at).getTime() <= Date.now();
        });

        if (!candidates.length) return;

        expiring.current = true;

        (async () => {
            try {
                const slice = candidates.slice(0, 5);
                const leadIds = slice.map(l => l.id);
                await edgePost('lead-expire', { leadIds });
                // Actualizar localmente sin re-fetch para evitar loop infinito
                setLeads(prev => prev.map(l =>
                    leadIds.includes(l.id) ? { ...l, lead_state: 'EXPIRADO' } : l
                ));
            } catch (e) {
                console.warn('[BrokerDashboard] Error background expire:', e);
            }
            // NO reseteamos expiring.current — la expiración es best-effort, máximo una vez por carga.
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leads.length]);

    const filteredLeads = useMemo(() => {
        const q = leadSearchText.trim().toLowerCase();
        let list = leads || [];

        if (leadStateFilter !== 'all') {
            list = list.filter((l) => {
                const st = String(l?.lead_state || 'VIGENTE').toUpperCase();
                const days = remainingDays(l?.expires_at);
                const isExpired = typeof days === 'number' && days <= 0;
                const effective = (st !== 'CERRADO' && isExpired) ? 'EXPIRADO' : st;
                return effective === leadStateFilter;
            });
        }

        if (!q) return list;
        return list.filter((l) => {
            const hay = [
                l.lead_first_name,
                l.lead_last_name,
                l.lead_email,
                l.lead_phone,
                l.lot_number ? `LOTE ${l.lot_number}` : null,
                l.lot_type,
                l.esquema,
                l.regimen,
                l.lead_state,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [leadSearchText, leadStateFilter, leads]);

    const handleLogout = async () => {
        try {
            await supabase?.auth?.signOut?.();
        } finally {
            navigate('/brokers', { replace: true });
        }
    };

    const runLeadAction = async () => {
        if (!supabase || !confirm?.lead || !confirm?.type) return;
        setActing(true);
        setError(null);
        setNotice(null);
        try {
            if (confirm.type === 'meeting') {
                const data = await edgePost('lead-mark-meeting', { leadId: confirm.lead.id });
                if (data?.status === 'EXPIRADO') {
                    setNotice({ tone: 'warning', text: 'Este lead ya expiró. Actualiza la tabla.' });
                } else {
                    setNotice({ tone: 'success', text: 'Lead actualizado: Reunión agendada.' });
                }
            } else if (confirm.type === 'close') {
                const data = await edgePost('lead-close', { leadId: confirm.lead.id });
                if (data?.status === 'EXPIRADO') {
                    setNotice({ tone: 'warning', text: 'Este lead ya expiró. Actualiza la tabla.' });
                } else {
                    setNotice({ tone: 'success', text: 'Lead actualizado: Venta cerrada.' });
                }
            }

            setConfirm(null);
            await fetchLeads();
        } catch (err) {
            setError(sanitizeBackendMessage(err?.message ?? 'No se pudo actualizar el lead.'));
        } finally {
            setActing(false);
        }
    };

    const content = (
        <>
            <div>
                <div className="brokers-welcome">Bienvenido, {fullName}</div>
                <h1 className="brokers-title">Panel de Brokers</h1>
                <p className="brokers-subtitle">Accesos rápidos para tu gestión.</p>
            </div>

            <div className="brokers-actions">
                <Link to="/brokers/leads" className="brokers-action-card">Registrar Leads</Link>
                <Link to="/brokers/cotizador" className="brokers-action-card">Ir al Cotizador</Link>
            </div>

            {error ? <div className="brokers-error">{error}</div> : null}
            {notice ? (
                <div className={notice.tone === 'warning' ? 'brokers-warning' : 'brokers-success'}>
                    {notice.text}
                </div>
            ) : null}

            <div className="brokers-leads-table-header brokers-leads-table-header-dashboard">
                <h2 className="brokers-section-title">Mis leads</h2>
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
                            <th>Régimen</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length === 0 && !loadingLeads ? (
                            <tr>
                                <td colSpan={8} className="brokers-empty">Sin resultados</td>
                            </tr>
                        ) : null}

                        {filteredLeads.map((l) => {
                            const st = String(l?.lead_state || 'VIGENTE').toUpperCase();
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
                                    <td className="brokers-cell-nowrap" style={{ textAlign: 'right' }}>{l.regimen || '—'}</td>
                                    <td className="brokers-cell-nowrap">
                                        {canMeeting ? (
                                            <button
                                                type="button"
                                                className="brokers-inline-btn brokers-inline-btn-blue"
                                                disabled={acting}
                                                onClick={() => setConfirm({ type: 'meeting', lead: l })}
                                            >
                                                Reunión agendada
                                            </button>
                                        ) : null}
                                        {canClose ? (
                                            <button
                                                type="button"
                                                className="brokers-inline-btn brokers-inline-btn-green"
                                                disabled={acting}
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
        </>
    );

    return (
        <div className="brokers-page-v2">
            <div className="brokers-shell-v2 brokers-v2-fade-in">

                {/* TOP BAR: REGIMEN */}
                <div className="brokers-v2-top-bar" id="tutorial-bd-regimen">
                    {!isLinkedBroker ? <RegimenModule variant="horizontal" /> : null}
                </div>

                <div className="brokers-v2-grid">
                    {/* MAIN CONTENT */}
                    <div className="brokers-v2-main">
                        <div className="brokers-v2-card">
                            <div className="dashboard-v2-header" id="tutorial-bd-header">
                                <div className="dashboard-v2-header-left">
                                    <h1 className="dashboard-v2-title">Panel de Brokers</h1>
                                    <p className="brokers-v2-text-muted">Accesos rápidos para tu gestión.</p>
                                </div>
                                <div className="dashboard-v2-header-right">
                                    <strong style={{ fontSize: '1.1rem' }}>Régimen (Brokers)</strong>
                                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                        Estado: <span className={`regimen-state ${profile?.account_status === 'active' && profile?.is_active !== false ? 'ok' : 'warn'}`}>
                                            {profile?.account_status === 'active' && profile?.is_active !== false ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-v2-actions" id="tutorial-bd-actions">
                                <Link to="/brokers/leads" className="btn-v2-primary">
                                    + Nuevo lead
                                </Link>
                                <Link to="/brokers/cotizador" className="btn-v2-secondary">
                                    Ir a cotizador
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" fill="white" />
                                        <path d="M10 8l4 4-4 4" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </Link>
                            </div>

                            <div className="dashboard-v2-filters" id="tutorial-bd-filters">
                                <div style={{ position: 'relative', flex: 2 }}>
                                    <input
                                        className="input-v2-pill"
                                        value={leadSearchText}
                                        onChange={(e) => setLeadSearchText(e.target.value)}
                                        placeholder="Buscar..."
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
                                        value={leadStateFilter}
                                        onChange={(e) => setLeadStateFilter(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                    >
                                        <option value="all">Filtros</option>
                                        <option value="VIGENTE">Vigente</option>
                                        <option value="REUNION">Reunión</option>
                                        <option value="CERRADO">Cerrado</option>
                                        <option value="EXPIRADO">Expirado</option>
                                    </select>
                                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
                                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* DESKTOP TABLE */}
                            <div className="table-v2-container" id="tutorial-bd-table">
                                <div className="table-v2-header table-v2-grid-layout">
                                    <span>Fecha</span>
                                    <span>Lead</span>
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

                                        return (
                                            <div key={l.id} className="brokers-table-row-v2 table-v2-grid-layout">
                                                <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                    <div>{formatDateParts(l.created_at).date}</div>
                                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{formatDateParts(l.created_at).time}</div>
                                                </div>
                                                <div className="t-v2-cell-truncate" style={{ fontWeight: '700' }} title={`${l.lead_first_name} ${l.lead_last_name}`}>
                                                    {l.lead_first_name} {l.lead_last_name}
                                                </div>
                                                <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                    <div className="t-v2-cell-truncate" title={l.lead_phone}>{l.lead_phone}</div>
                                                    <div className="t-v2-cell-truncate" style={{ color: '#9ca3af', fontSize: '0.75rem' }} title={l.lead_email}>
                                                        {l.lead_email}
                                                    </div>
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

                            {/* MOBILE LIST */}
                            <div className="leads-mobile-grid">
                                {filteredLeads.map((l) => {
                                    const st = String(l?.lead_state || 'VIGENTE').toUpperCase();
                                    const days = remainingDays(l?.expires_at);
                                    const hasVigencia = typeof days === 'number';
                                    const isExpired = hasVigencia && days <= 0;
                                    const effectiveState = (st !== 'CERRADO' && isExpired) ? 'EXPIRADO' : st;
                                    const canMeeting = hasVigencia && effectiveState === 'VIGENTE' && !isExpired;
                                    const canClose = hasVigencia && effectiveState === 'REUNION' && !isExpired;

                                    const badgeText = effectiveState === 'CERRADO' ? 'Cerrado' : (effectiveState === 'EXPIRADO' ? 'Expirado' : (effectiveState === 'REUNION' ? 'Reunión agendada' : 'Vigente'));

                                    // Determinar color de la cabecera
                                    const headerClass = `lead-v2-mobile-card-header state-${effectiveState.toLowerCase()}`;

                                    return (
                                        <div key={l.id} className="lead-v2-mobile-card">
                                            <div className={headerClass} title={badgeText}>{badgeText}</div>
                                            <h4 title={`${l.lead_first_name} ${l.lead_last_name}`}>{l.lead_first_name} {l.lead_last_name}</h4>
                                            <div className="lead-v2-mobile-detail">{l.lead_phone}</div>
                                            <div className="lead-v2-mobile-detail" title={l.lead_email}>{l.lead_email}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px', minWidth: 0 }}>
                                                <div className="lead-v2-mobile-detail">Lote {l.lot_number || '—'}</div>
                                                <div className="lead-v2-mobile-detail">{l.lot_type || '—'}</div>
                                            </div>
                                            {(canMeeting || canClose) && (
                                                <button
                                                    onClick={() => setConfirm({ type: canMeeting ? 'meeting' : 'close', lead: l })}
                                                    className={`lead-v2-mobile-btn ${canMeeting ? 'brokers-inline-btn-blue' : 'brokers-inline-btn-green'}`}
                                                    style={{ border: 'none', color: '#fff', fontWeight: '700', padding: '4px 8px' }}
                                                >
                                                    {canMeeting ? 'Agendar' : 'Venta cerrada'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {!isLinkedBroker && !(profile?.referred_by || profile?.is_referred) && (
                                <div id="tutorial-bd-referrals">
                                    <ReferralsManager profile={profile} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <aside className="brokers-v2-sidebar" id="tutorial-bd-sidebar">
                        <div className="user-sidebar-card">
                            <div className="user-sidebar-profile">
                                <div className="user-sidebar-avatar">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="user-sidebar-info">
                                    <h3>{fullName}</h3>
                                    <button onClick={handleLogout} className="user-sidebar-logout">Cerrar sesión</button>
                                </div>
                            </div>
                        </div>

                        <div className="user-sidebar-card">
                            <h4 className="sidebar-v2-label">Tutorial Interactivo</h4>
                            <p className="sidebar-v2-desc">Aprende a usar todas las herramientas de tu panel rápidamente.</p>
                            <button onClick={() => setShowOnboarding(true)} className="sidebar-v2-btn" style={{ background: '#fff', color: '#0f172a' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                <span>Iniciar recorrido</span>
                            </button>
                        </div>

                        <div className="user-sidebar-card sidebar-v2-card-green">
                            <h4 className="sidebar-v2-label">Grupo de WhatsApp</h4>
                            <p className="sidebar-v2-desc">Únete para no perderte de actualizaciones, avisos, material y precios.</p>
                            <a
                                href="https://chat.whatsapp.com/Ehfbf2S0e8KHThsbIFLxsq"
                                target="_blank"
                                rel="noreferrer"
                                className="sidebar-v2-btn sidebar-v2-btn-green"
                            >
                                Unirme al grupo
                            </a>
                        </div>
                    </aside>
                </div>
            </div>

            {confirm ? (
                <ConfirmModal
                    title={confirm.type === 'meeting' ? 'Confirmar reunión' : 'Confirmar venta cerrada'}
                    text={confirm.type === 'meeting' ? '¿Estás seguro que deseas marcar este lead como Reunión agendada?' : 'Esto significa que has logrado cerrar la venta. ¿Confirmas?'}
                    confirmLabel={acting ? 'Procesando…' : 'Confirmar'}
                    onCancel={() => setConfirm(null)}
                    onConfirm={runLeadAction}
                    disabled={acting}
                    tone={confirm.type === 'close' ? 'danger' : 'primary'}
                />
            ) : null}

            {showOnboarding && (
                <SmartOnboarding 
                    storageKey="granados_broker_onboarding_seen"
                    onDismiss={() => setShowOnboarding(false)}
                    onComplete={() => setShowOnboarding(false)}
                    steps={[
                        {
                            title: "¡Bienvenido a tu Panel de Broker!",
                            content: "Este espacio te permite gestionar prospectos y leads fácilmente. Si tu cuenta está inactiva la puedes activar en el apartado de régimen.",
                            target: "#tutorial-bd-header",
                            placement: "bottom"
                        },
                        (!isLinkedBroker ? {
                            title: "Régimen Condominal",
                            content: "Aquí puedes firmar y aceptar el Régimen Condominal para estar de acuerdo con los términos de uso de la plataforma y activar tu cuenta interactiva.",
                            target: "#tutorial-bd-regimen",
                            placement: "bottom"
                        } : null),
                        {
                            title: "Herramientas de Cierre",
                            content: "Añade nuevos prospectos o accede directamente a la herramienta Cotizador.",
                            target: "#tutorial-bd-actions",
                            placement: "bottom"
                        },
                        {
                            title: "Encuentra tus Leads",
                            content: "Usa el buscador por palabra clave o filtra los prospectos según su estado actual.",
                            target: "#tutorial-bd-filters",
                            placement: "bottom"
                        },
                        {
                            title: "Lista de Prospectos",
                            content: "No pierdas de vista la vigencia de tus leads, y asegúrate de reportar cierres o reuniones a tiempo.",
                            target: "#tutorial-bd-table",
                            placement: "top"
                        },
                        (!isLinkedBroker && !(profile?.referred_by || profile?.is_referred) ? {
                            title: "Red de Referidos",
                            content: "Gana extras referenciando a otros brokers o inmobiliarias, todo administrado desde aquí.",
                            target: "#tutorial-bd-referrals",
                            placement: "top"
                        } : null),
                        {
                            title: "Asistencia y Soporte",
                            content: "Consulta tus datos o recibe apoyo y noticias ingresando a nuestro Grupo de WhatsApp exclusivo.",
                            target: "#tutorial-bd-sidebar",
                            placement: "left"
                        },
                        {
                            title: "¡Comencemos!",
                            content: "Disfruta de la nueva experiencia y las herramientas actualizadas en tu panel.",
                            target: null,
                            placement: "center"
                        }      ].filter(Boolean)}
                />
            )}
        </div>
    );
}
