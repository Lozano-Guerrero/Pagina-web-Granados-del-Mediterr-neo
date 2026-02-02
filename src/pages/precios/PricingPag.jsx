import React, { useEffect, useState } from 'react';
// Asegurarte de que esta ruta sea correcta para tu componente
import PriceGrid from '../../components/PriceGrid';
import './PricingPag.css';
import InteractiveMapV2 from '../../components/InteractiveMapV2.jsx';
import FinancingHighlights from '../../components/FinancingHighlights.jsx';
import PriceEvolutionCard from '../../components/PriceEvolutionCard.jsx';
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
                        <span className="brand-tag">Granados del Mediterráneo</span>
                        <h1>Masterplan y disponibilidad</h1>
                        <p className="subtitle">Explora cada lote, consulta precios actualizados y planes de financiamiento personalizados.</p>

                        <PriceEvolutionCard />

                        <div className="hero-actions-row">
                            <button
                                className="step-nav-btn hero-nav-btn"
                                onClick={() => scrollToSection('precios-por-m2')}
                            >
                                Conocer precios por m²
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                                </svg>
                            </button>

                            <button
                                className="step-nav-btn ghost-nav-btn"
                                onClick={() => scrollToSection('mapa-interactivo')}
                            >
                                Ver mapa interactivo
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(-90deg)' }}>
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="header-image-side">
                        <img src="/img/masterplan-3d.png" alt="Masterplan 3D Granados" className="hero-3d-image" />
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