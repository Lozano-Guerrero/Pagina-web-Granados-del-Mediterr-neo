// src/components/PhotoSphereViewer.jsx

import React from 'react';
// 🛑 PASO 1: Importamos el módulo completo como un alias PSV
import * as PSV from 'react-photo-sphere-viewer'; 
import './PhotoSphereViewer.css'; 

/**
 * Función auxiliar para encontrar el componente real dentro del módulo importado.
 */
const getViewerComponent = (module) => {
    // Probamos el nombre completo
    if (module.PhotoSphereViewer) return module.PhotoSphereViewer;
    // Probamos la exportación por defecto y anidada
    if (module.default) {
        if (typeof module.default === 'function') {
            return module.default;
        }
        if (module.default.PhotoSphereViewer) {
             return module.default.PhotoSphereViewer;
        }
    }
    // Probamos el nombre más simple 'Viewer'
    if (module.Viewer) return module.Viewer;
    
    return null;
};


const PhotoSphereViewerComponent = ({ imageUrl, sphereId, height = '500px' }) => {
    
    // 🛑 CORRECCIÓN: Definimos la variable ViewerComponent DENTRO del componente
    // para que esté accesible en el return y tenga el ámbito correcto.
    const ViewerComponent = getViewerComponent(PSV); 

    // Si el componente no se encuentra (aún es null), mostramos el error.
    if (!ViewerComponent) {
        console.error("Error crítico: El componente 360° no se pudo extraer del módulo. Es un problema de exportación de la librería.");
        return <div>Error al cargar el visor 360°.</div>;
    }

    // ... el resto de la configuración 'options' sigue igual ...
    const options = {
        panorama: imageUrl, 
        container: `viewer-${sphereId}`, 
        caption: 'Arrastra o mueve tu móvil para explorar la vista 360°.',
        loadingImg: null, 
        navbar: ['zoom', 'move', 'fullscreen'],
        defaultPitch: 0,
        defaultYaw: 0, 
        autorotateDelay: 1000, 
        autorotateSpeed: '1rpm',
        size: {
            height: height,
            width: '100%',
        }
    };

    return (
        <div className="psv-viewer-wrapper" key={sphereId} style={{ height: height }}>
            
            {/* 🛑 USO DEL COMPONENTE: Ahora ViewerComponent está definido en este ámbito */}
            <ViewerComponent 
                src={imageUrl} 
                id={`viewer-component-${sphereId}`}
                options={options}
                style={{ width: '100%', height: '100%' }}
            />
            
            {/* Overlay para las instrucciones del usuario */}
            <div className="pano-controls-overlay">
                 <p>{options.caption}</p>
            </div>
        </div>
    );
};

export default PhotoSphereViewerComponent;