// src/components/OfficeInvitationSection.jsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faDirections } from '@fortawesome/free-solid-svg-icons';
import './OfficeInvitationSection.css'; 

// 🛑 Sustituir por la ruta real de tu imagen de la torre
const TOWER_IMAGE_URL = "/img/oficina.jpg"; 

const OFFICE_ADDRESS = "Edificio Connexity, Av. Alfonso Reyes Local 11, Monterrey Sur, 64920 Monterrey, N.L.";
const GOOGLE_MAPS_LINK = `https://maps.google.com/?q=${encodeURIComponent(OFFICE_ADDRESS)}`;

const OfficeInvitationSection = () => {
    return (
        <section className="office-invitation-section">
            <div className="office-content">
                
                {/* 1. CONTENEDOR DE TEXTO (Aparecerá arriba en móvil por el CSS) */}
                <div className="text-container">
                    <h3>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-marker" />
                        Visítanos en Nuestras Oficinas de Monterrey.
                    </h3>
                    <p className="description">
                        Te invitamos a conocer todos los detalles de nuestro proyecto y modelos de inversión en nuestra oficina de ventas.
                    </p>
                    <p className="address-detail">
                        <strong>Dirección:</strong> {OFFICE_ADDRESS}
                    </p>
                    
                    <a 
                        href={GOOGLE_MAPS_LINK} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-directions"
                    >
                        <FontAwesomeIcon icon={faDirections} />
                        Cómo Llegar
                    </a>
                </div>
                
                {/* 2. CONTENEDOR DE IMAGEN (El antiguo "map-container") */}
                <div className="image-container">
                    {/* 🛑 La imagen de la torre */}
                    <img 
                        src={TOWER_IMAGE_URL} 
                        alt="Oficina de ventas en Torre Connexity" 
                        className="office-tower-image"
                    />
                </div>
            </div>
        </section>
    );
};

export default OfficeInvitationSection;