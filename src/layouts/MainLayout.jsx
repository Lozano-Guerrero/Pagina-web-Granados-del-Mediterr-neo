// src/layouts/MainLayout.jsx
import React from 'react';
// Outlet es el placeholder donde React Router inyecta la página actual
import { Outlet } from 'react-router-dom'; 
// Importamos el Navbar para que sea visible en todas las páginas
import Navbar from './navbar'; 
// Importamos el Footer (asumiendo que tiene un placeholder)
import Footer from './Footer'; 
import ScrollToTop from '../components/ScrollToTop';

const MainLayout = () => {
  return (
    <div className="main-layout-wrapper">
      {/* El Navbar siempre se mostrará */}
      <ScrollToTop />
      <Navbar />

      {/* El contenido específico de la página (HomePage, ContactPage, etc.)
          se renderiza donde está <Outlet /> */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* El Footer también se mostrará siempre */}
      <Footer /> 
    </div>
  );
};

export default MainLayout;