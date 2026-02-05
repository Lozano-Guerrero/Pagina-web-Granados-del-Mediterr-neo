import React, { useEffect, useMemo, useState } from 'react';
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
    const [expiring, setExpiring] = useState(false);

    const fullName = useMemo(() => {
        const first = profile?.first_name?.trim() || '';
        const last = profile?.last_name?.trim() || '';
        const combined = `${first} ${last}`.trim();
        return combined || profile?.email || '—';
    }, [profile?.email, profile?.first_name, profile?.last_name]);

    const isLinkedBroker = String(profile?.role || '').toLowerCase() === 'broker' && Boolean(profile?.org_id);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    const fetchLeads = async () => {
        if (!supabase) return;
        setLoadingLeads(true);
        setError(null);
        try {
            const { data, error: qErr } = await supabase
                .from('leads')
                .select('id, created_at, lead_first_name, lead_last_name, lead_email, lead_phone, hl_status, lead_state, expires_at, meeting_days, lot_number, lot_type, esquema, regimen, hl_opportunity_id')
                .eq('hl_status', 'CREATED')
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
        fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!supabase) return;
        if (expiring) return;

        const candidates = (leads || []).filter((l) => {
            const st = String(l?.lead_state || '').toUpperCase();
            if (st === 'CERRADO' || st === 'EXPIRADO') return false;
            if (!l?.expires_at) return false;
            return new Date(l.expires_at).getTime() <= Date.now();
        });

        if (!candidates.length) return;

        // Best-effort: expirar algunos leads para mantener consistencia.
        (async () => {
            setExpiring(true);
            try {
                const slice = candidates.slice(0, 5);
                for (const l of slice) {
                    await edgePost('lead-expire', { leadId: l.id });
                }
                await fetchLeads();
            } finally {
                setExpiring(false);
            }
        })();
    }, [expiring, leads]);

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
        <div className="brokers-dashboard">
            <div className="brokers-dashboard-card brokers-dashboard-card-wide">
                <div className="brokers-panel-grid">
                    <div className="brokers-panel-left">
                        {!isLinkedBroker ? <RegimenModule variant="broker" /> : null}
                        <PanelLeftExtras role={isLinkedBroker ? 'linked-broker' : 'broker'} />
                    </div>
                    <div className="brokers-panel-right">
                        {content}
                    </div>
                </div>

                <button className="brokers-logout" type="button" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </div>

            {confirm ? (
                <ConfirmModal
                    title={confirm.type === 'meeting' ? 'Confirmar reunión' : 'Confirmar venta cerrada'}
                    text={
                        confirm.type === 'meeting'
                            ? '¿Estás seguro que deseas marcar este lead como Reunión agendada?'
                            : 'Esto significa que has logrado cerrar la venta. ¿Confirmas?'
                    }
                    confirmLabel={acting ? 'Procesando…' : 'Confirmar'}
                    onCancel={() => setConfirm(null)}
                    onConfirm={runLeadAction}
                    disabled={acting}
                    tone={confirm.type === 'close' ? 'danger' : 'primary'}
                />
            ) : null}
        </div>
    );
}
