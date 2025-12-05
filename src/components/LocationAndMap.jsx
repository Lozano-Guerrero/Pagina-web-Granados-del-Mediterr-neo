// src/components/LocationAndMap.jsx (MODIFICADO para integrar el nuevo mapa)

import React from 'react'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faRoad, faHospital } from '@fortawesome/free-solid-svg-icons'; 
import InteractiveMasterPlanMap from './InteractiveMasterPlanMap'; // 🛑 NUEVA IMPORTACIÓN
import './LocationAndMap.css'; 

// Datos clave de ubicación del PDF (Página 3)
const keyFacts = [
    { icon: faRoad, title: 'Carretera Nacional', detail: 'A solo 2.5 km', description: 'Acceso rápido a la vía principal.' },
    { icon: faMapMarkerAlt, title: 'Centro', detail: '6.5 km', description: 'Cercanía al corazón social y comercial de Montemorelos.' },
    { icon: faHospital, title: 'Servicios de Salud', detail: '4.5 km', description: 'Hospital General de Montemorelos.' },
];
// ... (Se ha eliminado todo el estado y la lógica de zoom/pan)

const LocationAndMap = () => {
    return (
        <section className="location-section">
            {/* 1. Encabezado con Franja y Texto Blanco */}
            <div className="location-title-wrapper2">
                <h2 className="section-titleAmenidades-sectionprincipal">Ubicación y Amenidades</h2>
            </div>
            
            <div className="location-inner-container">
                {/* Parte 1: Tarjetas de Datos Clave (Key Facts) */}
                <div className="location-facts-container">
                    {keyFacts.map((fact, index) => (
                        <div key={index} className="fact-card">
                            <FontAwesomeIcon icon={fact.icon} className="fact-icon" />
                            <h3>{fact.title}</h3>
                            <p className="fact-detail">
                                <strong>{fact.detail}</strong>
                            </p>
                            <p className="fact-description">{fact.description}</p>
                        </div>
                    ))}
                </div>

                <hr className="divider" />

                
            </div>
        </section>
    );
};

export default LocationAndMap;