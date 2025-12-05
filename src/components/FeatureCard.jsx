// src/components/FeatureCard.jsx
import React from 'react';
// 🛑 SOLO NECESITAMOS EL COMPONENTE DE RENDERIZADO
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import './FeatureCard.css';

// 🛑 ELIMINAMOS LA EXPORTACIÓN E IMPORTACIÓN DE TODOS LOS ÍCONOS DE AQUÍ

const FeatureCard = ({ icon, title, description }) => { 
    return (
        <div className="feature-card">
            <div className="feature-icon-wrapper">
                {/* 🛑 Usamos la prop 'icon' */}
                <FontAwesomeIcon icon={icon} className="feature-icon" />
            </div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{description}</p>
        </div>
    );
};

export default FeatureCard;