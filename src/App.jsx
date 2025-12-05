// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Importamos todas las páginas
import HomePage from './pages/HomePage';
import ContactPage from './pages/contacto/ContactPage';
import ProjectInfoPage from './pages/proyecto/ProjectInfoPage';
// NUEVA IMPORTACIÓN
import PricingPage from './pages/precios/PricingPag';
import PhotoGallery from './components/PhotoGallery';
import CasaClubPage from './pages/amenidades/CasaClubPage';
import NotFoundPage from './pages/NotFoundPage';
import ParqueLinealPage from './pages/amenidades/ParqueLinealPage';

import LagoonClubPage from './pages/amenidades/LagoonClubPage';
import GallerySection from './components/GallerySection';
import GalleryPage from './pages/GalleryPage';
import ScrollToTop from './components/ScrollToTop';
import ComponentLab from './pages/dev/ComponentLab';

function App() {
  return (
    <Routes>
    
      {/* El MainLayout contiene el Navbar y Footer y permanece fijo. */}
      <Route path="/" element={<MainLayout />}>
        
        {/* HOME (Ruta principal) */}
        <Route index element={<HomePage />} />
        
        {/* PÁGINAS DE NAVEGACIÓN PRINCIPAL */}
        {/* Ruta: /proyecto */}
        <Route path="proyecto" element={<ProjectInfoPage />} />
        {/* Ruta: /contacto */}
        <Route path="Contacto" element={<ContactPage />} />
        {/* NUEVA RUTA: /precios */}
        <Route path="precios" element={<PricingPage />} />
        {/* NUEVA RUTA: /galeria */}
        <Route path="galeria" element={<GalleryPage/>} />
        <Route path="componentlab" element={<ComponentLab/>} />
{/* 🛑 NUEVA RUTA DE AMENIDAD */}
        <Route 
            path="/amenidades/casa-club" 
            element={<CasaClubPage />} 
        />
        <Route 
            path="/amenidades/parque-lineal" 
            element={<ParqueLinealPage />} 
        />
        <Route 
            path="/amenidades/lagoon-club" 
            element={<LagoonClubPage />} 
        />
        
        {/* 🛑 OPCIONAL: Si quieres una página general de Amenidades */}
        {/* <Route path="/amenidades" element={<AmenidadesIndexPage />} /> */}
       {/* 🛑 Ruta 404: siempre al final para capturar rutas no coincidentes */}
                <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;