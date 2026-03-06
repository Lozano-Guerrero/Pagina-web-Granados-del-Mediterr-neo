import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BrokerSidebar from '../components/BrokerSidebar';
import { Menu, Bell, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AnimatePresence } from 'framer-motion';
import NotificationsPanel from '../components/NotificationsPanel';

const BrokerLayout = () => {
    // Sidebar SIEMPRE abierto en desktop, solo se cierra manualmente
    const [isSidebarOpen, setIsSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );
    const { pathname } = useLocation();
    const { profile } = useAuth();

    // Notificaciones State
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [prevInventory, setPrevInventory] = useState(null);

    useEffect(() => {
        if (!supabase || !profile) return;

        // 1. Suscribirse a nuevas cotizaciones para detectar duplicados
        const channel = supabase
            .channel('db_quotes_changes')
            .on('postgres_changes', { event: 'INSERT', table: 'quotes' }, async (payload) => {
                const newQuote = payload.new;

                // Solo nos importa si es el mismo lote que el broker está viendo o tiene en sus prospectos
                // Por simplicidad, alertamos si hay una nueva cotización en cualquier lote
                // Pero podemos filtrar por lotes "activos" si tuviéramos esa lista

                // Verificar si hay duplicado (otra cotización para el mismo lote)
                const { count } = await supabase
                    .from('quotes')
                    .select('*', { count: 'exact', head: true })
                    .eq('lot_number', newQuote.lot_number)
                    .neq('id', newQuote.id);

                if (count > 0) {
                    addNotification({
                        type: 'DUPLICATE',
                        title: 'Interés Duplicado',
                        message: `Se ha creado otra cotización para el Lote ${newQuote.lot_number}.`,
                    });
                }
            })
            .subscribe();

        // 2. Polling de Inventario (Cada 1 min) para cambios de disponibilidad
        const checkInventory = async () => {
            try {
                const res = await fetch('https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1');
                const data = await res.json();
                const root = (Array.isArray(data) && data[0]) ? (data[0].json || data[0]) : data;
                const currentLotes = root.lotes || (Array.isArray(root) ? root : []);

                if (prevInventory) {
                    currentLotes.forEach(lote => {
                        const oldLote = prevInventory.find(p => p.id === lote.id || p.titulo === lote.titulo);
                        if (oldLote) {
                            const oldStatus = (oldLote.estado || oldLote.Estado || '').toUpperCase();
                            const newStatus = (lote.estado || lote.Estado || '').toUpperCase();

                            if (oldStatus === 'DISPONIBLE' && newStatus !== 'DISPONIBLE') {
                                addNotification({
                                    type: 'SALE',
                                    title: 'Lote Vendido/Separado',
                                    message: `El Lote ${lote.titulo || lote.id} ya no está disponible.`,
                                });
                            }
                        }
                    });
                }
                setPrevInventory(currentLotes);
            } catch (e) {
                console.error("Error polling inventory:", e);
            }
        };

        const interval = setInterval(checkInventory, 60000);
        checkInventory(); // Initial check

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [profile, prevInventory]);

    const addNotification = (notif) => {
        const id = Date.now();
        const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setNotifications(prev => [{ ...notif, id, time, read: false }, ...prev]);
    };

    const handleMarkAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...notif, read: true } : n));
    };

    const handleClearAll = () => setNotifications([]);

    // NO auto-cerrar sidebar - solo toggle manual

    const getPageTitle = () => {
        if (pathname.includes('/dashboard')) return 'Dashboard';
        if (pathname.includes('/leads')) return 'Mis Prospectos';
        if (pathname.includes('/cotizador')) return 'Cotizador & Mapa';
        if (pathname.includes('/inmobiliaria')) return 'Inmobiliaria';
        return 'Panel';
    };

    return (
        <div className="broker-layout">
            <BrokerSidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={`broker-main ${!isSidebarOpen ? 'full-width' : ''}`}>
                <header className="broker-top-bar">
                    {!isSidebarOpen && (
                        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} title="Mostrar Menú">
                            <Menu size={24} />
                        </button>
                    )}

                    <div className="top-bar-title">
                        {getPageTitle()}
                    </div>

                    <div className="top-bar-actions">
                        <div className="notification-wrapper">
                            <button className="action-circle-btn" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                                <Bell size={20} />
                                {notifications.some(n => !n.read) && <span className="notification-dot"></span>}
                            </button>
                            <AnimatePresence>
                                {isNotifOpen && (
                                    <NotificationsPanel
                                        notifications={notifications}
                                        onClose={() => setIsNotifOpen(false)}
                                        onMarkAsRead={handleMarkAsRead}
                                        onClearAll={handleClearAll}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="user-indicator-desktop">
                            <span className="user-name">{profile?.first_name}</span>
                            <div className="user-avatar-mini">
                                {profile?.first_name?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="broker-content-area">
                    <Outlet />
                </main>
            </div>

            <style>{`
                .broker-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #f9fafb;
                    color: #111827;
                }

                .broker-main {
                    flex: 1;
                    margin-left: 320px; /* Ancho de la sidebar actualizado */
                    display: flex;
                    flex-direction: column;
                    min-width: 0; /* Evita desbordes de flex items */
                    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .broker-main.full-width {
                    margin-left: 0;
                }

                .broker-top-bar {
                    height: 80px;
                    background: #ffffff; /* Sin blur, fondo sólido */
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 40px;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .mobile-menu-btn {
                    background: none;
                    border: none;
                    color: #374151;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    display: flex; /* Siempre visible por ahora para permitir toggle */
                    transition: background 0.2s;
                }

                .mobile-menu-btn:hover { background: #f3f4f6; }

                .top-bar-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #111827;
                    letter-spacing: -0.02em;
                }

                .top-bar-actions {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .action-circle-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: #f3f4f6;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4b5563;
                    cursor: pointer;
                    position: relative;
                    transition: 0.2s;
                }

                .action-circle-btn:hover {
                    background: #e5e7eb;
                    color: #111827;
                }

                .notification-wrapper {
                    position: relative;
                }

                .notification-dot {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 10px;
                    height: 10px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid #fff;
                    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
                }

                .user-indicator-desktop {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 6px 6px 16px;
                    background: #f3f4f6;
                    border-radius: 12px;
                }

                .user-name {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #374151;
                }

                .user-avatar-mini {
                    width: 32px;
                    height: 32px;
                    background: #111827;
                    color: #fbbf24;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.8rem;
                }

                .broker-content-area {
                    padding: 24px 40px; /* Reducido un poco para ganar espacio lateral */
                    flex: 1;
                    width: 100%;
                    max-width: 100%; /* Expandido al máximo */
                    margin: 0; /* Ya no es necesario centrar */
                }

                @media (max-width: 1024px) {
                    .broker-main {
                        margin-left: 0;
                    }

                    .broker-top-bar {
                        padding: 0 20px;
                        height: 70px;
                    }

                    .mobile-menu-btn {
                        display: block;
                    }

                    .user-indicator-desktop {
                        display: none;
                    }

                    .broker-content-area {
                        padding: 24px 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BrokerLayout;
