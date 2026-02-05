import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminProtectedRoute({ children }) {
    const location = useLocation();
    const { loading, user, profile } = useAuth();

    if (loading) return null;

    if (!user) {
        return (
            <Navigate
                to="/brokers"
                replace
                state={{ from: location, message: 'Para acceder al panel admin necesitas iniciar sesión.' }}
            />
        );
    }

    if (!profile) {
        return (
            <Navigate
                to="/brokers"
                replace
                state={{ from: location, message: 'Tu perfil aún no está configurado. Contacta a un administrador.' }}
            />
        );
    }

    const accountStatus = String(profile.account_status || '').toLowerCase();
    if (profile.is_active === false || accountStatus === 'deactivated') {
        return (
            <Navigate
                to="/brokers"
                replace
                state={{ from: location, message: 'Tu cuenta está desactivada. Contacta a un administrador.' }}
            />
        );
    }

    const role = String(profile.role || '').toLowerCase();
    const isStaff = role === 'admin' || role === 'subadmin';
    if (!isStaff) {
        const target = role === 'inmobiliaria' ? '/brokers/inmobiliaria' : '/brokers/dashboard';
        return <Navigate to={target} replace />;
    }

    return children;
}
