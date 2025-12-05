// src/pages/ComponentLab.jsx

import React from 'react';
// Importamos el componente de visor estable (Pannellum)
import StablePanoViewerR3F from '../../components/StablePanoViewerR3F';// Asegúrate de que esta ruta sea correcta
import './ComponentLab.css'; 
import PromoVirtual from '../../components/PromoVirtual';

/**
 * Página de Laboratorio (Sandbox) para probar componentes.
 */
const ComponentLab = () => {
    
    // 💡 RUTA CORREGIDA: Acceso directo a la carpeta public.
 const testImageURL = "/img/360img/lagoon360/CasaLago360.jpg";
const testImageURL2 = "/img/360img/lagoon360/Fogateros360.jpg";
    return (
        <div className="component-lab-container">
            <h1>✅ Laboratorio de Componentes (Visor Estable)</h1>
            <p>Componentes individuales para prueba, que posteriormente se agregan en su página correspondiente.</p>

            {/* ------------------------------------------------ */}
            {/* ## Sección de Prueba: Visor 360° (Pannellum) ## */}
            {/* ------------------------------------------------ */}
            <section className="test-section">
                <h2>1. Visor Panorámico 360°</h2>
                
                {/* 🛑 USAMOS EL NUEVO COMPONENTE ESTABLE */}
              <StablePanoViewerR3F 
                    imageUrl={testImageURL}
                    height="650px" 
                />
                <br />
                <PromoVirtual />
                <StablePanoViewerR3F 
                    imageUrl={testImageURL2}
                    height="650px" 
                />
                <p className="test-notes">
                    **Nota:** Si la imagen carga y gira aquí, el problema de compatibilidad ha sido superado.
                </p>
              
            </section>
        </div>
    );
};

export default ComponentLab;