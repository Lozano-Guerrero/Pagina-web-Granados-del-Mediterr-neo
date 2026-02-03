import React from 'react';
// Visor 360° estable
import StablePanoViewerR3F from '../../components/StablePanoViewerR3F';
import './ComponentLab.css';

import InteractiveMapV2 from '../../components/InteractiveMapV2';
import LocationSectionV2 from '../../components/LocationSectionV2';
import PromoVirtualV2 from '../../components/PromoVirtualV2';
import PlusvaliaDashboard from '../../components/PlusvaliaDashboard';

/**
 * Página de Laboratorio (Sandbox) para probar componentes.
 */
const ComponentLab = () => {

    // Acceso directo a la carpeta public.
    const testImageURL = "/img/360img/lagoon360/CasaLago360.jpg";
    const testImageURL2 = "/img/360img/lagoon360/Fogateros360.jpg";
    return (
        <div className="component-lab-container">
            <h1>✅ Laboratorio de Componentes</h1>
            <p>Sección de pruebas para optimización y nuevos desarrollos.</p>

            {/* ------------------------------------------------ */}
            {/* ## TABLERO DE PLUSVALÍA (V5 - PREMIUM) ## */}
            {/* ------------------------------------------------ */}
            <PlusvaliaDashboard />

            {/* ------------------------------------------------ */}
            {/* ## MAPA INTERACTIVO (V2) ## */}
            {/* ------------------------------------------------ */}
            <section className="test-section" style={{ background: '#fff', padding: '40px', marginBottom: '40px' }}>
                <h2 style={{ color: '#888', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '1rem' }}>
                    Mapa Interactivo: Comparativa Editorial
                </h2>

                <div style={{ marginBottom: '60px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Versión V2 (Optimizada)</h3>
                    <InteractiveMapV2 />
                </div>

                <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '60px 0' }} />

                <div style={{ marginBottom: '60px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Sección de Ubicación (V2)</h3>
                    <LocationSectionV2 />
                </div>

            </section>
            {/* ------------------------------------------------ */}
            {/* ## Sección de Prueba: Visor 360° ## */}
            {/* ------------------------------------------------ */}
            <section className="test-section">
                <h2>1. Visor Panorámico 360°</h2>

                <StablePanoViewerR3F
                    imageUrl={testImageURL}
                    height="650px"
                />
                <br />
                <PromoVirtualV2 />
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
