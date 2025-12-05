// src/pages/amenidades/CasaClubPage.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    // Íconos para la Casa Club
    faSwimmer, faChild, faBath, faCocktail, faUtensils, faCoffee, faTree, faKey, faFire,         
    faBowlingBall, faTableTennis, faHeadphones, faTv,           
    faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

// 🛑 Importación de componentes y datos para el Slider
import AmenitySlider from '../../components/AmenitySlider'; 
import { CasaClubImages } from '../../data/amenityImages'; 
import StablePanoViewerR3F from '../../components/StablePanoViewerR3F';
import './CasaClubPage.css';

// RUTAS DE IMAGENES FIJAS
const HERO_IMAGE = '/img/amenidades/casaclubasador.jpeg';
const CASA_CLUB_INTRO_IMAGE = '/img/amenidades/casaclubasador.jpeg'; 
const PLAY_CLUB_IMAGE = '/img/amenidades/lagoon-club.jpg'; 
 const testImageURL = "/img/360img/casa360/Lounge360.webp";
    const testImageURL2 = "/img/360img/casa360/Playroom360.jpg";
    const testImageURL3 = "/img/360img/casa360/baños360.jpg";
// Facilidades de la Casa Club y Play Club
const CLUB_FEATURES = [
    { icon: faSwimmer, text: 'Alberca' },
    { icon: faSwimmer, text: 'Carril de Nado' },
    { icon: faFire, text: 'Fogatero (Área de Alberca)' }, 
    { icon: faBath, text: 'Jacuzzi' }, 
    { icon: faChild, text: 'Chapoteadero' },
    { icon: faCoffee, text: 'Área Lounge.' }, 
    { icon: faBath, text: 'Sauna y Vapor (Áreas independientes)' }, 
    { icon: faCocktail, text: 'Área de Bar para celebrar.' },
    { icon: faUtensils, text: 'Área de Asadores.' }, 
    { icon: faChild, text: 'Ludoteca para la creatividad.' },
    { icon: faTree, text: 'Área de relajación y encuentro.' },
    { icon: faKey, text: 'Baños, Duchas y Lockers independientes.' }, 
];

const PLAY_CLUB_FEATURES = [
    { icon: faBowlingBall, text: 'Mesa de Billar' },
    { icon: faTableTennis, text: 'Mesa de Ping Pong' }, 
    { icon: faBowlingBall, text: 'Mesa de Hockey de Aire' }, 
    { icon: faTv, text: 'Sala de Estar' }, 
    { icon: faHeadphones, text: 'Área de Karaoke' }, 
];

const FeaturesList = ({ features, title }) => (
    <div className="features-list-wrapper">
        <h3 className="features-title">{title}</h3>
        <ul className="features-list">
            {features.map((item, index) => (
                <li key={index} className="feature-item">
                    <FontAwesomeIcon icon={item.icon} className="feature-icon" />
                    <span>{item.text}</span>
                </li>
            ))}
        </ul>
    </div>
);


const CasaClubPage = () => {
    return (
        <div className="amenity-detail-page">
            
            {/* 1. Hero / Título */}
            <section className="amenity-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
                <div className="hero-overlay">
                    {/* Botón de Regreso (Back-link) */}
                    <Link to="/proyecto" className="back-link">
                        <FontAwesomeIcon icon={faChevronLeft} /> Regresar a Amenidades
                    </Link>

                    {/* Contenido centrado */}
                    <div className="hero-content-detail">
                        <h1 className="amenity-title-page">Casa Club Principal</h1>
                        <p className="amenity-tagline">El Corazón del Desarrollo: Bienestar, Eventos y Convivencia Social.</p>
                    </div>
                </div>
            </section>

            {/* 2. Contenido Principal y Facilidades (Casa Club) */}
            <section className="amenity-intro-section">
                <div className="amenity-inner-container intro-content-layout"> 
                    <div className="text-and-image-column">
                        <div className="intro-text">
                            <h2 className="section-heading">Nivel 1: Convivencia y Relajación</h2>
                            <p>
                                La Casa Club es el punto de encuentro social y familiar. Inspirada en la arquitectura mediterránea, cada rincón fomenta la convivencia, el ejercicio y el descanso con acceso directo a la alberca, jacuzzis y áreas de asadores.
                            </p>
                            <p>
                                Aquí encontrarás el equilibrio perfecto para tu rutina, desde un entrenamiento matutino en el gimnasio hasta la celebración de momentos inolvidables.
                            </p>
                        </div>
                        <div className="intro-image-wrapper">
                            <img 
                                src={CASA_CLUB_INTRO_IMAGE} 
                                alt="Interior de la Casa Club, área de descanso" 
                                loading="lazy" 
                                className="intro-section-img" 
                            />
                        </div>
                    </div>
                    <FeaturesList features={CLUB_FEATURES} title="Amenidades Destacadas (Planta Baja)" />
                </div>
            </section>

            {/* 3. Sub-sección: Play Club (Planta Alta) */}
            <section className="play-club-section">
                <div className="amenity-inner-container play-club-content">
                    <div className="play-club-details">
                        <h2 className="section-heading">Nivel 2: Play Club (Espacio Joven)</h2>
                        <p>
                            Un área exclusiva diseñada para la recreación activa de jóvenes y adultos. Ubicada en la planta alta, ofrece un ambiente dinámico y divertido con juegos y zonas de estar.
                        </p>
                        <FeaturesList features={PLAY_CLUB_FEATURES} title="Juegos y Entretenimiento" />
                    </div>
                    <div className="play-club-image-wrapper">
                         <img src={PLAY_CLUB_IMAGE} alt="Interior del Play Club" loading="lazy" className="play-club-img" />
                    </div>
                </div>
            </section>
            <StablePanoViewerR3F 
                    imageUrl={testImageURL}
                    height="650px" 
                     style={{ transform: "scaleX(-1)" }}
                />

            {/* 🛑 NUEVO: SLIDER DE IMÁGENES REUTILIZABLE */}
            <AmenitySlider 
                images={CasaClubImages} 
                title="Galería Fotográfica de la Casa Club"
            />
 <StablePanoViewerR3F 
                    imageUrl={testImageURL2}
                    height="650px" 
                />

            {/* 4. Llamada a la Acción (CTA) */}
            <section className="amenity-cta-section">
                 <div className="cta-inner-container">
                    <h2>Vive la Experiencia Granados</h2>
                    <p>Solicita una visita guiada para recorrer la Casa Club y conocer nuestro Masterplan.</p>
                    <Link to="/contacto" className="cta-button">
                        Agendar Visita
                    </Link>
                </div>
            </section>
 <StablePanoViewerR3F 
                    imageUrl={testImageURL3}
                    height="650px" 
                />

        </div>
    );
};

export default CasaClubPage;