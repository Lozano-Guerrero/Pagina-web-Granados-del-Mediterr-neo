// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Para la navegación programática
import './NotFoundPage.css'; // Importa el CSS del 404

// Puedes usar una imagen de un render 3D de un paisaje idealizado pero vacío,
// o una imagen que transmita "pérdida" pero de forma elegante.
// Por ahora, usaré una placeholder.
const NOT_FOUND_IMAGE = '/img/404-placeholder.jpg'; // Asegúrate de tener esta imagen en public/img

const NotFoundPage = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-tagline">Página no encontrada</h2>
                <p className="not-found-message">
                    Lamentamos las molestias, pero la propiedad o información que buscas no se encuentra en este exclusivo desarrollo.
                    Es posible que la dirección haya sido escrita incorrectamente o que la página haya sido reubicada.
                </p>
                <div className="not-found-actions">
                    <Link to="/" className="not-found-button primary">
                        Volver a la Página Principal
                    </Link>
                    <Link to="/contacto" className="not-found-button secondary">
                        Contactar Asesor
                    </Link>
                </div>
            </div>
            {/* Opcional: una imagen de fondo o ilustración */}
            <div className="not-found-image-overlay" style={{ backgroundImage: `url(${NOT_FOUND_IMAGE})` }}></div>
        </div>
    );
};

export default NotFoundPage;