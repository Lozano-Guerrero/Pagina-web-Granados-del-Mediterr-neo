import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    Edit3,
    Trash2,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Mail,
    Phone,
    Database
} from 'lucide-react';
import './Brokers.css';
import { supabase } from '../../lib/supabaseClient';
import { edgePost } from '../../lib/edgeFetch';
import { useAuth } from '../../contexts/AuthContext.jsx';

function formatDate(value) {
    try {
        return new Date(value).toLocaleDateString('es-MX');
    } catch {
        return value ?? '—';
    }
}

export default function InmoBrokersPage() {
    const { profile } = useAuth();
    const [brokers, setBrokers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'inactive', 'all'
    const [isCreating, setIsCreating] = useState(false);
    const [editingBroker, setEditingBroker] = useState(null);
    const [acting, setActing] = useState(false);
    const [notice, setNotice] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBrokers();
    }, [profile?.org_id]);

    const fetchBrokers = async () => {
        if (!supabase || !profile?.org_id) return;
        setLoading(true);
        try {
            const { data, error: qErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'broker')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false });
            if (qErr) throw qErr;
            setBrokers(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredBrokers = useMemo(() => {
        let list = brokers;
        if (statusFilter === 'active') list = list.filter(b => b.is_active !== false);
        else if (statusFilter === 'inactive') list = list.filter(b => b.is_active === false);

        if (searchText) {
            const q = searchText.toLowerCase();
            list = list.filter(b =>
                `${b.first_name} ${b.last_name}`.toLowerCase().includes(q) ||
                b.email?.toLowerCase().includes(q) ||
                b.public_id?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [brokers, searchText, statusFilter]);

    const handleDeactivate = async (broker) => {
        if (!window.confirm(`¿Estás seguro de desactivar a ${broker.first_name}? No podrá acceder al panel.`)) return;
        setActing(true);
        try {
            await edgePost('manage-user', { action: 'deactivate', userId: broker.id });
            setNotice({ tone: 'success', text: 'Broker desactivado correctamente.' });
            fetchBrokers();
        } catch (err) {
            setError(err.message);
        } finally {
            setActing(false);
        }
    };

    const handleCreateBroker = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData);

        setActing(true);
        try {
            await edgePost('inmo-create-broker', {
                ...payload,
                org_id: profile.org_id
            });
            setNotice({ tone: 'success', text: 'Broker creado exitosamente.' });
            setIsCreating(false);
            fetchBrokers();
        } catch (err) {
            setError(err.message);
        } finally {
            setActing(false);
        }
    };

    return (
        <div className="premium-management-container">
            <header className="management-header-lux">
                <div className="header-info">
                    <h1 className="management-title">Gestión de Equipo</h1>
                    <p className="management-subtitle">Administra los accesos y perfiles de tus brokers asociados.</p>
                </div>
                <button className="premium-btn primary" onClick={() => setIsCreating(true)}>
                    <UserPlus size={20} /> Nuevo Broker
                </button>
            </header>

            <section className="management-filters-section">
                <div className="search-bar-lux">
                    <Search size={18} />
                    <input
                        placeholder="Buscar por nombre, email o ID..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
                <select className="filter-select-lux" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="active">Solo Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="all">Ver Todos</option>
                </select>
            </section>

            <div className="management-content-area">
                <div className="list-table-lux">
                    <div className="table-header-row">
                        <div>Broker</div>
                        <div>ID Public</div>
                        <div>Contacto</div>
                        <div>Registrado</div>
                        <div>Acciones</div>
                    </div>
                    {filteredBrokers.map(b => (
                        <div key={b.id} className="table-data-row">
                            <div className="col-user">
                                <div className={`user-avatar-mini ${b.is_active === false ? 'inactive' : 'active'}`}>
                                    {b.first_name.charAt(0)}
                                </div>
                                <div className="user-text">
                                    <span className="user-name">{b.first_name} {b.last_name}</span>
                                    <span className="user-role-label">{b.is_active === false ? 'Inactivo' : 'Activo'}</span>
                                </div>
                            </div>
                            <div className="col-id">
                                <span className="id-badge">{b.public_id || '---'}</span>
                            </div>
                            <div className="col-contact">
                                <div className="contact-item"><Mail size={12} /> {b.email}</div>
                                <div className="contact-item"><Phone size={12} /> {b.phone || 'S/T'}</div>
                            </div>
                            <div className="col-date">
                                <span>{formatDate(b.created_at)}</span>
                            </div>
                            <div className="col-actions">
                                <button className="icon-btn-lux" onClick={() => setEditingBroker(b)} title="Editar">
                                    <Edit3 size={16} />
                                </button>
                                {b.is_active !== false && (
                                    <button className="icon-btn-lux danger" onClick={() => handleDeactivate(b)} title="Desactivar">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredBrokers.length === 0 && (
                        <div className="empty-state-list">No se encontraron brokers.</div>
                    )}
                </div>
            </div>

            {/* Modal para Crear Broker */}
            <AnimatePresence>
                {isCreating && (
                    <div className="brokers-modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="brokers-modal">
                            <div className="brokers-modal-title-row">
                                <h3>Registrar Nuevo Broker</h3>
                                <button className="brokers-modal-x" onClick={() => setIsCreating(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreateBroker} className="brokers-form">
                                <div className="form-grid-2">
                                    <div className="brokers-field">
                                        <label>Nombre</label>
                                        <input name="first_name" required placeholder="Ej: Roberto" />
                                    </div>
                                    <div className="brokers-field">
                                        <label>Apellido</label>
                                        <input name="last_name" required placeholder="Ej: Mendoza" />
                                    </div>
                                    <div className="brokers-field">
                                        <label>Email</label>
                                        <input name="email" type="email" required placeholder="roberto@mail.com" />
                                    </div>
                                    <div className="brokers-field">
                                        <label>Teléfono</label>
                                        <input name="phone" required placeholder="10 dígitos" />
                                    </div>
                                    <div className="brokers-field full-width">
                                        <label>Contraseña Temporal</label>
                                        <input name="password" type="password" required placeholder="Mínimo 6 caracteres" />
                                    </div>
                                </div>
                                <div className="brokers-modal-actions">
                                    <button type="button" className="premium-btn secondary" onClick={() => setIsCreating(false)}>Cancelar</button>
                                    <button type="submit" className="premium-btn primary" disabled={acting}>
                                        {acting ? 'Creando...' : 'Crear Acceso'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .premium-management-container { width: 100%; display: flex; flex-direction: column; gap: 32px; }
                .management-header-lux { display: flex; justify-content: space-between; align-items: flex-end; }
                .management-title { font-size: 2.2rem; font-weight: 900; color: #111827; letter-spacing: -0.04em; margin: 0; }
                .management-subtitle { color: #6b7280; font-weight: 500; margin-top: 4px; }
                
                .management-filters-section { display: flex; gap: 16px; align-items: center; }
                .search-bar-lux { flex: 1; background: white; border-radius: 16px; border: 1.5px solid #e5e7eb; height: 50px; display: flex; align-items: center; padding: 0 16px; gap: 12px; }
                .search-bar-lux input { border: none; width: 100%; height: 100%; font-size: 0.95rem; font-weight: 500; outline: none; }
                .filter-select-lux { height: 50px; border-radius: 16px; border: 1.5px solid #e5e7eb; padding: 0 16px; font-weight: 700; background: white; color: #374151; }

                .list-table-lux { display: flex; flex-direction: column; gap: 8px; }
                .table-header-row { display: grid; grid-template-columns: 2fr 1fr 2fr 1fr 1fr; padding: 12px 24px; color: #6b7280; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                .table-data-row { display: grid; grid-template-columns: 2fr 1fr 2fr 1fr 1fr; padding: 16px 24px; background: white; border-radius: 16px; border: 1px solid #f3f4f6; align-items: center; transition: 0.2s; }
                .table-data-row:hover { border-color: #e5e7eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

                .col-user { display: flex; align-items: center; gap: 12px; }
                .user-avatar-mini { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
                .user-avatar-mini.active { background: #eff6ff; color: #1d4ed8; }
                .user-avatar-mini.inactive { background: #f3f4f6; color: #9ca3af; }
                
                .user-role-label { font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; }
                .id-badge { background: #f9fafb; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; color: #374151; border: 1px solid #e5e7eb; }
                
                .contact-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #4b5563; font-weight: 500; }
                .contact-item svg { color: #9ca3af; }

                .col-actions { display: flex; gap: 8px; justify-content: flex-end; }
                .icon-btn-lux { width: 36px; height: 36px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: white; display: flex; align-items: center; justify-content: center; color: #6b7280; cursor: pointer; transition: 0.2s; }
                .icon-btn-lux:hover { border-color: #111827; color: #111827; }
                .icon-btn-lux.danger:hover { border-color: #ef4444; color: #ef4444; }

                @media (max-width: 1024px) {
                    .table-header-row { display: none; }
                    .table-data-row { grid-template-columns: 1fr; gap: 16px; }
                    .col-actions { justify-content: flex-start; border-top: 1px solid #f3f4f6; padding-top: 12px; }
                }
            `}</style>
        </div>
    );
}
