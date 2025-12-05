// src/components/ArchitecturalVision.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './ArchitecturalVision.css';

// 🛑 IMAGEN PLACEHOLDER: Imagen de arquitectura Mediterránea o render de un lote
const VISION_IMAGE = '/img/casa1.jpg'; 

const ArchitecturalVision = () => {
    return (
        <div className="architectural-vision-container">
            <div className="vision-content">
                <h2 className="vision-title">Visión Arquitectónica y Plusvalía</h2>
                <p className="vision-tagline">
                    Diseño, Funcionalidad y Legado: Cada lote, el inicio de una propuesta de valor.
                </p>
                <p className="vision-text">
                    Con una mirada integral del desarrollo, cada lote se proyecta como el punto de partida para una propuesta arquitectónica que **equilibra diseño, funcionalidad y plusvalía**. A través de soluciones personalizadas, creamos espacios que responden al entorno y anticipan las necesidades de quienes los habitan.
                </p>
                <p className="vision-text">
                    Nuestra **arquitectura mediterránea** no solo ofrece calidez visual, sino que está diseñada para elevar el valor de tu patrimonio y consolidar tu legado familiar en un entorno campestre exclusivo.
                </p>
               
            </div>
            
            <div className="vision-image-wrapper">
                <img 
                    src={VISION_IMAGE} 
                    alt="Render de la arquitectura mediterránea y terrenos" 
                    className="vision-image" 
                    loading="lazy" 
                />
            </div>
        </div>
    );
};

export default ArchitecturalVision;