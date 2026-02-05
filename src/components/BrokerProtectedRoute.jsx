import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function BrokerProtectedRoute({ children, allowedRoles = null }) {
    const location = useLocation();
    const { loading, user, profile } = useAuth();

    if (loading) return null;

    if (!user) {
        const message = location.pathname.startsWith('/brokers/cotizador')
            ? 'Para acceder al cotizador de brokers necesitas iniciar sesión.'
            : 'Para acceder al panel de brokers necesitas iniciar sesión.';
        return <Navigate to="/brokers" replace state={{ from: location, message }} />;
    }

    if (!profile) {
        return <Navigate to="/brokers" replace state={{ from: location, message: 'Tu perfil aún no está configurado. Contacta a un administrador.' }} />;
    }

    if (profile.is_active === false) {
        return <Navigate to="/brokers" replace state={{ from: location, message: 'Tu cuenta está inactiva. Contacta a un administrador.' }} />;
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const role = String(profile.role || '').toLowerCase();
        const allowed = allowedRoles.map((r) => String(r).toLowerCase());
        if (!allowed.includes(role)) {
            // Redirige a su panel correcto si intentan entrar por URL.
            const target =
                (role === 'admin' || role === 'subadmin')
                    ? '/admin'
                    : (role === 'inmobiliaria' ? '/brokers/inmobiliaria' : '/brokers/dashboard');
            return <Navigate to={target} replace state={{ from: location, message: 'No tienes permisos para acceder a esa sección.' }} />;
        }
    }

    return children;
}
