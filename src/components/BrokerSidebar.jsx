import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calculator,
    LogOut,
    X,
    MessageCircle,
    PlayCircle,
    ChevronDown,
    ChevronLeft,
    FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import RegimenModule from '../pages/brokers/RegimenModule';
import Logo from '../assets/logo.png';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/Ehfbf2S0e8KHThsbIFLxsq';

export default function BrokerSidebar({ isOpen, toggleSidebar }) {
    const { profile, session } = useAuth();
    const navigate = useNavigate();
    const [showResources, setShowResources] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/brokers');
    };

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Broker';
    const userRole = profile?.role || 'broker';
    const variant = userRole === 'inmobiliaria' ? 'inmobiliaria' : 'broker';
    const isLinkedBroker = profile?.org_id && userRole === 'broker';

    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard, path: userRole === 'inmobiliaria' ? '/brokers/inmobiliaria' : '/brokers/dashboard' },
        { title: 'Prospectos', icon: Users, path: '/brokers/leads' },
        { title: 'Cotizador', icon: Calculator, path: '/brokers/cotizador' },
        { title: 'Cotizaciones', icon: FileText, path: '/brokers/quotes' },
    ];

    if (userRole === 'inmobiliaria') {
        menuItems.push({ title: 'Gestión Brokers', icon: Users, path: '/brokers/management' });
    }

    return (
        <>
            {/* Overlay - Solo para móvil */}
            <AnimatePresence>
                {isOpen && typeof window !== 'undefined' && window.innerWidth < 1024 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="sidebar-overlay"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Principal */}
            <motion.aside
                className={`broker-sidebar ${isOpen ? 'open' : ''}`}
                initial={false}
                animate={{
                    x: isOpen ? 0 : '-100%'
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <div className="sidebar-header">
                    <img src={Logo} alt="Granados" className="sidebar-logo" />
                    <button className="toggle-sidebar-btn" onClick={toggleSidebar} title="Ocultar Menú">
                        <ChevronLeft size={24} />
                    </button>
                    <button className="close-btn" onClick={toggleSidebar}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Navegación</div>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                        >
                            <item.icon size={20} />
                            <span>{item.title}</span>
                        </NavLink>
                    ))}

                    <div className="sidebar-divider" />

                    {/* Sección de Recursos */}
                    <div className="nav-section-label clickable" onClick={() => setShowResources(!showResources)}>
                        Recursos <ChevronDown size={14} style={{ transform: showResources ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '0.2s' }} />
                    </div>

                    <AnimatePresence>
                        {showResources && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="sidebar-resources-container"
                            >
                                {/* Integración de RegimenModule simplificada vía CSS */}
                                <div className="sidebar-card sidebar-regimen-wrapper">
                                    <RegimenModule variant={variant} />
                                </div>

                                <div className="whatsapp-community-lux">
                                    <div className="whatsapp-content">
                                        <h4 className="whatsapp-title">Grupo de WhatsApp</h4>
                                        <p className="whatsapp-desc">Únete al grupo de WhatsApp de brokers para no perderte de actualizaciones, avisos, material y precios.</p>
                                        <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
                                            Unirme al grupo
                                        </a>
                                    </div>
                                    <div className="whatsapp-deco d1"></div>
                                    <div className="whatsapp-deco d2"></div>
                                </div>

                                <div className="sidebar-card tutorial-card disabled">
                                    <div className="card-icon"><PlayCircle size={18} /></div>
                                    <div className="card-info">
                                        <div className="card-title">Tutorial</div>
                                        <div className="card-desc">Próximamente</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {userName.charAt(0)}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{userName}</span>
                            <span className="user-role">{userRole === 'inmobiliaria' ? 'Master Inmo' : (isLinkedBroker ? 'Broker Asociado' : 'Broker Independiente')}</span>
                        </div>
                    </div>
                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </motion.aside>

            <style>{`
                .broker-sidebar {
                    width: 320px;
                    height: 100vh;
                    background: #111827; /* Fondo totalmente sólido */
                    color: white;
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 1000;
                    border-right: 1px solid rgba(255,255,255,0.1);
                    overflow-y: auto;
                }

                .broker-sidebar::-webkit-scrollbar {
                    width: 4px;
                }

                .broker-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .broker-sidebar::-webkit-scrollbar-thumb {
                    background: rgba(195, 156, 99, 0.3);
                    border-radius: 10px;
                }

                .broker-sidebar::-webkit-scrollbar-thumb:hover {
                    background: rgba(195, 156, 99, 0.5);
                }

                .sidebar-header {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .sidebar-logo {
                    height: 45px;
                    width: auto;
                    filter: brightness(0) invert(1); /* Si el logo es negro, lo hacemos blanco/dorado para el fondo oscuro */
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 0 16px;
                }

                .nav-section-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #6b7280;
                    margin: 24px 8px 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .nav-section-label.clickable { cursor: pointer; }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: #9ca3af;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s;
                    margin-bottom: 4px;
                }

                .nav-item:hover {
                    background: #1f2937;
                    color: white;
                }

                .nav-item.active {
                    background: #c39c63;
                    color: #111827;
                }

                .sidebar-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.05);
                    margin: 16px 0;
                }

                .sidebar-resources-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    overflow: hidden;
                }

                .sidebar-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    transition: 0.2s;
                }

                .sidebar-card:hover { background: rgba(255,255,255,0.06); }
                .sidebar-card.disabled { opacity: 0.5; pointer-events: none; }

                .card-icon {
                    width: 32px;
                    height: 32px;
                    background: #c39c63;
                    color: #111827;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .whatsapp-community-lux {
                    background: #e6f7ef !important;
                    border: none !important;
                    padding: 24px 20px !important;
                    border-radius: 20px !important;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    margin: 8px 0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .whatsapp-content {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                }

                .whatsapp-title {
                    color: #064e3b;
                    font-size: 1.15rem;
                    font-weight: 900;
                    margin: 0 0 10px 0;
                    font-family: inherit;
                }

                .whatsapp-desc {
                    color: #374151;
                    font-size: 0.85rem;
                    line-height: 1.45;
                    margin: 0 0 20px 0;
                    font-weight: 500;
                }

                .whatsapp-btn {
                    background: #10b981;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 800;
                    text-decoration: none;
                    font-size: 0.95rem;
                    display: block;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: center;
                    width: 100%;
                    border: none;
                }

                .whatsapp-btn:hover {
                    background: #059669;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                    color: white;
                }

                .whatsapp-deco {
                    position: absolute;
                    background: #d1fae5;
                    border-radius: 50%;
                    z-index: 1;
                    opacity: 0.6;
                }

                .whatsapp-deco.d1 {
                    width: 80px;
                    height: 80px;
                    top: -30px;
                    right: -20px;
                }

                .whatsapp-deco.d2 {
                    width: 120px;
                    height: 120px;
                    bottom: -50px;
                    left: 20%;
                    background: #bbf7d0;
                }

                /* Overwrite RegimenModule inside Sidebar */
                .sidebar-regimen-wrapper .regimen-card {
                    background: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    width: 100% !important;
                }
                .sidebar-regimen-wrapper .regimen-head { margin-bottom: 8px; }
                .sidebar-regimen-wrapper .regimen-title { font-size: 0.85rem !important; color: white !important; font-weight: 700 !important; }
                .sidebar-regimen-wrapper .regimen-subtitle { font-size: 0.7rem !important; }
                .sidebar-regimen-wrapper .regimen-block { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
                .sidebar-regimen-wrapper .regimen-block-title { font-size: 0.75rem !important; color: #9ca3af !important; }
                .sidebar-regimen-wrapper .regimen-file { font-size: 0.75rem !important; color: #c39c63 !important; word-break: break-all; }
                .sidebar-regimen-wrapper .regimen-state.ok { background: #064e3b; color: #10b981; }
                .sidebar-regimen-wrapper .brokers-inline-btn { width: 100% !important; font-size: 0.75rem !important; height: 32px !important; margin-top: 8px !important; }
                .sidebar-regimen-wrapper .brokers-dropzone { padding: 12px !important; }
                .sidebar-regimen-wrapper .brokers-dropzone-title { font-size: 0.7rem !important; }
                .sidebar-regimen-wrapper .brokers-dropzone-hint { font-size: 0.65rem !important; }

                .sidebar-footer {
                    padding: 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.2);
                }

                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    background: #c39c63;
                    color: #111827;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.2rem;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-size: 0.9rem;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 160px;
                }

                .user-role {
                    font-size: 0.7rem;
                    color: #9ca3af;
                }

                .logout-button {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: #ef4444;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.85rem;
                    transition: 0.2s;
                }

                .logout-button:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: #ef4444;
                }

                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.5); /* Oscurecemos un poco más para móvil */
                    backdrop-filter: none;
                    z-index: 999;
                    display: none; /* Oculto por defecto */
                }

                @media (max-width: 1024px) {
                    .sidebar-overlay { display: block; }
                }

                .close-btn {
                    display: none;
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                }

                .toggle-sidebar-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    cursor: pointer;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .toggle-sidebar-btn:hover {
                    background: #c39c63;
                    color: #111827;
                    border-color: #c39c63;
                }

                @media (max-width: 1024px) {
                    .close-btn { display: block; }
                    .toggle-sidebar-btn { display: none; }
                    .broker-sidebar {
                        box-shadow: 10px 0 30px rgba(0,0,0,0.15);
                    }
                }
            `}</style>
        </>
    );
}
