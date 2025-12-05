// src/components/Pano360Viewer.jsx - Versión Corregida para AutoLoad

import React from 'react';
import ReactPannellum from 'react-pannellum'; 
import 'pannellum/build/pannellum.css'; 
import './Pano360Viewer.css'; 

const Pano360Viewer = ({ imageUrl, panoId, height = '500px' }) => {
    
    const sceneIdentifier = `scene-${panoId}`; 
    
    const config = {
        // === CONFIGURACIÓN GLOBAL (CRÍTICA PARA EL INICIO) ===
        "default": {
            // 🛑 CRÍTICO 1: Indica qué escena cargar primero
            "firstScene": sceneIdentifier, 
            
            // 🛑 CRÍTICO 2: FUERZA la carga inmediata sin clic
            "autoLoad": true, 
            
            // 🛑 CRÍTICO 3: Esto es para la rotación, ayuda al inicio
            "autoRotate": -2,
            
            // Si la imagen sigue en 'Click to Load', prueba añadiendo esto:
            // "showLoadButton": false, 
        },
        
        // === DEFINICIÓN DE ESCENAS ===
        "scenes": {
            [sceneIdentifier]: { 
                "type": "equirectangular",
                "pano": imageUrl, // ¡Ruta a la imagen 360!
                "hfov": 100, 
                "yaw": 0,   
                "pitch": 0,  
                "showControls": true,
                "orientationOnByDefault": true, 
                // No es necesario repetir autoLoad/autoRotate aquí, se heredan de "default"
            }
        }
    };
    
    return (
        <div className="psv-viewer-wrapper" key={panoId} style={{ height: height }}>
            
            <ReactPannellum
                id={`pano-container-${panoId}`} 
                sceneId={sceneIdentifier} 
                config={config}
                style={{ width: '100%', height: height }}
            />
            
            <div className="pano-controls-overlay">
                <p>Arrastra o mueve tu móvil para explorar la vista 360°.</p>
            </div>
        </div>
    );
};

export default Pano360Viewer;