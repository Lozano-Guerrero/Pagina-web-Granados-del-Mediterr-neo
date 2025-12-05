// src/components/LocationMap.jsx
import React from 'react';
import './LocationMap.css';

const LocationMap = () => {
    // Coordenadas proporcionadas: 25°08'05.6"N 99°51'43.4"W
    const latitude = 25.134889;  // 25 grados, 8 minutos, 5.6 segundos
    const longitude = -99.862056; // -99 grados, 51 minutos, 43.4 segundos (Oeste es negativo)
    
    // URL de incrustación de Google Maps. Usamos el formato de latitud/longitud
    // con un marcador (t=m) y un zoom adecuado (z=15) para ver el contexto.
    const mapEmbedSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1575.6418706859364!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${latitude}%2C${longitude}!5e1!3m2!1ses-419!2smx!4v1678824000000!5m2!1ses-419!2smx`;
    
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
        <section className="location-googlemap-section">
            <div className="location-googlemap-container">
                <div className="location-googlemap-header">
                    <h2 className="location-googlemap-title">Ubicación Estratégica</h2>
                    <p className="location-googlemap-subtitle">
                        Granados del Mediterráneo se encuentra en Montemorelos, Nuevo León, a solo 2.5 km de la Carretera Nacional.
                    </p>
                   
                </div>
                
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