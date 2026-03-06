// src/components/LocationMap.jsx
import React from 'react';
import './LocationMapV2.css';

const LocationMap = () => {
    // URL de Google MyMaps proporcionada por el usuario
    const mapEmbedSrc = `https://www.google.com/maps/d/u/0/embed?mid=1KA4jT6dHezL1gmv784cH3by1mf4BTPI`;

    const googleMapsEmbedCode = `
        <iframe 
            src="${mapEmbedSrc}" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade"
            title="Ubicación de Granados del Mediterráneo en Montemorelos"
        ></iframe>
    `;

    return (
        <section className="location-googlemap-section-v2">
            <div className="location-googlemap-container-v2">
                <div
                    className="map-embed-wrapper"
                    // CRÍTICO: Inyectar el iframe con la URL de tus coordenadas
                    dangerouslySetInnerHTML={{ __html: googleMapsEmbedCode }}
                />
            </div>
        </section>
    );
};

export default LocationMap;