// src/pages/AmenityPageLayout.jsx
import React from 'react';
// Importa tus componentes reutilizables
// import FeatureCard from '../components/FeatureCard'; 
// import GalleryBlock from '../components/GalleryBlock'; 
// Asegúrate de tener un archivo CSS para este layout, por ejemplo, AmenityPage.css

const AmenityPageLayout = ({ title, tagline, mainImage, children }) => {
    return (
        <div className="amenity-page">
            
            {/* 1. Sección de Banner/Encabezado */}
            <header className="amenity-header" style={{ backgroundImage: `url(${mainImage})` }}>
                <div className="header-overlay">
                    <h1>{title}</h1>
                    <p className="tagline">{tagline}</p>
                </div>
            </header>
            
            {/* 2. Contenido Principal (donde irán las FeatureCards y GalleryBlock) */}
            <main className="amenity-main-content">
                {children}
            </main>

            {/* Opcional: Footer de la página de amenidad */}
            {/* <div className="amenity-footer">...</div> */}
        </div>
    );
};

export default AmenityPageLayout;