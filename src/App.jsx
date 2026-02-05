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
import BrokerLoginPage from './pages/brokers/BrokerLoginPage';
import BrokerDashboard from './pages/brokers/BrokerDashboard';
import BrokerLeadsPage from './pages/brokers/BrokerLeadsPage';
import InmoDashboard from './pages/brokers/InmoDashboard';
import BrokerProtectedRoute from './components/BrokerProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminPage from './pages/admin/AdminPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="proyecto" element={<ProjectInfoPage />} />
        <Route path="Contacto" element={<ContactPage />} />
        <Route path="precios" element={<PricingPageV2 />} />
        <Route path="galeria" element={<GalleryPage />} />
        <Route path="brokers" element={<BrokerLoginPage />} />
        <Route
          path="brokers/dashboard"
          element={(
            <BrokerProtectedRoute allowedRoles={['broker']}>
              <BrokerDashboard />
            </BrokerProtectedRoute>
          )}
        />
        <Route
          path="brokers/inmobiliaria"
          element={(
            <BrokerProtectedRoute allowedRoles={['inmobiliaria']}>
              <InmoDashboard />
            </BrokerProtectedRoute>
          )}
        />
        <Route
          path="brokers/leads"
          element={(
            <BrokerProtectedRoute allowedRoles={['broker', 'inmobiliaria']}>
              <BrokerLeadsPage />
            </BrokerProtectedRoute>
          )}
        />
        <Route
          path="brokers/cotizador"
          element={(
            <BrokerProtectedRoute allowedRoles={['broker', 'inmobiliaria']}>
              <PricingPageV2 enableCotizador={true} />
            </BrokerProtectedRoute>
          )}
        />
        <Route
          path="admin"
          element={(
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          )}
        />
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
