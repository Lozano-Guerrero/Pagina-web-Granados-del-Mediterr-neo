// src/pages/HomePage.jsx
import React from 'react';
import HeroSlider from '../components/HeroSlider';
import ProjectSummaryV2 from '../components/ProjectSummaryV2';
import LocationMap from '../components/LocationMap';
import LocationSectionV2 from '../components/LocationSectionV2';
import AmenityTrioHero from '../components/AmenityTrioHero';
import InteractiveMasterPlanMapV2 from '../components/InteractiveMasterPlanMapV2';
import './HomePage.css';
import ContactHomePage from '../components/section/ContactHomePage';
import FinancingHighlights from '../components/FinancingHighlights';

const HomePage = () => {
  return (
    <div className="home-page-container">
      <section id="inicio">
        <HeroSlider />
      </section>
      <section id="LocationAndMap">
        <LocationSectionV2 />
        <AmenityTrioHero />
      </section>

      <ProjectSummaryV2 />

      <InteractiveMasterPlanMapV2 />
      <section id="galeria">
        {/* Sección reservada para galería */}
      </section>
      <section id="metodosdepago">
        <FinancingHighlights />
      </section>
      <section className="ubicacion-section">
        <LocationMap />
      </section>
      <section id="contacto">
        <ContactHomePage />
      </section>
    </div>
  );
};

export default HomePage;
