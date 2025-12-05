// src/pages/HomePage.jsx
import React from 'react';
// Importamos los componentes de sección que definimos
import HeroSlider from '../components/HeroSlider'; 
import ProjectSummary from '../components/ProjectSummary';
import InteractiveMap from '../components/InteractiveMap';
import PhotoGallery from '../components/PhotoGallery';
import ContactForm from '../components/ContactForm';
import LocationMap from '../components/LocationMap';
import AmenityTrioHero from '../components/AmenityTrioHero';
import LocationAndMap from '../components/LocationAndMap';
import InteractiveMasterPlanMap from '../components/InteractiveMasterPlanMap';
// Importamos el archivo CSS de la página (lo crearemos después)
import './HomePage.css'; 
import OfficeInvitationSection from '../components/OfficeInvitationSection';
import ContactHomePage from '../components/section/ContactHomePage';

const HomePage = () => {
  return (
    <div className="home-page-container">
      {/* 1. SECCIÓN DE PORTADA Y SLIDER */}
      <section id="inicio">
        {/* Componente placeholder: El slider de fotos del proyecto */}
        <HeroSlider /> 
      </section>
<section id="LocationAndMap">
  <LocationAndMap></LocationAndMap> 
  {/* 2. Sección de Amenidades Destacadas (REEMPLAZADA) */}
            <AmenityTrioHero />
</section>            
      
        <ProjectSummary /> 
      

      {/* 3. SECCIÓN DE MAPA INTERACTIVO DE TERRENOS */}
  
 <InteractiveMasterPlanMap />
      {/* 4. SECCIÓN DE GALERÍA DE FOTOS */}
      <section id="galeria">
        {/* Componente placeholder: Cuadrícula de fotos 
        <PhotoGallery />*/}
      </section>
    {/* Componente placeholder: Mapa geográfico (Google Maps) */}
    <section div className="ubicacion-section">  
        <LocationMap /></section>
      {/* 5. SECCIÓN DE CONTACTO RÁPIDO Y UBICACIÓN */}
      <section id="contacto">
        {/* Componente placeholder: Formulario de contacto */}
   <ContactHomePage />
      </section>
 
      {/* Aquí podremos añadir más secciones a medida que el proyecto crezca */}
    </div>
  );
};

export default HomePage;