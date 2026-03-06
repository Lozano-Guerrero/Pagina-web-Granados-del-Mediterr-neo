// src/components/PanoViewerStable.jsx

import React from 'react';
import * as PANN_MODULE from 'react-pannellum'; 
import './PanoViewerStable.css'; 

// Función para encontrar el componente (la dejamos igual)
const getPannellumComponent = (module) => {
    // ... (El código de getPannellumComponent permanece sin cambios) ...
    if (module.Pannellum) return module.Pannellum;
    if (module.default) {
        if (typeof module.default === 'function') {
            return module.default;
        }
        if (module.default.Pannellum) {
             return module.default.Pannellum;
        }
    }
    return null;
};


const PanoViewerStable = ({ imageUrl, panoId, height = '650px' }) => {
    
    const PannellumComponent = getPannellumComponent(PANN_MODULE); 

    if (!PannellumComponent) {
        console.error("Error crítico: El componente Pannellum no se pudo extraer del módulo.");
        return <div>Error: No se pudo cargar el visor 360°.</div>;
    }

    // Configuración para el visor
    const config = {
        default: {
            firstScene: panoId, 
            scenes: {
                [panoId]: { 
                    type: "equirectangular",
                    panorama: imageUrl, 
                    autoLoad: true,
                    autoRotate: -2, 
                    showControls: true, 
                }
            }
        },
        style: {
            width: '100%',
            height: height,
        }
    };

    return (
        <div className="stable-viewer-wrapper" style={{ height: height }}>
            
            <PannellumComponent 
                // 🛑 CORRECCIÓN 1: Pasamos el 'id' requerido para el contenedor HTML.
                id={panoId} 
                
                sceneId={panoId} 
                image={imageUrl} 
                config={config.default} 
                style={config.style}
            />
            
            <div className="pano-controls-overlay">
                 <p>Arrastra para explorar la vista 360°.</p>
                 
            </div>
        </div>
    );
};

export default PanoViewerStable;