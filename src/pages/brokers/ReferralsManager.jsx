import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';

function remainingDays(expiresAt) {
    if (!expiresAt) return null;
    const ts = new Date(expiresAt).getTime();
    if (!Number.isFinite(ts)) return null;
    const diff = ts - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

function sanitizeBackendMessage(value) {
    if (!value) return value;
    return String(value)
        .replace(/HighLevel/gi, 'el sistema')
        .replace(/LeadConnector/gi, 'el sistema')
        .replace(/leadconnectorhq/gi, 'el sistema');
}

function InvitationModal({ user, onClose, onCopy, copySuccess }) {
    if (!user) return null;
    const msg = `¡Hola ${user.first_name}!\n\nTe he agregado como referido y te comparto tu acceso al portal de Granados del Mediterráneo.\n\n🔗 Accesa aquí: http://localhost:5173/brokers/inmobiliaria\n\n📧 Tu correo de acceso: ${user.email}\n\n*Nota:* Al entrar por primera vez, deberás crear tu contraseña para activar tu cuenta.`;
    
    return createPortal(
        <div className="brokers-modal-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="brokers-modal"
            >
                <div className="brokers-modal-title-row">
                    <h3 className="brokers-modal-title">Invitación para {user.first_name}</h3>
                    <button type="button" className="brokers-modal-x" onClick={onClose}>×</button>
                </div>
                <p className="brokers-v2-text-muted" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                    Copia el siguiente mensaje y pégalo en el chat de tu referido. El formato está optimizado para WhatsApp.
                </p>
                <div className="invitation-box" style={{ whiteSpace: 'pre-line' }}>
                    {msg}
                </div>
                <div className="brokers-modal-actions" style={{ marginTop: '20px' }}>
                    <button type="button" className="brokers-inline-btn" onClick={onClose}>
                        Cerrar
                    </button>
                    <button 
                        type="button" 
                        className="brokers-inline-btn brokers-inline-btn-green"
                        onClick={() => onCopy(user)}
                    >
                        {copySuccess ? '¡Copiado!' : 'Copiar Mensaje'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

export default function ReferralsManager({ profile }) {
    const isBroker = profile?.role?.toLowerCase() === 'broker';
    const canReferInmobiliarias = isBroker;

    const [activeTab, setActiveTab] = useState('brokers'); // 'brokers', 'inmobiliarias', 'leads'

    const [brokers, setBrokers] = useState([]);
    const [inmobiliarias, setInmobiliarias] = useState([]);
    const [leads, setLeads] = useState([]);

    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(null);

    const [isCreating, setIsCreating] = useState(false);
    const [creatingType, setCreatingType] = useState(null); // 'broker' or 'inmobiliaria'

    const [createForm, setCreateForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        org_name: '' // only used for inmobiliarias
    });
    const [createError, setCreateError] = useState('');
    const [saving, setSaving] = useState(false);

    // New: Invitation Modal state
    const [invitationUser, setInvitationUser] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(null), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        if (!copySuccess) return undefined;
        const timer = setTimeout(() => setCopySuccess(false), 2000);
        return () => clearTimeout(timer);
    }, [copySuccess]);

    const fetchData = async () => {
        if (!supabase || !profile?.id) return;
        setLoadingRecords(true);
        setError('');

        try {
            // Fetch users referred by this user
            const { data: referredUsers, error: usersErr } = await supabase
                .from('profiles')
                .select('id, public_id, first_name, last_name, email, phone, role, organizations(company_name), created_at, account_status')
                .eq('referred_by', profile.id)
                .order('created_at', { ascending: false });

            if (usersErr) throw usersErr;

            const fetchedBrokers = referredUsers.filter(u => u.role === 'broker');
            const fetchedInmos = referredUsers.filter(u => u.role === 'inmobiliaria');

            setBrokers(fetchedBrokers);
            setInmobiliarias(fetchedInmos);

            // Fetch leads created by referred users
            const userIds = referredUsers.map(u => u.id);
            if (userIds.length > 0) {
                const { data: referredLeads, error: leadsErr } = await supabase
                    .from('leads')
                    .select('id, lead_first_name, lead_last_name, lead_state, expires_at, created_by_user_id, created_at, hl_status')
                    .eq('hl_status', 'CREATED')
                    .or(`created_by_user_id.in.(${userIds.join(',')}),inmobiliaria_id.in.(${userIds.join(',')})`)
                    .order('created_at', { ascending: false });

                if (leadsErr) throw leadsErr;
                setLeads(referredLeads || []);
            } else {
                setLeads([]);
            }
        } catch (err) {
            setError('Error al cargar datos de referidos.');
            console.error(err);
        } finally {
            setLoadingRecords(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setCreateError('');

        const payload = {
            role: creatingType,
            first_name: createForm.first_name.trim(),
            last_name: createForm.last_name.trim(),
            email: createForm.email.trim(),
            phone: createForm.phone.trim(),
            company_name: creatingType === 'inmobiliaria' ? createForm.org_name.trim() : null
        };

        try {
            const data = await edgePost('create-referred-user', payload);
            if (!data?.ok) throw new Error(data?.error || `No se pudo registrar ${creatingType}`);

            setNotice({
                tone: 'success',
                text: `¡Bienvenido(a)! ${creatingType === 'broker' ? 'Broker' : 'Inmobiliaria'} registrado(a) exitosamente.`
            });
            setIsCreating(false);
            const newUser = { 
                first_name: createForm.first_name.trim(), 
                email: createForm.email.trim() 
            };
            setCreateForm({ first_name: '', last_name: '', email: '', phone: '', org_name: '' });
            await fetchData();
            
            // Automatically show invitation modal for the new user
            setInvitationUser(newUser);
        } catch (err) {
            setCreateError(sanitizeBackendMessage(err?.message || 'Error al guardar el usuario.'));
        } finally {
            setSaving(false);
        }
    };

    const usersMap = useMemo(() => {
        const map = new Map();
        brokers.forEach(b => map.set(b.id, b));
        inmobiliarias.forEach(i => map.set(i.id, i));
        return map;
    }, [brokers, inmobiliarias]);

    const handleCopyInvitation = (user) => {
        const msg = `¡Hola ${user.first_name}!\n\nTe he agregado como referido y te comparto tu acceso al portal de Granados del Mediterráneo.\n\n🔗 Accesa aquí: https://www.granadosdelmediterraneo.com/brokers\n\n📧 Tu correo de acceso: ${user.email}\n\n*Nota:* Al entrar por primera vez, deberás crear tu contraseña para activar tu cuenta.`;
        navigator.clipboard.writeText(msg);
        setCopySuccess(true);
    };

    const SkeletonTable = () => (
        <div style={{ padding: '10px' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-shimmer skeleton-row" />
            ))}
        </div>
    );

    const EmptyState = ({ type }) => (
        <div className="empty-state-container">
            <div className="empty-state-icon">👤</div>
            <h3 className="empty-state-title">No hay {type} registrados</h3>
            <p className="empty-state-text">
                Comienza a expandir tu red invitando a {type === 'leads' ? 'posibles clientes' : type} hoy mismo.
            </p>
        </div>
    );

    return (
        <div className="brokers-v2-card" style={{ marginTop: '20px' }}>
            {error ? <div className="brokers-error" style={{ marginBottom: '16px' }}>{error}</div> : null}
            {notice ? <div className={`brokers-${notice.tone === 'warning' ? 'warning' : 'success'}`} style={{ marginBottom: '16px' }}>{notice.text}</div> : null}

            <div className="brokers-header-v2">
                <div>
                    <h2 className="brokers-title-v2">Mis Referidos</h2>
                    <p className="brokers-v2-text-muted">Gestiona tu red de brokers y agencias inmobiliarias.</p>
                </div>
                <div className="brokers-header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className={`btn-v2-primary ${isCreating && creatingType === 'broker' ? 'active' : ''}`}
                        onClick={() => {
                            if (isCreating && creatingType === 'broker') {
                                setIsCreating(false);
                            } else {
                                setCreatingType('broker');
                                setIsCreating(true);
                            }
                        }}
                    >
                        + Registrar Broker
                    </button>
                    <button 
                        className={`btn-v2-primary ${isCreating && creatingType === 'inmobiliaria' ? 'active' : ''}`}
                        onClick={() => {
                            if (isCreating && creatingType === 'inmobiliaria') {
                                setIsCreating(false);
                            } else {
                                setCreatingType('inmobiliaria');
                                setIsCreating(true);
                            }
                        }}
                    >
                        + Registrar Inmobiliaria
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="collapsible-registration-panel"
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="registration-panel-content">
                            <div className="brokers-modal-title-row">
                                <h3 className="brokers-modal-title">Nuevo Registro: {creatingType === 'broker' ? 'Broker' : 'Inmobiliaria'}</h3>
                                <button type="button" className="brokers-modal-x" onClick={() => setIsCreating(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreate} className="brokers-form">
                                {createError && <div className="brokers-form-error">{createError}</div>}
                                
                                {creatingType === 'inmobiliaria' && (
                                    <div className="brokers-field">
                                        <label>Nombre de la Agencia</label>
                                        <input value={createForm.org_name} onChange={(e) => setCreateForm(v => ({ ...v, org_name: e.target.value }))} required />
                                    </div>
                                )}

                                <div className="brokers-leads-grid">
                                    <div className="brokers-field">
                                        <label>Nombre(s)</label>
                                        <input value={createForm.first_name} onChange={(e) => setCreateForm(v => ({ ...v, first_name: e.target.value }))} required />
                                    </div>
                                    <div className="brokers-field">
                                        <label>Apellido(s)</label>
                                        <input value={createForm.last_name} onChange={(e) => setCreateForm(v => ({ ...v, last_name: e.target.value }))} required />
                                    </div>
                                </div>
                                <div className="brokers-leads-grid">
                                    <div className="brokers-field">
                                        <label>Correo electrónico</label>
                                        <input type="email" value={createForm.email} onChange={(e) => setCreateForm(v => ({ ...v, email: e.target.value }))} required />
                                    </div>
                                    <div className="brokers-field">
                                        <label>Teléfono celular</label>
                                        <input type="tel" value={createForm.phone} onChange={(e) => setCreateForm(v => ({ ...v, phone: e.target.value }))} required />
                                    </div>
                                </div>

                                <div className="brokers-legal-text" style={{ marginTop: '0', marginBottom: '16px', color: '#d97706', background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.85rem' }}>
                                    <strong>Nota importante:</strong> Mostraremos instrucciones de acceso tras el registro.
                                </div>

                                <div className="brokers-modal-actions" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                                    <button type="button" className="brokers-inline-btn" onClick={() => setIsCreating(false)}>Cancelar</button>
                                    <button type="submit" className="btn-v2-primary" style={{ padding: '0 32px', height: '44px' }} disabled={saving}>
                                        {saving ? 'Registrando...' : 'Confirmar Registro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', marginBottom: '16px', marginTop: '24px' }}>
                {['brokers', 'inmobiliarias', 'leads'].map((tab) => (
                    (tab !== 'inmobiliarias' || canReferInmobiliarias) && (
                        <button
                            key={tab}
                            className={`nav-tab-v2 ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                            style={{ 
                                padding: '8px 16px', 
                                background: 'none', 
                                border: 'none', 
                                borderBottom: activeTab === tab ? '2px solid #0f172a' : '2px solid transparent', 
                                fontWeight: activeTab === tab ? '600' : '400', 
                                cursor: 'pointer', 
                                color: activeTab === tab ? '#0f172a' : '#6b7280',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'brokers' ? brokers.length : tab === 'inmobiliarias' ? inmobiliarias.length : leads.length})
                        </button>
                    )
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                >
                    {loadingRecords ? (
                        <SkeletonTable />
                    ) : (
                        <div className="table-v2-container">
                            {(activeTab === 'brokers' || activeTab === 'inmobiliarias') ? (
                                <>
                                    <div className="table-v2-header table-v2-grid-layout" style={{ gridTemplateColumns: 'minmax(140px, 1fr) minmax(120px, 1fr) 100px 100px 120px' }}>
                                        <span>Nombre</span>
                                        <span>Contacto</span>
                                        <span>Estado</span>
                                        <span>Fecha</span>
                                        <span style={{ textAlign: 'right' }}>Acción</span>
                                    </div>
                                    <div className="table-v2-body">
                                        {(activeTab === 'brokers' ? brokers : inmobiliarias).map((u) => (
                                            <div key={u.id} className="brokers-table-row-v2 table-v2-grid-layout" style={{ gridTemplateColumns: 'minmax(140px, 1fr) minmax(120px, 1fr) 100px 100px 120px' }}>
                                                <div className="t-v2-cell-truncate">
                                                    <div style={{ fontWeight: '700' }}>{u.first_name} {u.last_name}</div>
                                                    {u.role === 'inmobiliaria' && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.organizations?.company_name}</div>}
                                                </div>
                                                <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                    <div>{u.phone}</div>
                                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{u.email}</div>
                                                </div>
                                                <div>
                                                    <span className={`brokers-badge ${u.account_status === 'active' ? 'brokers-badge-created' : 'brokers-badge-warning'}`}>
                                                        {u.account_status === 'active' ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    {formatDateParts(u.created_at).date}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <button 
                                                        className="brokers-inline-btn" 
                                                        style={{ fontSize: '0.75rem', height: '28px' }}
                                                        onClick={() => setInvitationUser(u)}
                                                    >
                                                        Ver Invitación
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(activeTab === 'brokers' ? brokers : inmobiliarias).length === 0 && (
                                            <EmptyState type={activeTab} />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="table-v2-header table-v2-grid-layout" style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(140px, 1.2fr) minmax(140px, 1.2fr) 100px' }}>
                                        <span>Fecha</span>
                                        <span>Lead</span>
                                        <span>Referido / Creador</span>
                                        <span>Vigencia / Embudo</span>
                                    </div>
                                    <div className="table-v2-body">
                                        {leads.map((l) => {
                                            const creator = usersMap.get(l.created_by_user_id);
                                            const creatorName = creator ? `${creator.first_name} ${creator.last_name}` : 'Desconocido';
                                            
                                            const st = String(l?.lead_state || 'VIGENTE').toUpperCase();
                                            const days = remainingDays(l?.expires_at);
                                            const hasVigencia = typeof days === 'number';
                                            const isExpired = hasVigencia && days <= 0;
                                            const effectiveState = (st !== 'CERRADO' && isExpired) ? 'EXPIRADO' : st;
                                            
                                            const badgeClass = effectiveState === 'CERRADO' ? 'brokers-badge-closed' : (effectiveState === 'EXPIRADO' ? 'brokers-badge-expired' : 'brokers-badge-warning');
                                            const badgeText = effectiveState === 'CERRADO' ? 'Cerrado' : (effectiveState === 'EXPIRADO' ? 'Expirado' : (effectiveState === 'REUNION' ? `Reunión (${days}d)` : `Vigente (${days}d)`));
                                            
                                            return (
                                                <div key={l.id} className="brokers-table-row-v2 table-v2-grid-layout" style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(140px, 1.2fr) minmax(140px, 1.2fr) 100px' }}>
                                                    <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                        <div>{formatDateParts(l.created_at).date}</div>
                                                        <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{formatDateParts(l.created_at).time}</div>
                                                    </div>
                                                    <div className="t-v2-cell-truncate" style={{ fontWeight: '700' }}>
                                                        {l.lead_first_name} {l.lead_last_name}
                                                    </div>
                                                    <div className="t-v2-cell-truncate" style={{ fontSize: '0.85rem' }}>
                                                        {creatorName}
                                                    </div>
                                                    <div>
                                                        <span className={`brokers-badge ${badgeClass}`}>{badgeText}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {leads.length === 0 && (
                                            <EmptyState type="leads" />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>



            {invitationUser && (
                <InvitationModal 
                    user={invitationUser} 
                    onClose={() => setInvitationUser(null)} 
                    onCopy={handleCopyInvitation}
                    copySuccess={copySuccess}
                />
            )}
            {copySuccess && createPortal(
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="copy-feedback-toast"
                >
                    Mensaje copiado al portapapeles
                </motion.div>,
                document.body
            )}
        </div>
    );
}
