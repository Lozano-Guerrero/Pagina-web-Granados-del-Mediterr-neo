// src/components/InteractiveMasterPlanMap.jsx (Versión con Bloque de Venta y CTA)

import React from 'react'; 
import { Link } from 'react-router-dom'; // 🛑 Importamos Link para el CTA
import './InteractiveMasterPlanMap.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Necesario para el ícono del botón
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'; // Ícono para el botón

// Rutas de imágenes específicas 
const MAP_IMAGE_VERTICAL = '/img/mapa-granados.png'; 
const MAP_IMAGE_HORIZONTAL = '/img/mapa-granados-horizontal.png'; 

/**
 * Componente de Mapa Maestro Estático. 
 * Muestra el masterplan junto a un bloque de texto de venta y CTA.
 */
const InteractiveMasterPlanMap = ({ 
    title = "Plano Maestro del Desarrollo",
    text = "Un proyecto de más de 200 lotes para construir el legado de tu familia. Descubre la visión completa de Granados, que integra amenidades exclusivas, extensas áreas verdes y la mejor ubicación en Montemorelos, garantizando tu plusvalía." // 🛑 Texto de complemento
}) => {
    
    return (
        <div className="interactive-map-widget">
            <div className="map-headerHP">
                <h3>{title}</h3>
            </div>
            
            {/* 🛑 Nuevo contenedor para la disposición en PC */}
            <div className="map-content-layout">
                
                {/* 1. Bloque de Texto y CTA */}
                <div className="map-info-block">
                    <h4>Nuestra Visión, Tu Legado</h4>
                    <p>{text}</p>
                    
                    {/* Botón CTA */}
                    <Link to="/precios" className="map-cta-button">
                        Ver Disponibilidad y Precios <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>
                
                {/* 2. Bloque del Mapa */}
                <div className="map-image-wrapper-static">
                    <picture>
                        <source media="(min-width: 769px)" srcSet={MAP_IMAGE_HORIZONTAL} /> 
                        <img
                            src={MAP_IMAGE_VERTICAL}
                            alt="Plano Maestro de Granados del Mediterráneo"
                            className="map-image-static"
                            loading="lazy"
                        />
                    </picture>
                </div>

            </div>
            
        </div>
    );
};

export default InteractiveMasterPlanMap;