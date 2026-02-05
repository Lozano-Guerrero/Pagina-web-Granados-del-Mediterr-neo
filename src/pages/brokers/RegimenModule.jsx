import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Brokers.css';
import { supabase } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';
import { useAuth } from '../../contexts/AuthContext.jsx';

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
                <div className="brokers-modal-title-row">
                    <h3 className="brokers-modal-title">{title}</h3>
                    <button className="brokers-modal-x" type="button" onClick={onCancel} disabled={disabled} aria-label="Cerrar">×</button>
                </div>
                <p className="brokers-modal-text">{text}</p>
                <div className="brokers-modal-actions">
                    <button type="button" className="brokers-inline-btn" onClick={onCancel} disabled={disabled}>
                        Cancelar
                    </button>
                    <button type="button" className="brokers-inline-btn brokers-inline-btn-blue" onClick={onConfirm} disabled={disabled}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RegimenModule({ variant }) {
    // variant: 'broker' | 'inmobiliaria'
    const { profile } = useAuth();
    const [ctx, setCtx] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);
    const [confirm, setConfirm] = useState(false);

    const lastMsgRef = useRef(null);
    useEffect(() => {
        if (!message) return undefined;
        lastMsgRef.current = message;
        const t = setTimeout(() => setMessage(null), 5000);
        return () => clearTimeout(t);
    }, [message]);

    // Regla crítica: brokers hijos no ven módulo de régimen (aunque no haya ctx aún).
    const isLikelyChildBroker = variant === 'broker' && String(profile?.role || '').toLowerCase() === 'broker' && Boolean(profile?.org_id);

    const isChildBroker = Boolean(ctx?.isChildBroker) || isLikelyChildBroker;
    const canSeeModule = Boolean(ctx?.canSeeModule) || (variant === 'inmobiliaria' || (variant === 'broker' && !isLikelyChildBroker));
    const canRegisterLeads = ctx?.ok ? Boolean(ctx?.canRegisterLeads) : true;

    const statusLabel = useMemo(() => {
        const accountStatus = String(ctx?.accountStatus ?? '').toLowerCase();
        const isActive = profile?.is_active !== false;
        if (!isActive || accountStatus === 'deactivated') return { tone: 'danger', text: 'DESACTIVADO' };
        if (accountStatus === 'inactive' || !canRegisterLeads) return { tone: 'warn', text: 'INACTIVO' };
        return { tone: 'ok', text: 'ACTIVO' };
    }, [canRegisterLeads, ctx?.accountStatus, profile?.is_active]);

    useEffect(() => {
        if (!supabase || !profile?.id) return;
        let cancelled = false;
        setLoading(true);
        setError('');
        supabase
            .rpc('get_regimen_context')
            .then(({ data, error: rpcErr }) => {
                if (cancelled) return;
                if (rpcErr) {
                    setError(sanitizeBackendMessage(rpcErr.message));
                    setCtx(null);
                } else {
                    setCtx(data ?? null);
                }
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [profile?.id]);

    if (!canSeeModule) return null;
    if (variant === 'broker' && isChildBroker) return null;

    const downloadMaster = async () => {
        setError('');
        try {
            const target = variant === 'inmobiliaria' ? 'inmobiliaria' : 'broker';
            const data = await edgePost('regimen-download-url', { kind: 'master', target });
            const url = data?.url;
            if (!url) throw new Error('No se pudo generar URL de descarga.');
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
            const msg = sanitizeBackendMessage(e?.message ?? e ?? 'No se pudo descargar.');
            setError(msg);
        }
    };

    const applyFile = (nextFile) => {
        if (!nextFile) {
            setFile(null);
            return;
        }

        if (!String(nextFile?.name ?? '').toLowerCase().endsWith('.pdf')) {
            setFile(null);
            setError('Solo se aceptan PDFs.');
            return;
        }

        setError('');
        setFile(nextFile);
    };

    const openFilePicker = () => {
        if (sending) return;
        fileInputRef.current?.click?.();
    };

    const sendSigned = async () => {
        setConfirm(false);
        setError('');
        setMessage(null);
        if (!file) {
            setError('Selecciona un PDF firmado.');
            return;
        }
        if (!String(file?.name ?? '').toLowerCase().endsWith('.pdf')) {
            setError('Solo se aceptan PDFs.');
            return;
        }

        setSending(true);
        try {
            const start = await edgePost('regimen-user-start-upload', { fileName: file.name });
            const upload = start?.upload;
            const regimen = start?.regimen;
            if (!upload?.bucket || !upload?.path || !upload?.token) {
                throw new Error('No se pudo preparar la subida del archivo.');
            }

            const { error: upErr } = await supabase.storage
                .from(upload.bucket)
                .uploadToSignedUrl(upload.path, upload.token, file);
            if (upErr) throw upErr;

            await edgePost('regimen-user-submit', {
                regimenId: regimen?.id,
                fileName: file.name,
                storagePath: upload.path
            });

            setFile(null);
            setMessage({ tone: 'success', text: 'Régimen firmado enviado correctamente.' });

            // Refrescar contexto para desbloquear registro de leads en UI.
            const { data: ctxData } = await supabase.rpc('get_regimen_context');
            setCtx(ctxData ?? null);
        } catch (e) {
            const msg = sanitizeBackendMessage(e?.message ?? e ?? 'No se pudo enviar el régimen.');
            setError(msg);
        } finally {
            setSending(false);
        }
    };

    const title = variant === 'inmobiliaria' ? 'Régimen (Inmobiliaria)' : 'Régimen (Brokers)';
    const regimenName = ctx?.regimenName || 'Sin régimen activo';
    const hasActiveRegimen = Boolean(ctx?.activeRegimenId);

    return (
        <div className="brokers-subcard regimen-card">
            <div className="regimen-head">
                <div>
                    <div className="regimen-title">{title}</div>
                    <div className="regimen-subtitle">Estado: <span className={`regimen-state ${statusLabel.tone}`}>{statusLabel.text}</span></div>
                </div>
                {loading ? <span className="brokers-cell-muted">Cargando…</span> : null}
            </div>

            {error ? <div className="brokers-error">{error}</div> : null}
            {message ? <div className="brokers-success">{message.text}</div> : null}

                <div className="regimen-block">
                <div className="regimen-block-title">
                    {statusLabel.text === 'INACTIVO' ? 'Descarga el nuevo régimen' : 'Régimen actual'}
                </div>
                <div className="regimen-file">{regimenName}</div>
                <button
                    type="button"
                    className="brokers-inline-btn brokers-inline-btn-blue"
                    onClick={downloadMaster}
                    disabled={sending || loading || !hasActiveRegimen}
                >
                    Descargar PDF
                </button>
            </div>

            <div className={`regimen-block ${statusLabel.text === 'INACTIVO' ? '' : 'disabled'}`}>
                <div className="regimen-block-title">Sube aquí tu régimen firmado</div>
                {statusLabel.text === 'INACTIVO' && hasActiveRegimen ? (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
                            disabled={sending}
                            style={{ display: 'none' }}
                        />
                        <div
                            className={`brokers-dropzone ${sending ? 'disabled' : ''}`}
                            role="button"
                            tabIndex={sending ? -1 : 0}
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
                            aria-label="Seleccionar PDF firmado"
                        >
                            <span className="brokers-dropzone-icon" aria-hidden="true">
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
                                <div className="brokers-dropzone-title">Arrastra tu PDF aquí</div>
                                <div className="brokers-dropzone-hint">o haz clic para seleccionar</div>
                            </div>
                        </div>
                        {file ? <div className="brokers-dropzone-file">{file.name}</div> : null}
                        <button
                            type="button"
                            className="brokers-inline-btn brokers-inline-btn-green"
                            onClick={() => setConfirm(true)}
                            disabled={sending || !file}
                        >
                            Enviar régimen
                        </button>
                    </>
                ) : (
                    <div className="brokers-cell-muted">
                        {hasActiveRegimen ? 'Ya has enviado el régimen firmado.' : 'Aún no hay un régimen activo para firmar.'}
                    </div>
                )}
            </div>

            {!canRegisterLeads && ctx?.blockReason ? (
                <div className="brokers-warning">{ctx.blockReason}</div>
            ) : null}

            {confirm ? (
                <ConfirmModal
                    title="Confirmar envío"
                    text="¿Estás seguro de que estás enviando el archivo correcto? Esta acción actualizará tu estado."
                    confirmLabel="Confirmar y enviar"
                    onCancel={() => setConfirm(false)}
                    onConfirm={sendSigned}
                    disabled={sending}
                />
            ) : null}
        </div>
    );
}
