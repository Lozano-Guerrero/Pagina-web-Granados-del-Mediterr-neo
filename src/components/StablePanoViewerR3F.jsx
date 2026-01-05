// src/components/StablePanoViewerR3F.jsx

import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three'; 
// ¡Asegúrate de cambiar el nombre del archivo CSS si lo renombraste!
import './StablePanoViewerR3F.css'; 

// Custom hook to load texture without drei
const useTexture = (url) => {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (loadedTexture) => {
      loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
      setTexture(loadedTexture);
    });
  }, [url]);

  return texture;
};

// --- Componente de la Escena 3D ---
/**
 * Componente 3D que proyecta la imagen 360° en una esfera.
 */
const Panorama = ({ imageUrl }) => {
   
    // Carga la textura desde la URL
    const texture = useTexture(imageUrl);
   
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

    if (!texture) return null;

    return (
        // Creamos una esfera con radio 1.
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 64, 64]} />
            {/* Renderiza el interior de la esfera para el efecto 360° */}
            <meshBasicMaterial 
                map={texture} 
                side={THREE.BackSide} 
            />
        </mesh>
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

               {/* Controles removidos temporalmente para evitar dependencias de drei */}
               
           </Canvas>
           
           {/* CLASE MODIFICADA: new-pano-controls-overlay */}
           <div className="new-pano-controls-overlay">
                <p>Usa el cursor/dedo para explorar la vista 360°.</p>
           </div>
       </div>
    );
};

export default StablePanoViewerR3F;