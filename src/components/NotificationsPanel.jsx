import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    X,
    Package,
    User,
    TrendingUp
} from 'lucide-react';
import './Notifications.css';

const NOTIF_TYPES = {
    DUPLICATE: { icon: AlertTriangle, color: '#f59e0b', bg: '#fef3c7' },
    SALE: { icon: CheckCircle, color: '#10b981', bg: '#ecfdf3' },
    AVAILABILITY: { icon: Package, color: '#3b82f6', bg: '#eff6ff' },
    SYSTEM: { icon: Info, color: '#6b7280', bg: '#f3f4f6' }
};

export default function NotificationsPanel({
    notifications,
    onClose,
    onMarkAsRead,
    onClearAll
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="notifications-panel-lux"
        >
            <div className="notif-header">
                <div className="notif-title-row">
                    <Bell size={18} className="title-icon" />
                    <h3>Notificaciones</h3>
                    {notifications.length > 0 && (
                        <span className="notif-count-badge">{notifications.length}</span>
                    )}
                </div>
                <div className="notif-actions">
                    {notifications.length > 0 && (
                        <button onClick={onClearAll} className="clear-all-btn">Limpiar todo</button>
                    )}
                    <button onClick={onClose} className="close-panel-btn">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="notif-content">
                <AnimatePresence mode="popLayout">
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="empty-notif-state"
                        >
                            <Bell size={48} />
                            <p>No tienes notificaciones nuevas</p>
                        </motion.div>
                    ) : (
                        notifications.map((notif) => {
                            const Config = NOTIF_TYPES[notif.type] || NOTIF_TYPES.SYSTEM;
                            const Icon = Config.icon;

                            return (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                                    onClick={() => onMarkAsRead(notif.id)}
                                >
                                    <div
                                        className="notif-icon-box"
                                        style={{ backgroundColor: Config.bg, color: Config.color }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                    <div className="notif-info">
                                        <h4 className="notif-item-title">{notif.title}</h4>
                                        <p className="notif-item-text">{notif.message}</p>
                                        <span className="notif-item-time">{notif.time}</span>
                                    </div>
                                    {!notif.read && <div className="unread-dot" />}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
