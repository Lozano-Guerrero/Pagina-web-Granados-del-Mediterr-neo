// src/components/HeroStaticV2.jsx
import React from 'react';
import './HeroStaticV2.css';
import BrochureDownloadButton from './BrochureDownloadButton';

const HeroStaticV2 = () => {
    return (
        <div className="hero-static-v2-container">
            {/* Imagen de fondo con opacidad/overlay para mejorar legibilidad si hace falta */}
            <div className="hero-static-v2-overlay"></div>

            {/* Contenido centrado */}
            <div className="hero-static-v2-content">
                <h1 className="hero-static-title-sitka fade-in-up">
                    El Lujo Mediterráneo,<br />
                    Centro de tu Legado
                </h1>

                {/* Botón existente pero con clases adicionales para el nuevo estilo verde elegante */}
                <div className="fade-in-up delay-1">
                    <BrochureDownloadButton
                        text="Descargar brochure"
                        className="btn-brochure-elegant-green"
                    />
                </div>
            </div>
        </div>
    );
};

export default HeroStaticV2;
