// src/layouts/NavbarV2.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavbarV2.css';

// Importaciones de Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

import Logo from '../assets/logo.png';

const NavbarV2 = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const location = useLocation();
    const headerRef = useRef(null);

    // Efecto de scroll para el Navbar
    useEffect(() => {
        const handleScroll = () => {
            // Estado scrolled
            setScrolled(window.scrollY > 50);

            // Progreso de scroll
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolledProgress = (winScroll / height) * 100;
            setScrollProgress(scrolledProgress);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Exporta la altura real del navbar como CSS variable para que otros sticky elements
    // (ej. la nota superior en /precios) se peguen exactamente debajo del navbar,
    // incluso cuando cambia de tamaño por el estado "scrolled".
    useEffect(() => {
        const el = headerRef.current;
        if (!el || typeof window === 'undefined') return undefined;

        const root = document.documentElement;
        const setVar = () => {
            try {
                const h = Math.ceil(el.getBoundingClientRect().height || 0);
                root.style.setProperty('--navbar-v2-height', `${h}px`);
            } catch {
                // ignore
            }
        };

        setVar();

        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => setVar());
            ro.observe(el);
        }

        return () => {
            try {
                ro?.disconnect?.();
            } catch {
                // ignore
            }
        };
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        // Bloquear scroll si el menú está abierto
        document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        document.body.style.overflow = 'auto';
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';
    const isBrokersActive = location.pathname.startsWith('/brokers');
    const isHomePage = location.pathname === '/';

    return (
        <header
            ref={headerRef}
            className={`navbar-v2 ${scrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''} ${isHomePage ? 'on-home' : 'on-other'}`}
        >
            {/* Barra de Progreso */}
            <div
                className="scroll-progress-bar-v2"
                style={{ width: `${scrollProgress}%` }}
            ></div>

            <div className="navbar-inner-v2">
                {/* 1. Logo */}
                <div className="navbar-logo-v2">
                    <Link to="/" onClick={closeMenu}>
                        <img src={Logo} alt="Logo Granados" className="logo-img-v2" />
                    </Link>
                </div>

                {/* 2. Menú de Navegación (Desktop) */}
                <nav className="navbar-desktop-nav-v2">
                    <ul className="nav-links-v2">
                        <li><Link to="/" className={isActive('/')}>Inicio</Link></li>
                        <li><Link to="/proyecto" className={isActive('/proyecto')}>Proyecto y Amenidades</Link></li>
                        <li><Link to="/precios" className={isActive('/precios')}>Precios y Disponibilidad</Link></li>
                        <li><Link to="/galeria" className={isActive('/galeria')}>Galería</Link></li>
                        <li><Link to="/brokers" className={isBrokersActive ? 'active' : ''}>Acceso Brokers</Link></li>
                        <li><Link to="/Contacto" className={isActive('/Contacto')}>Contacto</Link></li>
                    </ul>
                </nav>

                {/* 3. Acciones / RRSS / CTA */}
                <div className="navbar-actions-v2">
                    <div className="social-links-v2">
                        <a href="https://www.facebook.com/profile.php?id=61581870316206" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faFacebookF} /></a>
                        <a href="https://www.instagram.com/granadosmediterraneo/" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faInstagram} /></a>
                        <a href="https://wa.me/528123852034" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faWhatsapp} /></a>
                    </div>
                    <Link to="/precios" className="nav-cta-v2">
                        Reservar Lote
                    </Link>

                    {/* Botón de Menú Móvil (Animated Hamburger) */}
                    <button className={`mobile-toggle-v2 ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                        <span className="bar-v2"></span>
                        <span className="bar-v2"></span>
                        <span className="bar-v2"></span>
                    </button>
                </div>
            </div>

            {/* 4. Menú Móvil Fullscreen */}
            <div className={`mobile-overlay-v2 ${isMenuOpen ? 'open' : ''}`}>
                <nav className="mobile-nav-content-v2">
                    <ul className="mobile-links-v2">
                        <li><Link to="/" onClick={closeMenu} className={isActive('/')}>Inicio</Link></li>
                        <li><Link to="/proyecto" onClick={closeMenu} className={isActive('/proyecto')}>Proyecto y Amenidades</Link></li>
                        <li><Link to="/precios" onClick={closeMenu} className={isActive('/precios')}>Disponibilidad y Precios</Link></li>
                        <li><Link to="/galeria" onClick={closeMenu} className={isActive('/galeria')}>Galería de Fotos</Link></li>
                        <li><Link to="/brokers" onClick={closeMenu} className={isBrokersActive ? 'active' : ''}>Acceso Brokers</Link></li>
                        <li><Link to="/Contacto" onClick={closeMenu} className={isActive('/Contacto')}>Contacto</Link></li>
                    </ul>
                    <div className="mobile-footer-v2">
                        <p>Síguenos en nuestras redes</p>
                        <div className="mobile-social-v2">
                            <a href="https://www.facebook.com/profile.php?id=61581870316206" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faFacebookF} /></a>
                            <a href="https://www.instagram.com/granadosmediterraneo/" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faInstagram} /></a>
                            <a href="https://wa.me/528123852034" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faWhatsapp} /></a>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default NavbarV2;
