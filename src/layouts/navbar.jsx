// src/layouts/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

// Importaciones de Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons'; // Importamos los iconos específicos

import Logo from '../assets/logo.png'; 

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
      if (isMenuOpen) {
          setIsMenuOpen(false);
      }
  };

  return (
    <header className="navbar-container">
      
      {/* 1. Botón de Toggle (☰ / ×) */}
      <button className="menu-toggle" onClick={toggleMenu} aria-label="Abrir/Cerrar menú">
        {isMenuOpen ? '×' : '☰'}
      </button>

      {/* 2. Logo */}
      <div className="navbar-logo">
        <Link to="/" onClick={closeMenu}>
          <img src={Logo} alt="Logo Granados del Mediterráneo" className="logo-img" />
        </Link>
      </div>

      {/* 3. Menú de Navegación */}
      <nav className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
        <ul className="navbar-links">
          {/* ... Enlaces de Navegación ... */}
          <li><Link to="/" onClick={closeMenu}>Inicio</Link></li>
          <li><Link to="/proyecto" onClick={closeMenu}>Proyecto y Amenidades</Link></li>
          <li><Link to="/precios" onClick={closeMenu}>Disponibilidad y Precios</Link></li>
          <li><Link to="/galeria" onClick={closeMenu}>Galería</Link></li>
           <li><Link to="/Contacto" onClick={closeMenu}>Contacto</Link></li>
        </ul>
        
        {/* Iconos de Redes Sociales (Móvil) */}
        <div className="mobile-social-icons"> 
            <p>Síguenos:</p>
            <div className="social-icon-links">
                {/* Íconos de Font Awesome */}
                <a href="https://www.facebook.com/profile.php?id=61581870316206" target="_blank" aria-label="Facebook"><FontAwesomeIcon icon={faFacebookF} className="social-icon" /></a>
                <a href="https://www.instagram.com/granadosmediterraneo/" target="_blank" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} className="social-icon" /></a>
                <a href="https://wa.me/528123852034?text=" target="_blank" aria-label="WhatsApp"><FontAwesomeIcon icon={faWhatsapp} className="social-icon" /></a>
            </div>
            <Link to="/contacto" className="contact-button" onClick={closeMenu}>
              Contáctanos
            </Link>
        </div>
      </nav>

      {/* 4. Iconos de Redes Sociales (Escritorio) */}
      <div className="navbar-social-desktop">
        {/* Íconos de Font Awesome */}
        <a href="https://www.facebook.com/profile.php?id=61581870316206" target="_blank" aria-label="Facebook"><FontAwesomeIcon icon={faFacebookF} className="social-icon" /></a>
        <a href="https://www.instagram.com/granadosmediterraneo/" target="_blank" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} className="social-icon" /></a>
        <a href="https://wa.me/528123852034?text=" target="_blank" aria-label="WhatsApp"><FontAwesomeIcon icon={faWhatsapp} className="social-icon" /></a>
      </div>
    </header>
  );
};

export default Navbar;