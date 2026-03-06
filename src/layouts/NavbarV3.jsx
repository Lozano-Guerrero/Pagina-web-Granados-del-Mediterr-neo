import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import Logo from '../assets/logo.png'; // Asegúrate de que la ruta de tu logo sea correcta
import './NavbarV3.css';

const NavbarV3 = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isLightSection, setIsLightSection] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Determina si estamos en la página de inicio (raíz)
    const isHome = location.pathname === '/';

    useEffect(() => {
        // 1. Detectar Scroll para activar el Glassmorphism
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        // 2. Detectar si el fondo es blanco para cambiar los colores
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsLightSection(entry.isIntersecting);
            },
            {
                rootMargin: "-80px 0px 0px 0px", // Detecta justo debajo del navbar
                threshold: 0
            }
        );

        // Observamos todas las secciones que tengan la clase 'js-light-section'
        const lightSections = document.querySelectorAll('.js-light-section');
        lightSections.forEach(section => observer.observe(section));

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            lightSections.forEach(section => observer.unobserve(section));
        };
    }, []);

    // Función para cerrar el menú al hacer clic en un enlace (Móvil)
    const closeMenu = () => setIsMenuOpen(false);

    // Función para manejar clics en anclas (hash links)
    const handleNavClick = (e, hashId) => {
        e.preventDefault();
        closeMenu();
        if (isHome) {
            // Si estamos en inicio, hacer scroll suave al id
            const target = document.getElementById(hashId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Si estamos en otra página, navega a Inicio con el hash
            navigate(`/#${hashId}`);
        }
    };

    // Forzar apariencia sólida/clara si no estamos en inicio para evitar que desaparezca
    const isSolid = !isHome || scrolled;
    const isLightText = !isHome || isLightSection;

    return (
        <header
            className={`navbar-v3-container 
                ${isSolid ? 'scrolled' : ''} 
                ${isLightText ? 'light-mode' : 'dark-mode'} 
                ${isMenuOpen ? 'menu-open' : ''}`}
        >
            <div className="navbar-v3-inner">

                {/* Lado Izquierdo: Logo */}
                <div className="navbar-v3-logo">
                    <Link to="/v2" onClick={closeMenu} className="logo-link">
                        <img src={Logo} alt="Granados del Mediterráneo" className="logo-img-v3" />
                    </Link>
                </div>

                {/* Centro / Menú Completo (Desktop & Mobile) */}
                <nav className={`navbar-v3-menu ${isMenuOpen ? 'open' : ''}`}>
                    <ul className="navbar-v3-links">
                        <li><Link to="/" onClick={closeMenu}>Inicio</Link></li>
                        <li><a href="#amenidades" onClick={(e) => handleNavClick(e, 'amenidades')}>Amenidades</a></li>
                        <li><Link to="/precios" onClick={closeMenu}>Master plan</Link></li>
                        <li><Link to="/galeria" onClick={closeMenu}>Galería</Link></li>
                        <li><Link to="/brokers" onClick={closeMenu}>Portal</Link></li>
                        <li><Link to="/Contacto" onClick={closeMenu}>Contacto</Link></li>
                    </ul>

                    {/* Redes Sociales MÓVIL (Botones circulares) */}
                    <div className="mobile-social-container">
                        <a href="https://www.instagram.com/granadosmediterraneo/" target="_blank" rel="noreferrer" aria-label="Instagram">
                            <FontAwesomeIcon icon={faInstagram} />
                        </a>
                        <a href="https://wa.me/528123852034?text=" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                            <FontAwesomeIcon icon={faWhatsapp} />
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61581870316206" target="_blank" rel="noreferrer" aria-label="Facebook">
                            <FontAwesomeIcon icon={faFacebookF} />
                        </a>
                    </div>
                </nav>

                {/* Lado Derecho: Redes Sociales DESKTOP */}
                <div className="navbar-v3-social-desktop">
                    <a href="https://www.instagram.com/granadosmediterraneo/" target="_blank" rel="noreferrer" className="social-icon-v3" aria-label="Instagram">
                        <FontAwesomeIcon icon={faInstagram} />
                    </a>
                    <a href="https://wa.me/528123852034?text=" target="_blank" rel="noreferrer" className="social-icon-v3" aria-label="WhatsApp">
                        <FontAwesomeIcon icon={faWhatsapp} />
                    </a>
                    <a href="https://www.facebook.com/profile.php?id=61581870316206" target="_blank" rel="noreferrer" className="social-icon-v3" aria-label="Facebook">
                        <FontAwesomeIcon icon={faFacebookF} />
                    </a>
                </div>

                {/* Botón Hamburguesa MÓVIL */}
                <button
                    className="menu-toggle-v3"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Abrir o cerrar menú"
                >
                    <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
                </button>

            </div>
        </header>
    );
};

export default NavbarV3;