
import React, { useState, useEffect } from 'react';
import './ComponentLab.css';

// Components
import SimplePlusvaliaChart from '../../components/SimplePlusvaliaChart';
import BrochureDownloadButton from '../../components/BrochureDownloadButton';
import InteractiveMapV2 from '../../components/InteractiveMapV2.jsx';
import {
    PlusvaliaGlass,
    PlusvaliaMinimal,
    PlusvaliaPro,
    PlusvaliaDarkTech,
    PlusvaliaOrganic,
    PlusvaliaPremiumCard,
    Plusvalia3D
} from '../../components/PlusvaliaVariants';

/**
 * Página de Laboratorio (Sandbox) para probar componentes.
 */
const ComponentLab = () => {
    const [tick, setTick] = useState(0);

    // Bucle de reinvicio de animaciones cada 30 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const scrollToMap = () => {
        const element = document.getElementById('mapa-interactivo');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="component-lab-container">
            <h1 style={{ textAlign: 'center', marginTop: '40px' }}>✅ Laboratorio de UI: Plusvalía</h1>

            {/* ------------------------------------------------ */}
            {/* ## PROPUSETA HERO: TEXTO + GRÁFICA ORIGINAL ## */}
            {/* ------------------------------------------------ */}
            <header className="pricing-header-v4" style={{ background: '#f7f7f5', padding: '100px 40px', width: '100%', marginBottom: '60px' }}>
                <div className="header-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', maxWidth: '1600px', margin: '0 auto' }}>

                    <div className="header-text-side">
                        <span className="brand-tag" style={{ color: '#b47c7c', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '12px', display: 'block' }}>
                            Granados del Mediterráneo
                        </span>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 5.5rem)', fontWeight: '300', margin: '0 0 24px', lineHeight: '1.1' }}>
                            Masterplan y <br /> disponibilidad
                        </h1>
                        <p className="subtitle" style={{ fontSize: '1.2rem', color: '#666', lineHeight: '1.6', maxWidth: '500px' }}>
                            Explora cada lote, consulta precios actualizados y planes de financiamiento personalizados.
                        </p>

                        <div style={{ marginTop: '40px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <BrochureDownloadButton
                                text="DESCARGAR BROCHURE"
                                style={{
                                    background: '#b47c7c',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '18px 35px',
                                    borderRadius: '50px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.1em',
                                    boxShadow: '0 10px 30px rgba(180, 124, 124, 0.4)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    minWidth: '220px',
                                    textTransform: 'uppercase'
                                }}
                            />
                            <button
                                onClick={scrollToMap}
                                style={{
                                    background: '#ffffff',
                                    color: '#b47c7c',
                                    border: '2px solid #b47c7c',
                                    padding: '18px 35px',
                                    borderRadius: '50px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.1em',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                    minWidth: '200px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                VER LOTES
                            </button>
                        </div>
                    </div>

                    <div className="header-image-side" key={`hero-${tick}`} style={{ display: 'flex', justifyContent: 'center' }}>
                        <SimplePlusvaliaChart hideMilestone={true} />
                    </div>
                </div>
            </header>

            {/* ------------------------------------------------ */}
            {/* ## GRID DE COMPARATIVA: 8 VARIANTES (4 COLUMNAS) ## */}
            {/* ------------------------------------------------ */}
            <section style={{ padding: '80px 40px', background: '#fff' }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1a1a1a' }}>Comparativa Editorial de Gráficas</h2>
                        <p style={{ color: '#888', fontSize: '1.1rem' }}>Reinicio de animaciones automático: 1 cada min.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '30px',
                    }} key={`grid-${tick}`}>

                        {/* Fila 1 */}
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>01. PROFESIONAL PRO</p>
                            <PlusvaliaPro />
                        </div>
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>02. GLASMORFISMO</p>
                            <PlusvaliaGlass />
                        </div>
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>03. DARK TECH</p>
                            <PlusvaliaDarkTech />
                        </div>
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>04. ORGANIC / NATURAL</p>
                            <PlusvaliaOrganic />
                        </div>

                        {/* Fila 2 */}
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>05. PREMIUM CARD</p>
                            <PlusvaliaPremiumCard />
                        </div>
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>06. ISOMÉTRICO 3D</p>
                            <Plusvalia3D />
                        </div>
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>07. MINIMALISTA</p>
                            <PlusvaliaMinimal />
                        </div>
                        <div className="v-card" style={{ padding: '10px', background: '#f9f9f9', borderRadius: '24px' }}>
                            <p style={{ fontSize: '0.7rem', color: '#aaa', margin: '0 0 10px 10px' }}>08. ORIGINAL V2</p>
                            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                                <SimplePlusvaliaChart />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ */}
            {/* ## SECCIÓN DE MAPA INTERACTIVO ## */}
            {/* ------------------------------------------------ */}
            <section id="mapa-interactivo" style={{ padding: '80px 40px', background: '#fcfcfc' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Masterplan Interactivo</h2>
                        <p style={{ color: '#666' }}>Consulta la disponibilidad y ubicación de cada lote en tiempo real.</p>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '32px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                        <InteractiveMapV2 />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ComponentLab;
