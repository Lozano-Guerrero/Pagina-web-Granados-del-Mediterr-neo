import React, { useEffect, useState } from 'react';
// Asegurarte de que esta ruta sea correcta para tu componente
import PriceGrid from '../../components/PriceGrid';
import './PricingPag.css';
import InteractiveMapV2 from '../../components/InteractiveMapV2.jsx';
import FinancingHighlights from '../../components/FinancingHighlights.jsx';
import SimplePlusvaliaChart from '../../components/SimplePlusvaliaChart.jsx';
import BrochureDownloadButton from '../../components/BrochureDownloadButton.jsx';
import LotTypeCards from '../../components/LotTypeCards.jsx';

// 🛑 RUTA DE IMAGEN: Usa la ruta de tu nuevo mapa de masterplan
const MASTERPLAN_IMAGE = '/img/masterplan.jpg';

const PricingPage = () => {
    // La nota empieza visible para asegurar que se lea, pero el usuario puede ocultarla
    const [isNoteCollapsed, setIsNoteCollapsed] = useState(false);

    // Asegurar que el scroll del body sea fluido y el footer sea visible
    useEffect(() => {
        // Restaurar scroll y aplicar snapping global
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.scrollSnapType = 'y proximity';
        document.documentElement.style.scrollBehavior = 'smooth';

        // Asegurar que el footer sea visible
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'block';

        // Limpieza al desmontar
        return () => {
            document.documentElement.style.scrollSnapType = 'none';
            document.documentElement.style.scrollBehavior = 'auto';
            if (footer) footer.style.display = 'block';
        };
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    return (
        <div className="pricing-page">
            {/* 1. NOTA DISCRETA INTELIGENTE */}
            <div className={`top-discreet-note ${isNoteCollapsed ? 'collapsed' : 'expanded'}`}>
                <div className="note-content">
                    <p>
                        <strong>Nota importante:</strong> Los precios por m² aquí mostrados son precios base y están expresados en pesos mexicanos. La disponibilidad de lotes, así como los precios y condiciones de venta, están sujetos a cambios sin previo aviso. Para recibir un plan de financiamiento personalizado y confirmar existencias, por favor, contacta a un asesor.
                    </p>
                </div>
                <button
                    className="note-toggle-btn"
                    onClick={() => setIsNoteCollapsed(!isNoteCollapsed)}
                    aria-label={isNoteCollapsed ? "Ver nota legal" : "Ocultar nota"}
                >
                    {isNoteCollapsed ? "ⅰ" : "✕"}
                </button>
            </div>

            <header className="pricing-header-v4">
                <div className="header-grid">
                    <div className="header-text-side">
                        <span className="brand-tag" style={{ color: '#b47c7c', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '12px', display: 'block' }}>
                            Granados del Mediterráneo
                        </span>
                        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', fontWeight: '300', margin: '0 0 24px', lineHeight: '1.1', color: '#1a1a1a' }}>
                            Masterplan y <br /> disponibilidad
                        </h1>
                        <p className="subtitle" style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.6', maxWidth: '500px', marginBottom: '40px' }}>
                            Explora cada lote, consulta precios actualizados y planes de financiamiento personalizados.
                        </p>

                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <BrochureDownloadButton
                                text="DESCARGAR BROCHURE"
                                style={{
                                    background: '#b47c7c',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '16px 32px',
                                    borderRadius: '50px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.1em',
                                    boxShadow: '0 10px 25px rgba(180, 124, 124, 0.3)',
                                    transition: 'all 0.3s ease',
                                    minWidth: '220px',
                                    textTransform: 'uppercase'
                                }}
                            />
                            <button
                                onClick={() => scrollToSection('mapa-interactivo')}
                                style={{
                                    background: '#ffffff',
                                    color: '#b47c7c',
                                    border: '2px solid #b47c7c',
                                    padding: '16px 32px',
                                    borderRadius: '50px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.1em',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    minWidth: '180px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                VER LOTES
                            </button>
                        </div>
                    </div>

                    <div className="header-image-side" style={{ display: 'flex', justifyContent: 'center' }}>
                        <SimplePlusvaliaChart hideMilestone={true} />
                    </div>
                </div>
            </header>

            {/* 1.5 TARJETAS DE TIPO (NUEVO REQUERIMIENTO) */}
            <LotTypeCards />

            {/* 4. MAPA (AL FINAL) */}
            <section id="mapa-interactivo" className="map-hero-section map-footer-v2">
                <div className="map-container-v2">
                    <InteractiveMapV2 />
                </div>
            </section>
            {/* 2. TABLA DE PRECIOS */}
            <section id="precios-por-m2" className="prices-table-section">
                <div className="prices-inner-container">
                    <PriceGrid />

                    <div className="section-nav-wrapper">
                        <button
                            className="step-nav-btn"
                            onClick={() => scrollToSection('financiamiento')}
                        >
                            Ver planes de financiamiento
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* 3. MÉTODO DE PAGO */}
            <section id="financiamiento" className='metodosdepago'>
                <FinancingHighlights />

                <div className="section-nav-wrapper">
                    <button
                        className="step-nav-btn"
                        onClick={() => scrollToSection('mapa-interactivo')}
                    >
                        Ir al mapa interactivo
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                        </svg>
                    </button>
                </div>
            </section>


        </div>
    );
};

export default PricingPage;