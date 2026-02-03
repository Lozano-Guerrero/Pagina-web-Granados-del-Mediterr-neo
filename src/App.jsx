// src/App.jsx
import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import HomePage from './pages/HomePage';
import ContactPage from './pages/contacto/ContactPage';
import ProjectInfoPage from './pages/proyecto/ProjectInfoPage';
import PricingPageV2 from './pages/precios/PricingPagV2';
import CasaClubPage from './pages/amenidades/CasaClubPage';
import NotFoundPage from './pages/NotFoundPage';
import ParqueLinealPage from './pages/amenidades/ParqueLinealPage';
import LagoonClubPage from './pages/amenidades/LagoonClubPage';
import GalleryPage from './pages/GalleryPage';
import ComponentLab from './pages/dev/ComponentLab';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="proyecto" element={<ProjectInfoPage />} />
        <Route path="Contacto" element={<ContactPage />} />
        <Route path="precios" element={<PricingPageV2 />} />
        <Route path="galeria" element={<GalleryPage />} />
        <Route path="componentlab" element={<ComponentLab />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
