// src/components/AttributesGridV2.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCompassDrafting,
    faTableTennisPaddleBall,
    faArrowTrendUp,
    faMapLocationDot
} from '@fortawesome/free-solid-svg-icons';
import './AttributesGridV2.css';

const AttributesGridV2 = () => {
    const attributes = [
        {
            icon: faCompassDrafting,
            title: "Arquitectura Mediterránea",
            description: "Diseño de calidez que fusiona las vistas de la Sierra Madre con el lujo campestre."
        },
        {
            icon: faTableTennisPaddleBall,
            title: "Más de 40 Amenidades",
            description: "Espacios diseñados para el disfrute familiar, desde el Lagoon Club hasta la Casa del Árbol."
        },
        {
            icon: faArrowTrendUp,
            title: "Inversión y Plusvalía",
            description: "Lotes proyectados como el punto de partida para una propuesta arquitectónica de alto valor."
        },
        {
            icon: faMapLocationDot,
            title: "Ubicación Estratégica",
            description: "A solo 2.5 km de Carretera Nacional en Montemorelos, con rápido acceso a la zona centro y servicios."
        }
    ];

    return (
        <section className="attributes-grid-v2-container">
            <div className="attributes-grid-v2-wrapper">
                {attributes.map((attr, index) => (
                    <div className="attribute-card-v2" key={index}>
                        <div className="attribute-icon-circle-v2">
                            <FontAwesomeIcon icon={attr.icon} />
                        </div>
                        <h3 className="attribute-title-v2">{attr.title}</h3>
                        <div className="attribute-separator-v2"></div>
                        <p className="attribute-desc-v2">
                            {attr.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AttributesGridV2;
