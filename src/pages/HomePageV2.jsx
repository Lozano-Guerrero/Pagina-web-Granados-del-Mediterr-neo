// src/pages/HomePageV2.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NavbarV3 from '../layouts/NavbarV3';
import HeroStaticV2 from '../components/HeroStaticV2';
import AmenityTrioHero from '../components/AmenityTrioHero';
import CostSection from '../components/ProjectSummaryV2'; // Asumimos esta para 'Atributos'
import InteractiveMasterPlanMapV2 from '../components/InteractiveMasterPlanMapV2';
import FinancingHighlights from '../components/FinancingHighlights';
import LocationMap from '../components/LocationMap';
import AttributesGridV2 from '../components/AttributesGridV2';
import AmenitiesCardsV2 from '../components/AmenitiesCardsV2';
import MasterplanFinancingV2 from '../components/MasterplanFinancingV2';
import RefugeBannerV2 from '../components/RefugeBannerV2';
import ContactSectionV2 from '../components/ContactSectionV2';
import './HomePageV2.css';

const HomePageV2 = () => {
    const location = useLocation();

    // Efecto para auto-scroll si venimos desde otra página con un #hash
    useEffect(() => {
        if (location.hash) {
            // Un pequeño tiempo de espera para asegurar que la página y las fuentes carguen
            setTimeout(() => {
                const element = document.getElementById(location.hash.substring(1));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        }
    }, [location]);

    return (
        <div className="home-page-v2-container">
            {/* 1. Nuevo Navbar Transparente / Glass */}
            <NavbarV3 />

            {/* 2. Hero Section Estática */}
            <section id="inicio-v2" className="hero-section-v2">
                <HeroStaticV2 />
            </section>

            {/* 3. Banner Informativo - Club Residencial Campestre */}
            <section className="attributes-banner-v2">
                <div className="attributes-banner-content-v2">
                    <h2 className="banner-title-sitka-v2">Club Residencial Campestre: Un Lienzo para Construir tu Legado.</h2>
                    <p className="banner-subtitle-swis-v2">Granados del Mediterráneo combina la serenidad del campo y la infraestructura urbana que tu familia merece, con opciones flexibles diseñadas para asegurar tu patrimonio sin comprometer tu liquidez.</p>
                </div>
            </section>

            {/* 4. Grid de Atributos (Cards con Iconos) */}
            <AttributesGridV2 />

            {/* 5. Conoce Nuestras Amenidades (Cards Estilo Apple Dark) */}
            <AmenitiesCardsV2 />

            {/* 6. Nuevo Master Plan y Financiamiento Unificado (V2) */}
            <MasterplanFinancingV2 />

            {/* Componentes Originales Ocultos / Reemplazados */}
            {/* <InteractiveMasterPlanMapV2 /> */}
            {/* <section id="metodosdepago-v2">
                <FinancingHighlights />
            </section> */}

            {/* 6. Granados del Mediterraneo Banner (Un Refugio V2) */}
            <RefugeBannerV2 />

            {/* 7. Ubicación */}
            <section className="ubicacion-section-v2">
                <div className="grid-ubicacion-v2">
                    <div className="ubicacion-text-v2">
                        <h2>Ubicación<br />Estratégica</h2>
                        <p>Granados del Mediterráneo se encuentra en Montemorelos, Nuevo León...</p>
                    </div>
                    <div className="ubicacion-map-v2">
                        <LocationMap />
                    </div>
                </div>
            </section>

            {/* 8. Contacto Footer (V2) */}
            <ContactSectionV2 />

        </div>
    );
};

export default HomePageV2;
