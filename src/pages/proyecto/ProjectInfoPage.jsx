// src/pages/proyecto/ProjectInfoPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHouseChimney, 
    faPaintBrush, 
    faTree, 
    faMoneyBillWave,
    faEnvelope, 
    faPhone, 
    faSeedling // Ícono del CTA
} from "@fortawesome/free-solid-svg-icons"; 
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Importaciones de Componentes
import FeatureCard from "../../components/FeatureCard";
import InvestmentOverview from "../../components/InvestmentOverview";
import AmenityCard from "../../components/AmenityCard"; 
import ArchitecturalVision from "../../components/ArchitecturalVision"; 
import InteractiveMasterPlanMap from '../../components/InteractiveMasterPlanMap';
import BrochureDownloadButton from '../../components/BrochureDownloadButton';
import PromoVirtual from '../../components/PromoVirtual';

import "./ProjectInfoPage.css"; 

// --- CONSTANTES GLOBALES (CORRECCIÓN DE ERRORES DE REFERENCIA) ---
const HERO_IMAGE = '/img/hero-granados.jpg'; 
const LAGOON_IMAGE = '/img/amenidades/lagoon_club/lagoclubaerea.jpg';
const CLUB_IMAGE = '/img/hero-granados.jpg'; 
const PARKING_IMAGE = '/img/amenidades/parque_lineal/jardin.jpg'; 

const PHONE = "+52 81 1234 5678";
const EMAIL = "contacto@granadosdelmediterraneo.com";
const WHATSAPP_LINK = "https://wa.me/528112345678"; 
// -----------------------------------------------------------------

const ProjectInfoPage = () => {
    return (
        <div className="project-info-page">
        
            {/* 1. Project Hero (Banner Principal) */}
            <section className="project-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
                <div className="hero-content">
                    <h1 className="hero-title">Granados del Mediterráneo</h1>
                    <p className="hero-tagline">Club Residencial Campestre: Un Lienzo para Construir tu Legado.</p>
                    
                    <BrochureDownloadButton 
                        className="hero-cta-button" 
                        text="Descargar Brochure"
                    />
                </div>
            </section>

            <section>
                <InteractiveMasterPlanMap/> 
            </section>
            
            <PromoVirtual />
            
            {/* 2. Value Proposition (Propuesta de Valor) */}
            <section className="value-proposition-section">
                <div className="info-inner-container2">
                    <h2 className="section-heading">Nuestro Concepto Integral</h2>
                    <p className="section-subheading">Más que un fraccionamiento, es un estilo de vida que eleva tu patrimonio y bienestar.</p>
                    
                    <div className="feature-cards-grid">
                        <FeatureCard 
                            icon={faPaintBrush} 
                            title="Arquitectura Mediterránea" 
                            description="Diseño de calidez que fusiona las vistas de la Sierra Madre con el lujo campestre."
                        />
                        <FeatureCard 
                            icon={faTree}
                            title="Más de 40 Amenidades" 
                            description="Espacios diseñados para el disfrute familiar, desde el Lagoon Club hasta la Casa del Árbol."
                        />
                        <FeatureCard 
                            icon={faMoneyBillWave}
                            title="Inversión y Plusvalía" 
                            description="Lotes proyectados como el punto de partida para una propuesta arquitectónica de alto valor."
                        />
                        <FeatureCard 
                            icon={faHouseChimney}
                            title="Ubicación Estratégica" 
                            description="A solo 2.5 km de Carretera Nacional en Montemorelos, con rápido acceso a la zona centro y servicios."
                        />
                    </div>
                </div>
            </section>
            
            {/* 3. Amenity Highlights (Amenidades Destacadas) */}
            <section className="amenity-highlights-section">
                <div className="info-inner-container">
                    <h2 className="section-heading">Nuestras Amenidades Estelares</h2>
                    <p className="section-subheading">Dos Clubes exclusivos diseñados para el bienestar y la recreación familiar.</p>
                    
                    <AmenityCard 
                        title="Casa Club Principal" 
                        description="El corazón del desarrollo. Este espacio arquitectónico con estilo mediterráneo alberga la alberca, gimnasio, salón de eventos y áreas de recreación social y familiar."
                        imageUrl={CLUB_IMAGE}
                        linkUrl="/amenidades/casa-club"
                        isReversed={true}
                    />
                    <AmenityCard 
                        title="Parque Central y Áreas Verdes" 
                        description="Espacios diseñados para la convivencia familiar y el contacto con la naturaleza, incluyendo áreas de picnic, juegos infantiles y senderos ecológicos."
                        imageUrl={PARKING_IMAGE}
                        linkUrl="/amenidades/parque-lineal"
                        isReversed={false}
                    />
                    <AmenityCard 
                        title="Lagoon Club y Playa Privada" 
                        description="Disfruta de la vida de playa sin salir del club. Nuestro Lagoon Club ofrece una laguna cristalina, área de asadores, fogateros y canchas de arena."
                        imageUrl={LAGOON_IMAGE}
                        linkUrl="/amenidades/lagoon-club"
                        isReversed={true}
                    />
                    
                </div>
            </section>
            
            {/* 6. Contact CTA (Llamada a la Acción) */}
            <section className="SHP-cta-rich-section">
                <div className="SHP-cta-inner-container">
                    
                    {/* Ícono Grande de Impacto (ej. Semilla o Casa) */}
                    <FontAwesomeIcon icon={faSeedling} className="SHP-cta-main-icon" />

                    {/* Contenido Principal */}
                    <div className="SHP-cta-content-box">
                        <h2 className="SHP-cta-title">
                            Tu Legado Comienza Hoy: Asegura tu Lote
                        </h2>
                        <p className="SHP-cta-subtitle">
                            Contacta a un asesor experto para recibir el catálogo completo, la disponibilidad de lotes actual y un plan de financiamiento adaptado a tus metas.
                        </p>
                        
                        {/* Botón Principal (Llamada a la Acción) */}
                        <Link to="/contacto" className="SHP-cta-main-button">
                            <FontAwesomeIcon icon={faEnvelope} /> Agendar Asesoría Personalizada
                        </Link>
                    </div>
                    
                    {/* Vías de Contacto Rápido */}
                    <div className="SHP-cta-quick-contact">
                        <p className="SHP-contact-label">¿Necesitas una respuesta inmediata?</p>
                        <div className="SHP-contact-links-group">
                            
                            {/* WhatsApp */}
                            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="SHP-contact-link SHP-whatsapp">
                                <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp: {PHONE}
                            </a>
                            
                            {/* Llamada */}
                            <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="SHP-contact-link SHP-phone">
                                <FontAwesomeIcon icon={faPhone} /> Llamar Ahora
                            </a>
                        </div>
                    </div>

                </div>
            </section>

        </div>
    );
};

export default ProjectInfoPage;