import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';
import { buildQuoteFilename, downloadPdfBytes, generateQuotePdfBytes } from '../../lib/quotePdf.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './Admin.css';

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

function KebabMenu({ onEdit, onDeactivate, onReactivate, disabled, editLabel = 'Ver / Editar' }) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);
    const popoverRef = useRef(null);
    const [anchor, setAnchor] = useState(null); // { top, left, placement }
    const menuIdRef = useRef(`kebab_${Math.random().toString(36).slice(2)}`);

    useEffect(() => {
        if (!open) return undefined;
        try {
            const rect = btnRef.current?.getBoundingClientRect?.();
            if (rect) {
                const items = onReactivate ? 3 : 2;
                const estimatedHeight = items * 40 + 20; // items + padding
                const spaceAbove = rect.top;
                const placement = spaceAbove >= estimatedHeight + 12 ? 'top' : 'bottom';
                setAnchor({
                    top: placement === 'top' ? rect.top - 6 : rect.bottom + 8,
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

        window.addEventListener('granados:kebab-open', onGlobalOpen);
        // `scroll` no burbujea; escucharlo en document con capture evita que el menú se "quede flotando"
        // cuando scrollean contenedores internos (tablas con overflow).
        document.addEventListener('scroll', onScroll, { capture: true, passive: true });
        window.addEventListener('resize', onResize, { passive: true });

        return () => {
            document.removeEventListener('mousedown', onDoc, { capture: true });
            window.removeEventListener('granados:kebab-open', onGlobalOpen);
            document.removeEventListener('scroll', onScroll, { capture: true });
            window.removeEventListener('resize', onResize);
        };
    }, [open]);

    return (
        <div className="admin-kebab">
            <button
                ref={btnRef}
                type="button"
                className="admin-kebab-btn"
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
                        className="admin-kebab-popover"
                        role="menu"
                        style={{
                            position: 'fixed',
                            top: `${anchor.top}px`,
                            left: `${anchor.left}px`,
                            transform: anchor.placement === 'top' ? 'translate(-100%, -100%)' : 'translateX(-100%)'
                        }}
                    >
                        <button type="button" className="admin-kebab-item" onClick={() => { setOpen(false); onEdit?.(); }}>
                            {editLabel}
                        </button>
                        {onReactivate ? (
                            <button type="button" className="admin-kebab-item" onClick={() => { setOpen(false); onReactivate?.(); }}>
                                Reactivar
                            </button>
                        ) : null}
                        <button type="button" className="admin-kebab-item danger" onClick={() => { setOpen(false); onDeactivate?.(); }}>
                            Eliminar
                        </button>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
}

function ConfirmModal({ title, text, confirmLabel, onCancel, onConfirm, disabled, tone = 'danger', errorText }) {
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
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCancel?.();
            }}
        >
            <div className="admin-modal">
                <h3 className="admin-modal-title">{title}</h3>
                <p className="admin-modal-text">{text}</p>
                {errorText ? <div className="admin-modal-error">{errorText}</div> : null}
                <div className="admin-modal-actions">
                    <button type="button" className="admin-modal-btn" onClick={onCancel} disabled={disabled}>
                        Cancelar
                    </button>
                    <button type="button" className={`admin-modal-btn ${tone}`} onClick={onConfirm} disabled={disabled}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RegimenUploadModal({
    target,
    file,
    name,
    errorText,
    uploading,
    onClose,
    onPickFile,
    onChangeName,
    onConfirm,
}) {
    useBodyScrollLock(true);
    const fileInputRef = useRef(null);
    const [localError, setLocalError] = useState('');
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const title = target === 'broker' ? 'Subir nuevo régimen (Brokers)' : 'Subir nuevo régimen (Inmobiliarias)';

    const applyFile = (nextFile) => {
        if (!nextFile) {
            setLocalError('');
            onPickFile?.(null);
            return;
        }

        if (!String(nextFile?.name ?? '').toLowerCase().endsWith('.pdf')) {
            setLocalError('Solo se aceptan PDFs.');
            onPickFile?.(null);
            return;
        }

        setLocalError('');
        onPickFile?.(nextFile);
    };

    const openFilePicker = () => {
        if (uploading) return;
        fileInputRef.current?.click?.();
    };

    return (
        <div
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="admin-modal">
                <div className="admin-modal-title-row">
                    <h3 className="admin-modal-title">{title}</h3>
                    <button type="button" className="admin-modal-x" onClick={onClose} disabled={uploading} aria-label="Cerrar">
                        ×
                    </button>
                </div>

                <p className="admin-modal-text">
                    Esto desactivará a todos los usuarios objetivo hasta que firmen y envíen el régimen correspondiente.
                </p>

                {localError ? <div className="admin-modal-error">{localError}</div> : null}
                {errorText ? <div className="admin-modal-error">{errorText}</div> : null}

                <div className="admin-field">
                    <label>Nombre visible (opcional)</label>
                    <input
                        value={name || ''}
                        onChange={(e) => onChangeName?.(e.target.value)}
                        placeholder={target === 'broker' ? 'Régimen Brokers vX' : 'Régimen Inmobiliarias vX'}
                        disabled={uploading}
                    />
                </div>

                <div className="admin-field">
                    <label>Archivo PDF</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                    <div
                        className={`admin-dropzone ${uploading ? 'disabled' : ''}`}
                        role="button"
                        tabIndex={uploading ? -1 : 0}
                        onClick={openFilePicker}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openFilePicker();
                            }
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const f = e.dataTransfer?.files?.[0] ?? null;
                            applyFile(f);
                        }}
                        aria-label="Seleccionar PDF de régimen"
                    >
                        <span className="admin-dropzone-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 3v10m0-10 4 4m-4-4-4 4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        <div>
                            <div className="admin-dropzone-title">Arrastra tu PDF aquí</div>
                            <div className="admin-dropzone-hint">o haz clic para seleccionar</div>
                        </div>
                    </div>
                    {file ? <div className="admin-dropzone-file">{file.name}</div> : null}
                </div>

                <div className="admin-modal-actions">
                    <button type="button" className="admin-modal-btn" onClick={onClose} disabled={uploading}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="admin-modal-btn primary"
                        onClick={onConfirm}
                        disabled={uploading || !file}
                    >
                        {uploading ? 'Subiendo…' : 'Subir y activar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RegimenHistoryModal({ title, items, onDownload, onClose }) {
    useBodyScrollLock(true);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="admin-modal wide">
                <div className="admin-modal-title-row">
                    <h3 className="admin-modal-title">{title}</h3>
                    <button type="button" className="admin-modal-x" onClick={onClose} aria-label="Cerrar">
                        ×
                    </button>
                </div>

                {items?.length ? (
                    <ul className="admin-list">
                        {items.map((r) => (
                            <li key={r.id} className="admin-list-item">
                                <span className="admin-list-main">
                                    v{r.version} — {r.display_name}
                                    {r.is_active ? ' (activo)' : ''}
                                    {r.created_at ? ` — ${new Date(r.created_at).toLocaleString('es-MX')}` : ''}
                                </span>
                                <button
                                    type="button"
                                    className="admin-link-btn"
                                    onClick={() => onDownload?.(r.id)}
                                >
                                    Descargar
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="admin-muted">Sin historial.</div>
                )}
            </div>
        </div>
    );
}

function SignedRegimensHistoryModal({ user, role, isChild, onClose }) {
    useBodyScrollLock(true);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');

    useEffect(() => {
        if (!supabase) return;

        let cancelled = false;
        setErrorText('');

        if (role !== 'broker' && role !== 'inmobiliaria') {
            setItems([]);
            setLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (role === 'broker' && isChild) {
            setItems([]);
            setLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setLoading(true);
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('regimens_signed')
                    .select('id, created_at, file_name, regimen_id, regimens_master(display_name, target, version, is_active)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) {
                    setErrorText(sanitizeBackendMessage(e?.message || 'No se pudo cargar el historial de regímenes firmados.'));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isChild, role, user?.id]);

    const downloadSigned = async (signedId) => {
        if (!supabase) return;
        setErrorText('');
        try {
            const data = await edgePost('regimen-download-url', { kind: 'signed', signedId });
            const url = data?.url;
            if (!url) throw new Error('No se pudo generar URL de descarga.');
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
            setErrorText(sanitizeBackendMessage(e?.message || 'No se pudo descargar el PDF firmado.'));
        }
    };

    return (
        <div
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="admin-modal wide">
                <div className="admin-modal-title-row">
                    <h3 className="admin-modal-title">Historial de regímenes firmados</h3>
                    <button type="button" className="admin-modal-x" onClick={onClose} aria-label="Cerrar">
                        ×
                    </button>
                </div>

                {role === 'broker' && isChild ? (
                    <div className="admin-muted">
                        Broker ligado a inmobiliaria: no firma régimen (hereda el del representante).
                    </div>
                ) : null}

                {errorText ? <div className="admin-modal-error">{errorText}</div> : null}

                {loading ? (
                    <div className="admin-muted">Cargando…</div>
                ) : (
                    <>
                        {items?.length ? (
                            <ul className="admin-list">
                                {items.map((s) => (
                                    <li key={s.id} className="admin-list-item">
                                        <span className="admin-list-main">
                                            {s?.regimens_master?.display_name || 'Régimen'} — {new Date(s.created_at).toLocaleString('es-MX')}
                                        </span>
                                        <button
                                            type="button"
                                            className="admin-link-btn"
                                            onClick={() => downloadSigned(s.id)}
                                        >
                                            Descargar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="admin-muted">Sin firmas registradas.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function UserQuotesHistoryModal({ user, onClose }) {
    useBodyScrollLock(true);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');

    useEffect(() => {
        if (!supabase) return;
        let cancelled = false;
        setLoading(true);
        setErrorText('');

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('quotes')
                    .select('*')
                    .eq('broker_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) setErrorText(sanitizeBackendMessage(e?.message || 'No se pudieron cargar cotizaciones.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const downloadQuotePdf = async (quote) => {
        setErrorText('');
        try {
            const bytes = await generateQuotePdfBytes(quote);
            const filename = buildQuoteFilename(quote);
            downloadPdfBytes(bytes, filename);
        } catch (e) {
            setErrorText(sanitizeBackendMessage(e?.message || 'No se pudo generar el PDF.'));
        }
    };

    const formatMoney = (v) => {
        try {
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(Number(v || 0));
        } catch {
            return String(v ?? '—');
        }
    };

    const methodLabel = (m) => (String(m || '').toUpperCase() === 'MSI_44' ? '44 MSI' : '3 anualidades + 40 MSI');

    return (
        <div
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="admin-modal wide">
                <div className="admin-modal-title-row">
                    <h3 className="admin-modal-title">Historial de cotizaciones</h3>
                    <button type="button" className="admin-modal-x" onClick={onClose} aria-label="Cerrar">
                        ×
                    </button>
                </div>

                {errorText ? <div className="admin-modal-error">{errorText}</div> : null}

                {loading ? (
                    <div className="admin-muted">Cargando…</div>
                ) : (
                    <>
                        {items?.length ? (
                            <div className="admin-table-wrapper" style={{ marginTop: 8 }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Fecha</th>
                                            <th>Lote</th>
                                            <th>Cliente</th>
                                            <th>Método</th>
                                            <th>Total</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((q) => (
                                            <tr key={q.id}>
                                                <td className="cell-phone">{q.id}</td>
                                                <td className="cell-phone">{q.created_at ? new Date(q.created_at).toLocaleString('es-MX') : '—'}</td>
                                                <td className="cell-phone">{q.lot_number ? `LOTE ${q.lot_number}` : '—'}</td>
                                                <td className="cell-email">{q.lead_name_snapshot || '—'}</td>
                                                <td className="cell-phone">{methodLabel(q.payment_method)}</td>
                                                <td className="cell-phone" style={{ textAlign: 'right' }}>{formatMoney(q.costo_final)}</td>
                                                <td className="cell-phone" style={{ textAlign: 'right' }}>
                                                    <button type="button" className="admin-link-btn" onClick={() => downloadQuotePdf(q)}>
                                                        Descargar PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="admin-muted">Sin cotizaciones registradas.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function UserEditModal({ user, onClose, onSave, saving, errorText, onForceRegimeResubmit, onEnablePasswordReset }) {
    useBodyScrollLock(true);

    const [form, setForm] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
    });

    const [childInfo, setChildInfo] = useState({ checked: false, isChild: false });
    const [signedModalOpen, setSignedModalOpen] = useState(false);
    const [quotesModalOpen, setQuotesModalOpen] = useState(false);

    useEffect(() => {
        if (signedModalOpen || quotesModalOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, quotesModalOpen, signedModalOpen]);

    const role = String(user?.role ?? '').toLowerCase();

    useEffect(() => {
        if (!supabase) return;
        if (role !== 'broker') {
            setChildInfo({ checked: true, isChild: false });
            return;
        }

        let cancelled = false;

        (async () => {
            let isChild = false;
            try {
                if (role === 'broker' && user?.org_id) {
                    const { data: rep } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', 'inmobiliaria')
                        .eq('org_id', user.org_id)
                        .eq('is_active', true)
                        .maybeSingle();
                    isChild = Boolean(rep?.id);
                }
            } catch {
                isChild = false;
            }

            if (!cancelled) setChildInfo({ checked: true, isChild });
        })();

        return () => {
            cancelled = true;
        };
    }, [role, user?.org_id]);

    const submit = (e) => {
        e.preventDefault();
        onSave?.({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim()
        });
    };

    const isChildBroker = role === 'broker' && childInfo.checked && childInfo.isChild;

    return (
        <>
            <div
                className="admin-modal-overlay"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) onClose?.();
                }}
            >
                <div className="admin-modal">
                    <div className="admin-modal-title-row">
                        <h3 className="admin-modal-title">Editar usuario</h3>
                        <button type="button" className="admin-modal-x" onClick={onClose} disabled={saving} aria-label="Cerrar">
                            ×
                        </button>
                    </div>
                    <form onSubmit={submit} className="admin-modal-form">
                        {errorText ? <div className="admin-modal-error">{errorText}</div> : null}
                        <div className="admin-field">
                            <label>ID</label>
                            <input value={user.public_id || user.id} readOnly />
                        </div>
                        <div className="admin-field">
                            <label>Rol</label>
                            <input value={role || '—'} readOnly />
                        </div>
                        <div className="admin-field">
                            <label>Nombre</label>
                            <input value={form.first_name} onChange={(e) => setForm((v) => ({ ...v, first_name: e.target.value }))} />
                        </div>
                        <div className="admin-field">
                            <label>Apellido</label>
                            <input value={form.last_name} onChange={(e) => setForm((v) => ({ ...v, last_name: e.target.value }))} />
                        </div>
                        <div className="admin-field">
                            <label>Correo</label>
                            <input type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} />
                        </div>
                        <div className="admin-field">
                            <label>Celular</label>
                            <input value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} />
                        </div>
                        {role !== 'admin' ? (
                            <div className="admin-field">
                                <label>Acceso</label>
                                <div className="admin-muted">
                                    Invalida la contraseña actual y habilita el flujo de restablecimiento para este usuario.
                                </div>
                                <button
                                    type="button"
                                    className="admin-modal-btn warn"
                                    onClick={() => onEnablePasswordReset?.(user)}
                                    disabled={saving}
                                    style={{ marginTop: 10 }}
                                >
                                    Habilitar restablecimiento de contraseña
                                </button>
                            </div>
                        ) : null}

                        {role === 'broker' || role === 'inmobiliaria' ? (
                            <div className="admin-field">
                                <label>Historial</label>
                                <div className="admin-muted">
                                    Consulta y descarga regímenes firmados y cotizaciones generadas por este usuario.
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                                    {role === 'broker' && isChildBroker ? (
                                        <div className="admin-muted">
                                            Broker ligado a inmobiliaria: no firma régimen (hereda el del representante).
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="admin-modal-btn"
                                            onClick={() => setSignedModalOpen(true)}
                                            disabled={saving}
                                        >
                                            Ver regímenes
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="admin-modal-btn"
                                        onClick={() => setQuotesModalOpen(true)}
                                        disabled={saving}
                                    >
                                        Ver cotizaciones
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {(role === 'broker' || role === 'inmobiliaria') && !(role === 'broker' && isChildBroker) ? (
                            <div className="admin-field">
                                <label>Régimen</label>
                                <div className="admin-muted">
                                    Habilita el reenvío de régimen para casos especiales (por ejemplo, si el usuario subió un PDF incorrecto).
                                </div>
                                <button
                                    type="button"
                                    className="admin-modal-btn warn"
                                    onClick={() => onForceRegimeResubmit?.(user)}
                                    disabled={saving}
                                    style={{ marginTop: 10 }}
                                >
                                    Habilitar reenvío de régimen
                                </button>
                            </div>
                        ) : null}

                        <div className="admin-modal-actions">
                            <button type="button" className="admin-modal-btn" onClick={onClose} disabled={saving}>
                                Cancelar
                            </button>
                            <button type="submit" className="admin-modal-btn primary" disabled={saving}>
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {signedModalOpen ? (
                <SignedRegimensHistoryModal
                    user={user}
                    role={role}
                    isChild={isChildBroker}
                    onClose={() => setSignedModalOpen(false)}
                />
            ) : null}

            {quotesModalOpen ? (
                <UserQuotesHistoryModal
                    user={user}
                    onClose={() => setQuotesModalOpen(false)}
                />
            ) : null}
        </>
    );
}

function LeadEditModal({ lead, onClose, onSave, saving, errorText }) {
    useBodyScrollLock(true);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const [form, setForm] = useState({
        lead_first_name: lead.lead_first_name || '',
        lead_last_name: lead.lead_last_name || '',
        lead_email: lead.lead_email || '',
        lead_phone: lead.lead_phone || '',
        lot_number: lead.lot_number || '',
        lot_type: lead.lot_type || '',
        esquema: lead.esquema || 'prospector',
        regimen: lead.regimen || 'PENDIENTE_DEFINIR'
    });

    const submit = (e) => {
        e.preventDefault();
        const esquema = String(form.esquema || '').trim().toLowerCase();
        if (!['referidor', 'prospector', 'cerrador'].includes(esquema)) return;
        onSave?.({
            lead_first_name: form.lead_first_name.trim(),
            lead_last_name: form.lead_last_name.trim(),
            lead_email: form.lead_email.trim(),
            lead_phone: form.lead_phone.trim(),
            lot_number: form.lot_number.trim(),
            lot_type: form.lot_type.trim(),
            esquema
        });
    };

    return (
        <div
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="admin-modal">
                <div className="admin-modal-title-row">
                    <h3 className="admin-modal-title">Editar lead</h3>
                    <button type="button" className="admin-modal-x" onClick={onClose} disabled={saving} aria-label="Cerrar">
                        ×
                    </button>
                </div>
                <form onSubmit={submit} className="admin-modal-form">
                    {errorText ? <div className="admin-modal-error">{errorText}</div> : null}
                    <div className="admin-field">
                        <label>ID (solo lectura)</label>
                        <input value={lead.id} readOnly />
                    </div>
                    <div className="admin-field">
                        <label>Nombre</label>
                        <input value={form.lead_first_name} onChange={(e) => setForm((v) => ({ ...v, lead_first_name: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                        <label>Apellido</label>
                        <input value={form.lead_last_name} onChange={(e) => setForm((v) => ({ ...v, lead_last_name: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                        <label>Correo</label>
                        <input type="email" value={form.lead_email} onChange={(e) => setForm((v) => ({ ...v, lead_email: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                        <label>Celular</label>
                        <input value={form.lead_phone} onChange={(e) => setForm((v) => ({ ...v, lead_phone: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                        <label>Lote</label>
                        <input value={form.lot_number} onChange={(e) => setForm((v) => ({ ...v, lot_number: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                        <label>Tipo</label>
                        <input value={form.lot_type} onChange={(e) => setForm((v) => ({ ...v, lot_type: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                        <label>Esquema</label>
                        <select value={form.esquema} onChange={(e) => setForm((v) => ({ ...v, esquema: e.target.value }))}>
                            <option value="referidor">Referidor</option>
                            <option value="prospector">Prospector</option>
                            <option value="cerrador">Cerrador</option>
                        </select>
                    </div>
                    <div className="admin-field">
                        <label>Régimen</label>
                        <input value={form.regimen} disabled />
                    </div>

                    <div className="admin-modal-actions">
                        <button type="button" className="admin-modal-btn" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="admin-modal-btn primary" disabled={saving}>
                            {saving ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const VIEW_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'brokers', label: 'Brokers' },
    { value: 'inmobiliarias', label: 'Inmobiliarias' }
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'deactivated', label: 'Desactivados' }
];

const LEAD_VIEW_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'brokers', label: 'Solo Brokers' },
    { value: 'inmobiliarias', label: 'Solo Inmobiliarias' }
];

const LEAD_STATE_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'REUNION', label: 'Reunión' },
    { value: 'EXPIRADO', label: 'Expirado' },
    { value: 'CERRADO', label: 'Cerrado' }
];

const emptyBrokerForm = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    org_id: ''
};

const emptySubAdminForm = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: ''
};

const emptyOrgForm = {
    company_name: '',
    rep_first_name: '',
    rep_last_name: '',
    rep_phone: '',
    rep_email: ''
};

export default function AdminPage() {
    const { profile: myProfile } = useAuth();
    const myRole = String(myProfile?.role || '').toLowerCase();
    const canCreateStaff = myRole === 'admin';

    const [orgs, setOrgs] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');

    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [leadsError, setLeadsError] = useState('');

    const [editingUser, setEditingUser] = useState(null);
    const [deactivateUser, setDeactivateUser] = useState(null);
    const [reactivateUser, setReactivateUser] = useState(null);
    const [forceRegimeResubmitUser, setForceRegimeResubmitUser] = useState(null);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [savingUser, setSavingUser] = useState(false);
    const [userModalError, setUserModalError] = useState('');
    const [forceRegimeResubmitError, setForceRegimeResubmitError] = useState('');
    const [resetPasswordError, setResetPasswordError] = useState('');

    const [editingLead, setEditingLead] = useState(null);
    const [deleteLead, setDeleteLead] = useState(null);
    const [savingLead, setSavingLead] = useState(false);
    const [leadModalError, setLeadModalError] = useState('');

    const [createMode, setCreateMode] = useState('broker'); // 'broker' | 'inmobiliaria' | 'subadmin'
    const [viewMode, setViewMode] = useState('all'); // 'all' | 'brokers' | 'inmobiliarias'
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

    const [leadViewMode, setLeadViewMode] = useState('all'); // 'all' | 'brokers' | 'inmobiliarias'
    const [leadSearchText, setLeadSearchText] = useState('');
    const [leadStateFilter, setLeadStateFilter] = useState('all'); // 'all' | VIGENTE | REUNION | EXPIRADO | CERRADO

    const [brokerForm, setBrokerForm] = useState(emptyBrokerForm);
    const [subAdminForm, setSubAdminForm] = useState(emptySubAdminForm);
    const [orgForm, setOrgForm] = useState(emptyOrgForm);

    const [regimensLoading, setRegimensLoading] = useState(false);
    const [regimensError, setRegimensError] = useState('');
    const [regimens, setRegimens] = useState({
        broker: { active: null, list: [] },
        inmobiliaria: { active: null, list: [] },
        broker_referido: { active: null, list: [] },
        inmobiliaria_referida: { active: null, list: [] }
    });

    const [uploadRegimen, setUploadRegimen] = useState(null); // { target }
    const [uploadRegimenFile, setUploadRegimenFile] = useState(null);
    const [uploadRegimenName, setUploadRegimenName] = useState('');
    const [uploadRegimenError, setUploadRegimenError] = useState('');
    const [uploadingRegimen, setUploadingRegimen] = useState(false);
    const [confirmUploadRegimen, setConfirmUploadRegimen] = useState(null); // { target }
    const [regimenHistory, setRegimenHistory] = useState(null); // { target: 'broker' | 'inmobiliaria' | 'broker_referido' | 'inmobiliaria_referida' }

    const orgMap = useMemo(() => {
        return orgs.reduce((acc, org) => {
            acc[org.id] = org.company_name;
            return acc;
        }, {});
    }, [orgs]);

    const refreshRegimens = async () => {
        setRegimensError('');
        if (!supabase) return;
        try {
            setRegimensLoading(true);
            const { data, error: regErr } = await supabase
                .from('regimens_master')
                .select('id, target, version, display_name, file_name, is_active, created_at')
                .order('created_at', { ascending: false });

            if (regErr) throw regErr;

            const byTarget = { broker: [], inmobiliaria: [], broker_referido: [], inmobiliaria_referida: [] };
            (data || []).forEach((r) => {
                const t = String(r.target || '').toLowerCase();
                if (t === 'broker') byTarget.broker.push(r);
                if (t === 'inmobiliaria') byTarget.inmobiliaria.push(r);
                if (t === 'broker_referido') byTarget.broker_referido.push(r);
                if (t === 'inmobiliaria_referida') byTarget.inmobiliaria_referida.push(r);
            });

            const pickActive = (arr) => arr.find((x) => x.is_active) || null;
            setRegimens({
                broker: { active: pickActive(byTarget.broker), list: byTarget.broker },
                inmobiliaria: { active: pickActive(byTarget.inmobiliaria), list: byTarget.inmobiliaria },
                broker_referido: { active: pickActive(byTarget.broker_referido), list: byTarget.broker_referido },
                inmobiliaria_referida: { active: pickActive(byTarget.inmobiliaria_referida), list: byTarget.inmobiliaria_referida }
            });
        } catch (e) {
            setRegimensError(`No se pudieron cargar regímenes. ${sanitizeBackendMessage(e?.message || '')}`.trim());
        } finally {
            setRegimensLoading(false);
        }
    };

    const downloadRegimen = async ({ target, regimenId }) => {
        setError('');
        setNotice('');
        try {
            const data = await edgePost('regimen-download-url', { kind: 'master', target, regimenId: regimenId || null });
            const url = data?.url;
            if (!url) throw new Error('No se pudo generar URL de descarga.');
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
            setError(sanitizeBackendMessage(e?.message || 'No se pudo descargar el PDF.'));
        }
    };

    const runUploadRegimen = async ({ target }) => {
        if (!supabase) {
            setUploadRegimenError('Supabase no está configurado.');
            setConfirmUploadRegimen(null);
            setUploadRegimen({ target });
            return;
        }
        if (!uploadRegimenFile) {
            setUploadRegimenError('Selecciona un PDF para continuar.');
            setConfirmUploadRegimen(null);
            setUploadRegimen({ target });
            return;
        }
        setUploadingRegimen(true);
        setUploadRegimenError('');
        try {
            const start = await edgePost('regimen-admin-start-upload', {
                target,
                displayName: uploadRegimenName?.trim() || null,
                fileName: uploadRegimenFile.name
            });
            const regimen = start?.regimen;
            const upload = start?.upload;
            if (!regimen?.id || !upload?.bucket || !upload?.path || !upload?.token) {
                throw new Error('No se pudo preparar la subida del régimen.');
            }

            const { error: upErr } = await supabase.storage
                .from(upload.bucket)
                .uploadToSignedUrl(upload.path, upload.token, uploadRegimenFile);
            if (upErr) throw upErr;

            await edgePost('regimen-admin-activate', { regimenId: regimen.id });

            setNotice('Régimen subido y activado. Los usuarios objetivo quedaron en estado INACTIVO hasta firmar.');
            setUploadRegimen(null);
            setConfirmUploadRegimen(null);
            setUploadRegimenFile(null);
            setUploadRegimenName('');
            await refreshRegimens();
            await refreshData();
        } catch (e) {
            setUploadRegimenError(sanitizeBackendMessage(e?.message || 'No se pudo subir/activar el régimen.'));
            console.error(e);
        } finally {
            setUploadingRegimen(false);
        }
    };

    const refreshData = async () => {
        setError('');
        if (!isSupabaseConfigured || !supabase) {
            setError('Supabase no está configurado. Revisa tus variables de entorno.');
            return;
        }

        try {
            setLoading(true);

            const [{ data: orgData, error: orgErr }, { data: profileData, error: profileErr }] = await Promise.all([
                supabase.from('organizations').select('id, company_name, created_at').order('created_at', { ascending: false }),
                supabase
                    .from('profiles')
                    .select('id, public_id, first_name, last_name, phone, email, role, org_id, is_active, account_status, created_at, referred_by, is_referred')
                    .in('role', ['broker', 'inmobiliaria', 'subadmin'])
                    .order('created_at', { ascending: false })
            ]);

            let finalProfileData = profileData;
            let finalProfileErr = profileErr;
            if (finalProfileErr && /account_status/i.test(String(finalProfileErr.message ?? ''))) {
                const fallback = await supabase
                    .from('profiles')
                    .select('id, public_id, first_name, last_name, phone, email, role, org_id, is_active, created_at, referred_by, is_referred')
                    .in('role', ['broker', 'inmobiliaria', 'subadmin'])
                    .order('created_at', { ascending: false });
                finalProfileData = fallback.data;
                finalProfileErr = fallback.error;
            }

            if (orgErr || finalProfileErr) {
                throw orgErr || finalProfileErr;
            }

            setOrgs(orgData ?? []);
            setUsuarios(finalProfileData ?? []);
        } catch (err) {
            const msg = String(err?.message ?? '');
            if (/public_id/i.test(msg)) {
                setError('Falta configurar `profiles.public_id` en Supabase. Ejecuta `supabase/profiles_public_id.sql` en el SQL Editor.');
            } else {
                setError('No se pudo cargar la información del panel admin.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        refreshLeads();
        refreshRegimens();
    }, []);

    const refreshLeads = async () => {
        setLeadsError('');
        if (!isSupabaseConfigured || !supabase) {
            setLeadsError('Supabase no está configurado. Revisa tus variables de entorno.');
            return;
        }

        try {
            setLoadingLeads(true);
            const baseQuery = () =>
                supabase
                    .from('leads')
                    .select('id, created_at, created_by_user_id, created_by_role, inmobiliaria_id, inmobiliaria_name, lead_first_name, lead_last_name, lead_email, lead_phone, lot_number, lot_type, lead_state, expires_at, esquema, regimen, hl_status')
                    .order('created_at', { ascending: false })
                    .limit(500);

            try {
                const { data, error: qErr } = await baseQuery().eq('is_deleted', false);
                if (qErr) throw qErr;
                setLeads(Array.isArray(data) ? data : []);
            } catch (innerErr) {
                const msg = String(innerErr?.message ?? '');
                if (/is_deleted/i.test(msg)) {
                    const { data, error: qErr } = await baseQuery();
                    if (qErr) throw qErr;
                    setLeads(Array.isArray(data) ? data : []);
                } else {
                    throw innerErr;
                }
            }
        } catch (err) {
            setLeadsError('No se pudieron cargar los leads.');
            console.error(err);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleLogout = async () => {
        await supabase?.auth?.signOut?.();
        window.location.href = '/brokers';
    };

    const createUser = async (payload) => {
        setNotice('');
        setError('');

        if (!isSupabaseConfigured || !supabase) {
            setError('Supabase no está configurado. Revisa tus variables de entorno.');
            return null;
        }

        try {
            const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr) {
                setError('No se pudo leer tu sesión. Vuelve a iniciar sesión.');
                throw sessionErr;
            }

            let accessToken = sessionData?.session?.access_token;

            const isJwt = (token) => {
                if (!token || typeof token !== 'string') return false;
                const parts = token.split('.');
                return parts.length === 3 && parts.every(Boolean);
            };

            // In some edge-cases the stored session can be stale; refresh and ensure we have a real JWT.
            if (!isJwt(accessToken)) {
                const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
                if (refreshErr) {
                    setError('No se pudo refrescar tu sesión. Vuelve a iniciar sesión.');
                    throw refreshErr;
                }
                accessToken = refreshed?.session?.access_token;
            }

            if (!isJwt(accessToken)) {
                setError('No hay sesión activa. Vuelve a iniciar sesión.');
                throw new Error('Missing access token');
            }

            // Call Edge Function via fetch to avoid header-merging surprises in some setups.
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const endpoint = `${supabaseUrl}/functions/v1/admin-create-user`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify(payload)
            });

            const raw = await response.text();
            let parsed = null;
            try {
                parsed = raw ? JSON.parse(raw) : null;
            } catch {
                parsed = null;
            }

            if (!response.ok) {
                const serverMsg = parsed?.error ? String(parsed.error) : null;
                const messageMsg = parsed?.message ? String(parsed.message) : null;
                const descMsg = parsed?.error_description ? String(parsed.error_description) : null;
                const detailsMsg = parsed?.details ? String(parsed.details) : null;
                const missingMsg = Array.isArray(parsed?.missing) ? `Faltan: ${parsed.missing.join(', ')}` : null;
                const rawMsg = !parsed && raw ? `Respuesta: ${raw.slice(0, 180)}` : null;
                const statusMsg = `HTTP ${response.status}`;
                setError([serverMsg, messageMsg, descMsg, detailsMsg, missingMsg, rawMsg, statusMsg].filter(Boolean).join(' — ') || statusMsg);
                throw new Error(`Edge Function error: ${response.status}`);
            }

            const requiresSelfSetup = Boolean(parsed?.password_setup_required);
            setNotice(
                requiresSelfSetup
                    ? 'Usuario creado y correo activado. Deberá crear su propia contraseña en su primer inicio de sesión.'
                    : 'Usuario creado correctamente.'
            );
            return parsed ?? null;
        } catch (err) {
            // Preserve the most specific error already set above.
            setError((prev) => prev || 'No se pudo crear el usuario. Revisa la Edge Function y los permisos.');
            console.error(err);
            throw err;
        }
    };

    const handleCreateBroker = async (event) => {
        event.preventDefault();
        setNotice('');
        setError('');

        try {
            await createUser({
                role: 'broker',
                first_name: brokerForm.first_name,
                last_name: brokerForm.last_name,
                phone: brokerForm.phone,
                email: brokerForm.email,
                // Brokers asociados se crean desde el panel de la inmobiliaria.
                org_id: null
            });
            setBrokerForm(emptyBrokerForm);
            await refreshData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateSubAdmin = async (event) => {
        event.preventDefault();
        setNotice('');
        setError('');

        try {
            await createUser({
                role: 'subadmin',
                first_name: subAdminForm.first_name,
                last_name: subAdminForm.last_name,
                phone: subAdminForm.phone,
                email: subAdminForm.email,
                password: subAdminForm.password
            });
            setSubAdminForm(emptySubAdminForm);
            await refreshData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateInmobiliaria = async (event) => {
        event.preventDefault();
        setNotice('');
        setError('');

        try {
            await createUser({
                role: 'inmobiliaria',
                company_name: orgForm.company_name,
                first_name: orgForm.rep_first_name,
                last_name: orgForm.rep_last_name,
                phone: orgForm.rep_phone,
                email: orgForm.rep_email
            });
            setOrgForm(emptyOrgForm);
            await refreshData();
        } catch (err) {
            console.error(err);
        }
    };

    const saveUserEdits = async (updates) => {
        if (!supabase || !editingUser) return;
        setSavingUser(true);
        setUserModalError('');
        setNotice('');
        setError('');
        try {
            await edgePost('manage-user', {
                action: 'update',
                userId: editingUser.id,
                updates
            });

            setNotice('Usuario actualizado.');
            setEditingUser(null);
            await refreshData();
        } catch (err) {
            const msg = sanitizeBackendMessage(err?.message || 'No se pudo actualizar el usuario.');
            setUserModalError(msg);
        } finally {
            setSavingUser(false);
        }
    };

    const deactivateUserNow = async () => {
        if (!supabase || !deactivateUser) return;
        setSavingUser(true);
        setNotice('');
        setError('');
        try {
            await edgePost('manage-user', {
                action: 'deactivate',
                userId: deactivateUser.id
            });

            setNotice('Usuario desactivado.');
            setDeactivateUser(null);
            await refreshData();
        } catch (err) {
            setError(sanitizeBackendMessage(err?.message || 'No se pudo desactivar el usuario.'));
        } finally {
            setSavingUser(false);
        }
    };

    const reactivateUserNow = async () => {
        if (!supabase || !reactivateUser) return;
        setSavingUser(true);
        setNotice('');
        setError('');
        try {
            const data = await edgePost('manage-user', { action: 'reactivate', userId: reactivateUser.id });
            if (String(data?.account_status ?? '').toLowerCase() === 'inactive') {
                setNotice('Usuario reactivado, pero quedó INACTIVO: debe firmar el régimen vigente para poder registrar leads.');
            } else {
                setNotice('Usuario reactivado.');
            }
            setReactivateUser(null);
            await refreshData();
        } catch (err) {
            setError(sanitizeBackendMessage(err?.message || 'No se pudo reactivar el usuario.'));
        } finally {
            setSavingUser(false);
        }
    };

    const forceRegimeResubmitNow = async () => {
        if (!supabase || !forceRegimeResubmitUser) return;
        setSavingUser(true);
        setForceRegimeResubmitError('');
        setNotice('');
        setError('');
        try {
            await edgePost('manage-user', { action: 'force_regime_resubmit', userId: forceRegimeResubmitUser.id });
            setNotice('Reenvío de régimen habilitado: el usuario quedó INACTIVO hasta que suba un nuevo régimen firmado.');
            setForceRegimeResubmitUser(null);
            setEditingUser(null);
            await refreshData();
        } catch (err) {
            setForceRegimeResubmitError(sanitizeBackendMessage(err?.message || 'No se pudo habilitar el reenvío de régimen.'));
        } finally {
            setSavingUser(false);
        }
    };

    const enablePasswordResetNow = async () => {
        if (!supabase || !resetPasswordUser) return;
        setSavingUser(true);
        setResetPasswordError('');
        setNotice('');
        setError('');
        try {
            await edgePost('manage-user', { action: 'enable_password_reset', userId: resetPasswordUser.id });
            setNotice('Restablecimiento habilitado: el usuario quedó INACTIVO hasta que complete la creación de su nueva contraseña.');
            setResetPasswordUser(null);
            setEditingUser(null);
            await refreshData();
        } catch (err) {
            setResetPasswordError(sanitizeBackendMessage(err?.message || 'No se pudo habilitar restablecimiento de contraseña.'));
        } finally {
            setSavingUser(false);
        }
    };

    const saveLeadEdits = async (updates) => {
        if (!supabase || !editingLead) return;
        setSavingLead(true);
        setLeadModalError('');
        setNotice('');
        setError('');
        try {
            if (updates.esquema && !['referidor', 'prospector', 'cerrador'].includes(String(updates.esquema))) {
                setLeadModalError('Esquema inválido.');
                return;
            }
            const payload = {
                lead_first_name: updates.lead_first_name || null,
                lead_last_name: updates.lead_last_name || null,
                lead_email: updates.lead_email || null,
                lead_phone: updates.lead_phone || null,
                lot_number: updates.lot_number || null,
                lot_type: updates.lot_type || null,
                // Admin puede editar esquema. Régimen se mantiene solo lectura por ahora.
                esquema: updates.esquema || null
            };

            const { error: upErr } = await supabase.from('leads').update(payload).eq('id', editingLead.id);
            if (upErr) throw upErr;

            setNotice('Lead actualizado.');
            setEditingLead(null);
            await refreshLeads();
        } catch (err) {
            const msg = sanitizeBackendMessage(err?.message || 'No se pudo actualizar el lead.');
            setLeadModalError(msg);
        } finally {
            setSavingLead(false);
        }
    };

    const deleteLeadNow = async () => {
        if (!supabase || !deleteLead) return;
        setSavingLead(true);
        setLeadModalError('');
        setNotice('');
        setError('');
        try {
            const { data: userData, error: userErr } = await supabase.auth.getUser();
            if (userErr) throw userErr;
            const actorId = userData?.user?.id || null;

            const payload = {
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by_user_id: actorId
            };

            const { error: upErr } = await supabase.from('leads').update(payload).eq('id', deleteLead.id);
            if (upErr) {
                const msg = String(upErr?.message ?? '');
                if (/is_deleted/i.test(msg) || /deleted_at/i.test(msg) || /deleted_by_user_id/i.test(msg)) {
                    throw new Error('Faltan columnas de soft delete en `public.leads`. Ejecuta el SQL `supabase/leads_soft_delete.sql` en Supabase.');
                }
                throw upErr;
            }

            setNotice('Lead eliminado.');
            setDeleteLead(null);
            await refreshLeads();
        } catch (err) {
            const msg = sanitizeBackendMessage(err?.message || 'No se pudo eliminar el lead.');
            setLeadModalError(msg);
        } finally {
            setSavingLead(false);
        }
    };

    const usuariosFiltrados = useMemo(() => {
        const q = searchText.trim().toLowerCase();

        let list = usuarios;

        const userState = (u) => {
            const acc = String(u?.account_status ?? 'active').toLowerCase();
            if (u?.is_active === false || acc === 'deactivated') return 'deactivated';
            if (acc === 'inactive') return 'inactive';
            return 'active';
        };

        if (viewMode === 'brokers') {
            list = list.filter((u) => u.role === 'broker');
        } else if (viewMode === 'inmobiliarias') {
            list = list.filter((u) => u.role === 'inmobiliaria');
        }

        if (statusFilter === 'active') {
            list = list.filter((u) => userState(u) === 'active');
        } else if (statusFilter === 'inactive') {
            list = list.filter((u) => userState(u) === 'inactive');
        } else if (statusFilter === 'deactivated') {
            list = list.filter((u) => userState(u) === 'deactivated');
        }

        if (!q) return list;

        return list.filter((u) => {
            const nombre = [u.first_name, u.last_name].filter(Boolean).join(' ');
            const orgLabel = u.org_id ? (orgMap[u.org_id] || u.org_id) : '';
            const tipo = u.role === 'broker' ? 'broker' : u.role === 'inmobiliaria' ? 'inmobiliaria' : (u.role === 'subadmin' ? 'subadmin' : '');
            const haystack = [u.public_id, tipo, nombre, u.email, u.phone, orgLabel]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [orgMap, searchText, statusFilter, usuarios, viewMode]);

    const getPublicId = (u) => {
        const pid = String(u?.public_id || '').trim();
        if (pid) return pid;
        const uuid = String(u?.id || '').trim();
        return uuid ? uuid.slice(0, 6).toUpperCase() : '—';
    };

    const getNombreCompleto = (u) => {
        return [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
    };
 
    const getUserTypeLabel = (u) => {
        if (!u) return '—';
        const role = String(u.role || '').toLowerCase();
        const isReferred = u.is_referred || !!u.referred_by;
        const hasOrg = !!u.org_id;
 
        if (role === 'broker') {
            if (hasOrg) return 'Broker (Agencia)';
            if (isReferred) return 'Broker Referido';
            return 'Broker Independiente';
        }
        if (role === 'inmobiliaria') {
            if (isReferred) return 'Inmobiliaria Referida';
            return 'Inmobiliaria Independiente';
        }
        if (role === 'subadmin') return 'Sub-admin';
        if (role === 'admin') return 'Admin';
        return role || '—';
    };

    const getUserOriginLabel = (u) => {
        if (!u) return '—';
        if (u.referred_by) {
            const referrer = usuariosMap[u.referred_by];
            return referrer ? getNombreCompleto(referrer) : 'Referido';
        }
        if (u.org_id) {
            return orgMap[u.org_id] || u.org_id;
        }
        return '—';
    };

    const usuariosMap = useMemo(() => {
        return usuarios.reduce((acc, u) => {
            acc[u.id] = u;
            return acc;
        }, {});
    }, [usuarios]);

    const formatDateTime = (value) => {
        try {
            return new Date(value).toLocaleString('es-MX');
        } catch {
            return value || '—';
        }
    };

    const formatDateParts = (value) => {
        try {
            const d = new Date(value);
            return {
                date: d.toLocaleDateString('es-MX'),
                time: d.toLocaleTimeString('es-MX')
            };
        } catch {
            return { date: String(value || '—'), time: '' };
        }
    };

    const remainingDays = (expiresAt) => {
        if (!expiresAt) return null;
        const ts = new Date(expiresAt).getTime();
        if (!Number.isFinite(ts)) return null;
        const diff = ts - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const leadsFiltrados = useMemo(() => {
        const q = leadSearchText.trim().toLowerCase();

        let list = leads;

        if (leadViewMode === 'brokers') {
            list = list.filter((l) => (l.created_by_role || '').toLowerCase() === 'broker');
        } else if (leadViewMode === 'inmobiliarias') {
            // Leads ligados a una inmobiliaria (hijos o representante).
            list = list.filter((l) => Boolean(l.inmobiliaria_id));
        }

        if (leadStateFilter !== 'all') {
            const target = String(leadStateFilter).toUpperCase();
            list = list.filter((l) => String(l.lead_state || '').toUpperCase() === target);
        }

        if (!q) return list;

        return list.filter((l) => {
            const createdBy = usuariosMap[l.created_by_user_id];
            const brokerName = createdBy ? getNombreCompleto(createdBy) : ((l.created_by_role || '').toLowerCase() === 'admin' ? 'Admin' : '');
            const haystack = [
                l.lead_first_name,
                l.lead_last_name,
                l.lead_phone,
                l.lead_email,
                l.lot_number,
                l.lot_type,
                l.esquema,
                l.regimen,
                l.lead_state,
                brokerName,
                l.inmobiliaria_name
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [leadSearchText, leadStateFilter, leadViewMode, leads, usuariosMap]);

    const getOrgLabel = (u) => {
        if (!u.org_id) return '—';
        return orgMap[u.org_id] || u.org_id;
    };

    const colSpan = viewMode === 'all' ? 8 : 7;

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div className="admin-title">Panel Admin</div>
                    <button type="button" className="admin-logout" onClick={handleLogout}>
                        Cerrar sesión
                    </button>
                </div>

                {!isSupabaseConfigured && (
                    <div className="admin-error">
                        Falta configurar Supabase. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en tu `.env`.
                    </div>
                )}

                {error && <div className="admin-error">{error}</div>}
                {notice && <div className="admin-note">{notice}</div>}

                <div className="admin-main">
                    <div className="admin-left">
                        <div className="admin-card">
                            <div className="admin-card-head">
                                <h2>Agregar usuario</h2>
                                <select
                                    className="admin-dropdown"
                                    value={createMode}
                                    onChange={(e) => setCreateMode(e.target.value)}
                                    aria-label="Selecciona el tipo de usuario"
                                >
                                    <option value="broker">Broker</option>
                                    <option value="inmobiliaria">Inmobiliaria</option>
                                    {canCreateStaff ? <option value="subadmin">Sub-admin</option> : null}
                                </select>
                            </div>

                            {createMode === 'broker' ? (
                                <form className="admin-form" onSubmit={handleCreateBroker}>
                                    <div className="admin-field">
                                        <label>Nombre</label>
                                        <input value={brokerForm.first_name} onChange={(e) => setBrokerForm(v => ({ ...v, first_name: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Apellido</label>
                                        <input value={brokerForm.last_name} onChange={(e) => setBrokerForm(v => ({ ...v, last_name: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Celular</label>
                                        <input value={brokerForm.phone} onChange={(e) => setBrokerForm(v => ({ ...v, phone: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Correo</label>
                                        <input type="email" value={brokerForm.email} onChange={(e) => setBrokerForm(v => ({ ...v, email: e.target.value }))} />
                                    </div>
                                    <div className="admin-note">
                                        El broker creará su propia contraseña en su primer inicio de sesión.
                                    </div>
                                    <div className="admin-field">
                                        <label>Inmobiliaria (solo desde panel inmobiliaria)</label>
                                        <select value="" disabled>
                                            <option value="">Sin inmobiliaria</option>
                                            {orgs.map(org => (
                                                <option key={org.id} value={org.id}>{org.company_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="admin-action" type="submit" disabled={loading}>
                                        Crear broker
                                    </button>
                                </form>
                            ) : createMode === 'subadmin' ? (
                                <form className="admin-form" onSubmit={handleCreateSubAdmin}>
                                    <div className="admin-field">
                                        <label>Nombre</label>
                                        <input value={subAdminForm.first_name} onChange={(e) => setSubAdminForm(v => ({ ...v, first_name: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Apellido</label>
                                        <input value={subAdminForm.last_name} onChange={(e) => setSubAdminForm(v => ({ ...v, last_name: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Celular</label>
                                        <input value={subAdminForm.phone} onChange={(e) => setSubAdminForm(v => ({ ...v, phone: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Correo</label>
                                        <input type="email" value={subAdminForm.email} onChange={(e) => setSubAdminForm(v => ({ ...v, email: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Contraseña</label>
                                        <input type="password" value={subAdminForm.password} onChange={(e) => setSubAdminForm(v => ({ ...v, password: e.target.value }))} />
                                    </div>
                                    <button className="admin-action" type="submit" disabled={loading}>
                                        Crear sub-admin
                                    </button>
                                </form>
                            ) : (
                                <form className="admin-form" onSubmit={handleCreateInmobiliaria}>
                                    <div className="admin-field">
                                        <label>Compañía</label>
                                        <input value={orgForm.company_name} onChange={(e) => setOrgForm(v => ({ ...v, company_name: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Nombre representante</label>
                                        <input value={orgForm.rep_first_name} onChange={(e) => setOrgForm(v => ({ ...v, rep_first_name: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Apellido representante</label>
                                        <input value={orgForm.rep_last_name} onChange={(e) => setOrgForm(v => ({ ...v, rep_last_name: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Celular representante</label>
                                        <input value={orgForm.rep_phone} onChange={(e) => setOrgForm(v => ({ ...v, rep_phone: e.target.value }))} />
                                    </div>
                                    <div className="admin-field">
                                        <label>Correo representante</label>
                                        <input type="email" value={orgForm.rep_email} onChange={(e) => setOrgForm(v => ({ ...v, rep_email: e.target.value }))} />
                                    </div>
                                    <div className="admin-note">
                                        El representante creará su propia contraseña en su primer inicio de sesión.
                                    </div>
                                    <button className="admin-action" type="submit" disabled={loading}>
                                        Crear inmobiliaria
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="admin-card">
                            <h2>Régimen actual – Brokers</h2>
                            {regimensError ? <div className="admin-error">{regimensError}</div> : null}
                            <div className="admin-muted">
                                {regimensLoading ? 'Cargando…' : (regimens?.broker?.active?.display_name || 'Sin régimen activo')}
                            </div>
                            <div className="admin-row">
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => downloadRegimen({ target: 'broker', regimenId: regimens?.broker?.active?.id })}
                                    disabled={regimensLoading || !regimens?.broker?.active?.id}
                                >
                                    Descargar PDF
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => { setUploadRegimen({ target: 'broker' }); setUploadRegimenError(''); setUploadRegimenFile(null); setUploadRegimenName(''); }}
                                    disabled={regimensLoading}
                                >
                                    Subir nuevo régimen
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => setRegimenHistory({ target: 'broker' })}
                                    disabled={regimensLoading || !(regimens?.broker?.list || []).length}
                                >
                                    Historial
                                </button>
                            </div>
                        </div>

                        <div className="admin-card">
                            <h2>Régimen actual – Inmobiliarias</h2>
                            {regimensError ? <div className="admin-error">{regimensError}</div> : null}
                            <div className="admin-muted">
                                {regimensLoading ? 'Cargando…' : (regimens?.inmobiliaria?.active?.display_name || 'Sin régimen activo')}
                            </div>
                            <div className="admin-row">
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => downloadRegimen({ target: 'inmobiliaria', regimenId: regimens?.inmobiliaria?.active?.id })}
                                    disabled={regimensLoading || !regimens?.inmobiliaria?.active?.id}
                                >
                                    Descargar PDF
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => { setUploadRegimen({ target: 'inmobiliaria' }); setUploadRegimenError(''); setUploadRegimenFile(null); setUploadRegimenName(''); }}
                                    disabled={regimensLoading}
                                >
                                    Subir nuevo régimen
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => setRegimenHistory({ target: 'inmobiliaria' })}
                                    disabled={regimensLoading || !(regimens?.inmobiliaria?.list || []).length}
                                >
                                    Historial
                                </button>
                            </div>
                        </div>

                        <div className="admin-card">
                            <h2>Régimen actual – Brokers Referidos</h2>
                            {regimensError ? <div className="admin-error">{regimensError}</div> : null}
                            <div className="admin-muted">
                                {regimensLoading ? 'Cargando…' : (regimens?.broker_referido?.active?.display_name || 'Sin régimen activo')}
                            </div>
                            <div className="admin-row">
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => downloadRegimen({ target: 'broker_referido', regimenId: regimens?.broker_referido?.active?.id })}
                                    disabled={regimensLoading || !regimens?.broker_referido?.active?.id}
                                >
                                    Descargar PDF
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => { setUploadRegimen({ target: 'broker_referido' }); setUploadRegimenError(''); setUploadRegimenFile(null); setUploadRegimenName(''); }}
                                    disabled={regimensLoading}
                                >
                                    Subir nuevo régimen
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => setRegimenHistory({ target: 'broker_referido' })}
                                    disabled={regimensLoading || !(regimens?.broker_referido?.list || []).length}
                                >
                                    Historial
                                </button>
                            </div>
                        </div>

                        <div className="admin-card">
                            <h2>Régimen – Inmobiliarias Referidas</h2>
                            {regimensError ? <div className="admin-error">{regimensError}</div> : null}
                            <div className="admin-muted">
                                {regimensLoading ? 'Cargando…' : (regimens?.inmobiliaria_referida?.active?.display_name || 'Sin régimen activo')}
                            </div>
                            <div className="admin-row">
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => downloadRegimen({ target: 'inmobiliaria_referida', regimenId: regimens?.inmobiliaria_referida?.active?.id })}
                                    disabled={regimensLoading || !regimens?.inmobiliaria_referida?.active?.id}
                                >
                                    Descargar PDF
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => { setUploadRegimen({ target: 'inmobiliaria_referida' }); setUploadRegimenError(''); setUploadRegimenFile(null); setUploadRegimenName(''); }}
                                    disabled={regimensLoading}
                                >
                                    Subir nuevo régimen
                                </button>
                                <button
                                    className="admin-action"
                                    type="button"
                                    onClick={() => setRegimenHistory({ target: 'inmobiliaria_referida' })}
                                    disabled={regimensLoading || !(regimens?.inmobiliaria_referida?.list || []).length}
                                >
                                    Historial
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="admin-right">
                        <div className="admin-tables">
                            <div className="admin-table-card">
                                <div className="admin-users-head">
                                    <div className="admin-users-title-row">
                                        <h2>Usuarios registrados</h2>
                                        <span className="admin-count">Usuarios: {usuariosFiltrados.length}</span>
                                    </div>

                                    <div className="admin-users-controls">
                                        <div className="admin-controls-left">
                                            <label className="admin-control-label" htmlFor="admin-view-mode">Ver</label>
                                            <select
                                                id="admin-view-mode"
                                                className="admin-control-select"
                                                value={viewMode}
                                                onChange={(e) => setViewMode(e.target.value)}
                                            >
                                                {VIEW_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="admin-controls-right">
                                            <input
                                                className="admin-search"
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                placeholder="Buscar…"
                                                aria-label="Buscar usuarios"
                                            />
                                            <select
                                                className="admin-control-select"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                aria-label="Filtrar por estado"
                                            >
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                {viewMode === 'all' && <th>Tipo</th>}
                                                <th>{viewMode === 'inmobiliarias' ? 'Representante' : 'Nombre'}</th>
                                                <th>Clasificación</th>
                                                <th>Origen</th>
                                                <th>Email</th>
                                                <th>Teléfono</th>
                                                <th>{viewMode === 'inmobiliarias' ? 'Compañía' : viewMode === 'brokers' ? 'Inmobiliaria' : 'Inmobiliaria/Compañía'}</th>
                                                <th>Estado</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usuariosFiltrados.map((u) => (
                                                <tr key={u.id}>
                                                    <td className="cell-phone">{getPublicId(u)}</td>
                                                    {viewMode === 'all' && (
                                                        <td>
                                                            {u.role === 'broker'
                                                                ? 'Broker'
                                                                : (u.role === 'inmobiliaria' ? 'Inmobiliaria' : 'Sub-admin')}
                                                        </td>
                                                    )}
                                                    <td>{getNombreCompleto(u)}</td>
                                                    <td className="cell-phone">
                                                        <span className="admin-badge" style={{ background: 'var(--bg-light)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                                                            {getUserTypeLabel(u)}
                                                        </span>
                                                    </td>
                                                    <td className="cell-phone">
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            {getUserOriginLabel(u)}
                                                        </span>
                                                    </td>
                                                    <td className="cell-email">{u.email || '—'}</td>
                                                    <td className="cell-phone">{u.phone || '—'}</td>
                                                    <td>{getOrgLabel(u)}</td>
                                                    <td>
                                                        {(() => {
                                                            const acc = String(u?.account_status ?? 'active').toLowerCase();
                                                            const isDeactivated = u.is_active === false || acc === 'deactivated';
                                                            const isInactive = !isDeactivated && acc === 'inactive';
                                                            const cls = isDeactivated ? 'danger' : (isInactive ? 'warning' : '');
                                                            const label = isDeactivated ? 'Desactivado' : (isInactive ? 'Inactivo' : 'Activo');
                                                            return <span className={`admin-badge ${cls}`}>{label}</span>;
                                                        })()}
                                                    </td>
                                                    <td className="cell-phone" style={{ textAlign: 'right' }}>
                                                        {(() => {
                                                            const acc = String(u?.account_status ?? 'active').toLowerCase();
                                                            const isDeactivated = u.is_active === false || acc === 'deactivated';
                                                            return (
                                                         <KebabMenu
                                                             disabled={savingUser}
                                                             onEdit={() => { setUserModalError(''); setEditingUser(u); }}
                                                             onDeactivate={() => setDeactivateUser(u)}
                                                             onReactivate={isDeactivated ? () => setReactivateUser(u) : undefined}
                                                            editLabel="Ver / Editar"
                                                         />
                                                             );
                                                         })()}
                                                     </td>
                                                 </tr>
                                            ))}

                                            {!loading && !usuariosFiltrados.length && (
                                                <tr>
                                                    <td colSpan={colSpan}>Sin resultados.</td>
                                                </tr>
                                            )}

                                            {loading && (
                                                <tr>
                                                    <td colSpan={colSpan}>Cargando…</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="admin-table-card">
                                <div className="admin-users-head">
                                    <div className="admin-users-title-row">
                                        <h2>Leads registrados</h2>
                                        <span className="admin-count">Leads: {leadsFiltrados.length}</span>
                                    </div>

                                    <div className="admin-users-controls">
                                        <div className="admin-controls-left">
                                            <label className="admin-control-label" htmlFor="admin-leads-view">Ver</label>
                                            <select
                                                id="admin-leads-view"
                                                className="admin-control-select"
                                                value={leadViewMode}
                                                onChange={(e) => setLeadViewMode(e.target.value)}
                                            >
                                                {LEAD_VIEW_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="admin-controls-right">
                                            <input
                                                className="admin-search"
                                                value={leadSearchText}
                                                onChange={(e) => setLeadSearchText(e.target.value)}
                                                placeholder="Buscar…"
                                                aria-label="Buscar leads"
                                            />
                                            <select
                                                className="admin-control-select"
                                                value={leadStateFilter}
                                                onChange={(e) => setLeadStateFilter(e.target.value)}
                                                aria-label="Filtrar por estado del lead"
                                            >
                                                {LEAD_STATE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {leadsError ? <div className="admin-error">{leadsError}</div> : null}

                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Lead</th>
                                                <th>Tel / Correo</th>
                                                <th>Lote</th>
                                                <th>Esquema</th>
                                                <th>Estado</th>
                                                <th>Registro H.L.</th>
                                                <th>Broker</th>
                                                <th>Inmobiliaria</th>
                                                <th>Tipo / Origen</th>
                                                <th>Régimen</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leadsFiltrados.map((l) => {
                                                const createdBy = usuariosMap[l.created_by_user_id];
                                                const brokerName = createdBy
                                                    ? getNombreCompleto(createdBy)
                                                    : ((l.created_by_role || '').toLowerCase() === 'admin' ? 'Admin' : '—');
                                                const stateRaw = String(l.lead_state || '').toUpperCase();
                                                const state = stateRaw || '—';
                                                const daysLeft = (stateRaw === 'VIGENTE' || stateRaw === 'REUNION') ? remainingDays(l.expires_at) : null;
                                                const expiredByTime = (stateRaw === 'VIGENTE' || stateRaw === 'REUNION') && typeof daysLeft === 'number' && daysLeft <= 0;
                                                const effectiveState = expiredByTime ? 'EXPIRADO' : stateRaw;
                                                const stateLabelBase = effectiveState === 'REUNION'
                                                    ? 'Reunión'
                                                    : (effectiveState === 'VIGENTE'
                                                        ? 'Vigente'
                                                        : (effectiveState === 'EXPIRADO'
                                                            ? 'Expirado'
                                                            : (effectiveState === 'CERRADO'
                                                                ? 'Cerrado'
                                                                : (effectiveState || state))));
                                                const stateLabel = ((effectiveState === 'VIGENTE' || effectiveState === 'REUNION') && typeof daysLeft === 'number')
                                                    ? `${stateLabelBase} (${daysLeft} ${daysLeft === 1 ? 'día' : 'días'})`
                                                    : stateLabelBase;
                                                const stateClass = effectiveState === 'EXPIRADO'
                                                    ? 'lead-expirado'
                                                    : (effectiveState === 'CERRADO'
                                                        ? 'lead-cerrado'
                                                        : 'lead-warning');

                                                return (
                                                    <tr key={l.id}>
                                                        <td className="cell-phone">
                                                            <div className="cell-phone">{formatDateParts(l.created_at).date}</div>
                                                            <div className="cell-email">{formatDateParts(l.created_at).time}</div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 800 }}>{l.lead_first_name || '—'}</div>
                                                            <div style={{ fontWeight: 800 }}>{l.lead_last_name || ''}</div>
                                                        </td>
                                                        <td>
                                                            <div className="cell-phone">{l.lead_phone || '—'}</div>
                                                            <div className="cell-email">{l.lead_email || '—'}</div>
                                                        </td>
                                                        <td className="cell-phone">
                                                            <div className="cell-phone">{l.lot_number ? `LOTE ${l.lot_number}` : '—'}</div>
                                                            <div className="cell-email">{l.lot_type ? String(l.lot_type) : ''}</div>
                                                        </td>
                                                        <td className="cell-phone">{l.esquema ? String(l.esquema).charAt(0).toUpperCase() + String(l.esquema).slice(1) : '—'}</td>
                                                        <td>
                                                            <span className={`admin-badge ${stateClass}`}>{stateLabel}</span>
                                                        </td>
                                                        <td className="cell-phone">
                                                            <span className={`admin-badge ${l.hl_status === 'CREATED' ? 'success' : (l.hl_status === 'EXISTS' ? 'warning' : 'danger')}`}>
                                                                {l.hl_status || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="cell-email">{brokerName}</td>
                                                        <td className="cell-email">{l.inmobiliaria_name || '—'}</td>
                                                        <td className="cell-phone">
                                                            <span className="admin-badge" style={{ background: 'var(--bg-light)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                                                                {createdBy ? getUserTypeLabel(createdBy) : (String(l.created_by_role || '').toLowerCase() === 'admin' ? 'Admin' : '—')}
                                                            </span>
                                                        </td>
                                                        <td className="cell-phone" style={{ textAlign: 'right' }}>{l.regimen || '—'}</td>
                                                        <td className="cell-phone" style={{ textAlign: 'right' }}>
                                                            <KebabMenu
                                                                disabled={savingLead}
                                                                onEdit={() => { setLeadModalError(''); setEditingLead(l); }}
                                                                onDeactivate={() => { setLeadModalError(''); setDeleteLead(l); }}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {!loadingLeads && !leadsFiltrados.length && (
                                                <tr>
                                                    <td colSpan={10}>Sin resultados.</td>
                                                </tr>
                                            )}

                                            {loadingLeads && (
                                                <tr>
                                                    <td colSpan={10}>Cargando…</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {editingUser ? (
                <UserEditModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={saveUserEdits}
                    onForceRegimeResubmit={(u) => { setForceRegimeResubmitError(''); setForceRegimeResubmitUser(u); }}
                    onEnablePasswordReset={(u) => { setResetPasswordError(''); setResetPasswordUser(u); }}
                    saving={savingUser}
                    errorText={userModalError}
                />
            ) : null}

            {deactivateUser ? (
                <ConfirmModal
                    title="Desactivar usuario"
                    text="¿Seguro? Este usuario ya no podrá iniciar sesión."
                    confirmLabel={savingUser ? 'Procesando…' : 'Desactivar'}
                    onCancel={() => setDeactivateUser(null)}
                    onConfirm={deactivateUserNow}
                    disabled={savingUser}
                />
            ) : null}

            {reactivateUser ? (
                <ConfirmModal
                    title="Reactivar usuario"
                    text="¿Seguro? Este usuario volverá a poder iniciar sesión."
                    confirmLabel={savingUser ? 'Procesando…' : 'Reactivar'}
                    onCancel={() => setReactivateUser(null)}
                    onConfirm={reactivateUserNow}
                    disabled={savingUser}
                    tone="primary"
                />
            ) : null}

            {forceRegimeResubmitUser ? (
                <ConfirmModal
                    title="¿Habilitar reenvío de régimen?"
                    text="Esto desactivará al usuario y bloqueará el registro de leads hasta que suba un nuevo régimen firmado."
                    confirmLabel={savingUser ? 'Procesando…' : 'Confirmar'}
                    onCancel={() => { setForceRegimeResubmitUser(null); setForceRegimeResubmitError(''); }}
                    onConfirm={forceRegimeResubmitNow}
                    disabled={savingUser}
                    tone="warn"
                    errorText={forceRegimeResubmitError}
                />
            ) : null}

            {resetPasswordUser ? (
                <ConfirmModal
                    title="Habilitar restablecimiento de contraseña"
                    text="¿Seguro? La contraseña actual quedará inválida y el usuario tendrá que crear una nueva desde el acceso de restablecimiento."
                    confirmLabel={savingUser ? 'Procesando…' : 'Habilitar restablecimiento'}
                    onCancel={() => { setResetPasswordUser(null); setResetPasswordError(''); }}
                    onConfirm={enablePasswordResetNow}
                    disabled={savingUser}
                    tone="warn"
                    errorText={resetPasswordError}
                />
            ) : null}

            {uploadRegimen ? (
                <RegimenUploadModal
                    target={uploadRegimen.target}
                    file={uploadRegimenFile}
                    name={uploadRegimenName}
                    errorText={uploadRegimenError}
                    uploading={uploadingRegimen}
                    onClose={() => { setUploadRegimen(null); setUploadRegimenError(''); setUploadRegimenFile(null); setUploadRegimenName(''); }}
                    onPickFile={(f) => { setUploadRegimenFile(f); setUploadRegimenError(''); }}
                    onChangeName={(v) => setUploadRegimenName(v)}
                    onConfirm={() => { setUploadRegimen(null); setConfirmUploadRegimen({ target: uploadRegimen.target }); }}
                />
            ) : null}

            {confirmUploadRegimen ? (
                <ConfirmModal
                    title="Confirmar activación"
                    text="¿Seguro? Al activar este régimen, los usuarios objetivo quedarán INACTIVOS hasta que envíen el PDF firmado."
                    errorText={uploadRegimenError}
                    confirmLabel={uploadingRegimen ? 'Procesando…' : 'Confirmar y activar'}
                    onCancel={() => setConfirmUploadRegimen(null)}
                    onConfirm={() => runUploadRegimen(confirmUploadRegimen)}
                    disabled={uploadingRegimen}
                    tone="danger"
                />
            ) : null}

            {regimenHistory ? (
                <RegimenHistoryModal
                    title={
                        regimenHistory.target === 'broker' ? 'Historial de regímenes — Brokers' :
                        regimenHistory.target === 'inmobiliaria' ? 'Historial de regímenes — Inmobiliarias' :
                        regimenHistory.target === 'broker_referido' ? 'Historial de regímenes — Brokers Referidos' :
                        'Historial de regímenes — Inmobiliarias Referidas'
                    }
                    items={(regimens?.[regimenHistory.target]?.list || [])
                        .slice()
                        .sort((a, b) => (Number(b?.version ?? 0) - Number(a?.version ?? 0)))}
                    onDownload={(regimenId) => downloadRegimen({ target: regimenHistory.target, regimenId })}
                    onClose={() => setRegimenHistory(null)}
                />
            ) : null}

            {editingLead ? (
                <LeadEditModal
                    lead={editingLead}
                    onClose={() => setEditingLead(null)}
                    onSave={saveLeadEdits}
                    saving={savingLead}
                    errorText={leadModalError}
                />
            ) : null}

            {deleteLead ? (
                <ConfirmModal
                    title="Eliminar lead"
                    text="¿Seguro? Este lead dejará de aparecer en los paneles."
                    confirmLabel={savingLead ? 'Procesando…' : 'Eliminar'}
                    onCancel={() => setDeleteLead(null)}
                    onConfirm={deleteLeadNow}
                    disabled={savingLead}
                    tone="danger"
                />
            ) : null}
        </div>
    );
}
