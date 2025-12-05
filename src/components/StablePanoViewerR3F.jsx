// src/components/StablePanoViewerR3F.jsx

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
// Importamos Sphere, useTexture, DeviceOrientationControls (Giroscopio) y OrbitControls (Arrastre)
import { Sphere, useTexture, DeviceOrientationControls, OrbitControls } from '@react-three/drei';
import * as THREE from 'three'; 
// ¡Asegúrate de cambiar el nombre del archivo CSS si lo renombraste!
import './StablePanoViewerR3F.css'; 

// --- Componente de la Escena 3D ---
/**
 * Componente 3D que proyecta la imagen 360° en una esfera.
 */
const Panorama = ({ imageUrl }) => {
    
    // Carga la textura desde la URL
    const texture = useTexture(imageUrl);
    
    // Configura el mapeo equirrectangular (esencial para panoramas)
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const meshRef = useRef();

    // Aplicar la rotación inicial para corregir el punto de vista (no empezar mirando el piso)
    React.useLayoutEffect(() => {
        if (meshRef.current) {
            // Ajuste a 30 grados (puedes modificar este valor: 0, 45, 90, etc., para centrar la mejor vista inicial)
            meshRef.current.rotation.y = THREE.MathUtils.degToRad(30); 
        }
    }, []);

    // Rota lentamente la esfera (auto-rotación sutil)
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.0005; // Ajusta la velocidad de auto-rotación
        }
    });

    return (
        // Creamos una esfera con radio 1.
        <Sphere args={[1, 64, 64]} ref={meshRef}>
            {/* Renderiza el interior de la esfera para el efecto 360° */}
            <meshBasicMaterial 
                map={texture} 
                side={THREE.BackSide} 
            />
        </Sphere>
    );
};


// --- Componente Principal ---
/**
 * Componente principal del Visor 360° (Wrapper de React)
 */
const StablePanoViewerR3F = ({ imageUrl, height = '650px' }) => {
    
    // Usamos la URL de la imagen proporcionada, o una URL de prueba como fallback
    const finalImageUrl = imageUrl || "https://cdn.pannellum.org/2.5/img/alma.jpg"; 

    return (
       
        <div className= "new-stable-viewer-wrapper" style={{ height: height, width: '100%' }}>
            <Canvas 
             
                camera={{ 
                    fov: 75, 
                    near: 0.1, 
                    far: 1000,
            
                    position: [0, 0, 0.1] 
                }}
                dpr={[1, 2]} 
                frameloop="always" 
            >
                {/* Suspense maneja el estado de carga de la textura */}
                <Suspense fallback={null}>
                    <Panorama imageUrl={finalImageUrl} />
                </Suspense>

                {/* 1. CONTROL DE GIROSCOPIO (Móviles) */}
                <DeviceOrientationControls 
                    enableZoom={true} // Deshabilita el zoom para inmersión
                    enableManualZoom={false} 
                />
                
                {/* 2. CONTROL DE CURSOR/DEDO (PC y Arrastre táctil) */}
                <OrbitControls 
                    enableZoom={false} // Deshabilita el zoom
                    enablePan={false} // Deshabilita el movimiento vertical/lateral (solo rotación)
                    enableDamping={true} // Suaviza el movimiento
                    dampingFactor={0.05} 
                />
                
            </Canvas>
            
            {/* CLASE MODIFICADA: new-pano-controls-overlay */}
            <div className="new-pano-controls-overlay">
                 <p>Usa el cursor/dedo para explorar la vista 360°.</p>
            </div>
        </div>
    );
};

export default StablePanoViewerR3F;