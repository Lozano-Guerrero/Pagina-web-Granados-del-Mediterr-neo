// src/pages/amenidades/ParqueLinealPage.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    // Íconos para el Parque Lineal
    faRunning, faChild, faPaw, faBasketballBall, faBookOpen, faChair, faChevronLeft, // 🛑 faChair está aquí
} from '@fortawesome/free-solid-svg-icons';
// ...
import { Link } from 'react-router-dom';

// Importación de componentes y datos
import AmenitySlider from '../../components/AmenitySlider'; 
import { ParqueLinealImages } from '../../data/amenityImages'; 
import './CasaClubPage.css'; // Reutilizamos el mismo CSS para la estructura general
import StablePanoViewerR3F from '../../components/StablePanoViewerR3F';
// RUTAS DE IMAGENES FIJAS
const HERO_IMAGE = '/img/Galeria/ParqueLineal/compress/cine.webp';
const PARQUE_LINEAL_INTRO_IMAGE = '/img/Galeria/ParqueLineal/compress/asadores.webp'; 
const MASCOTAS_IMAGE = '/img/Galeria/ParqueLineal/compress/dogpark.webp'; 
 const testImageURL1 = "/img/360img/parque360/Ajedrez360.jpg";
const testImageURL2 = "/img/360img/parque360/Cine360.jpg";
const testImageURL3 = "/img/360img/parque360/TiroconArco360.jpg";
// Facilidades del Parque Lineal
const CLUB_FEATURES = [
    { icon: faRunning, text: 'Senderos para correr y caminar.' },
    { icon: faChild, text: 'Áreas de juegos infantiles con seguridad.' },
    { icon: faBasketballBall, text: 'Cancha de usos múltiples (Fútbol, Básquetbol).' }, 
    { icon: faPaw, text: 'Pet Park para entrenamiento y socialización de mascotas.' }, 
    { icon: faBookOpen, text: 'Zonas de lectura y descanso al aire libre.' },
    { icon: faChair, text: 'Estaciones de ejercicio y estiramiento.' }, // 🛑 CORRECCIÓN: debe decir faChair
];

// Reutilizamos el componente FeaturesList
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


const ParqueLinealPage = () => {
    return (
        <div className="amenity-detail-page">
            
            {/* 1. Hero / Título */}
            <section className="amenity-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
                <div className="hero-overlay">
                    <Link to="/proyecto" className="back-link">
                        <FontAwesomeIcon icon={faChevronLeft} /> Regresar a Amenidades
                    </Link>
                    <div className="hero-content-detail">
                        <h1 className="amenity-title-page">Parque Lineal</h1>
                        <p className="amenity-tagline">Senderos, Deporte y Conexión con la Naturaleza.</p>
                    </div>
                </div>
            </section>

            {/* 2. Contenido Principal y Facilidades (Parque Lineal) */}
            <section className="amenity-intro-section">
                <div className="amenity-inner-container intro-content-layout"> 
                    <div className="text-and-image-column">
                        <div className="intro-text">
                            <h2 className="section-heading">Pulmón Verde del Desarrollo</h2>
                            <p>
                                El Parque Lineal es un espacio diseñado para la salud y el bienestar. Recorre todo el desarrollo ofreciendo amplios senderos y múltiples áreas temáticas para el ejercicio, el juego y la relajación al aire libre.
                            </p>
                            <p>
                                Es el sitio ideal para un paseo matutino, una tarde de juegos con los niños o el entrenamiento de tus mascotas.
                            </p>
                        </div>
                        <div className="intro-image-wrapper">
                            <img 
                                src={PARQUE_LINEAL_INTRO_IMAGE} 
                                alt="Senderos y áreas verdes del Parque Lineal" 
                                loading="lazy" 
                                className="intro-section-img" 
                            />
                        </div>
                    </div>
                    <FeaturesList features={CLUB_FEATURES} title="Amenidades Clave" />
                </div>
            </section>

            {/* 3. Sub-sección: Pet Park y Áreas Deportivas */}
            <section className="play-club-section">
                <div className="amenity-inner-container play-club-content">
                    <div className="play-club-details">
                        <h2 className="section-heading">Mascotas y Entrenamiento</h2>
                        <p>
                            Pensando en la rutina completa, hemos integrado espacios especializados, como el Pet Park, un área cercada y equipada para que tus mascotas socialicen y hagan ejercicio de forma segura.
                        </p>
                        <ul className="features-list">
                            <li className="feature-item"><FontAwesomeIcon icon={faPaw} className="feature-icon" /> Pet Park cercado y con estaciones de juego</li>
                            <li className="feature-item"><FontAwesomeIcon icon={faBasketballBall} className="feature-icon" /> Cancha de usos múltiples con iluminación</li>
                            <li className="feature-item"><FontAwesomeIcon icon={faRunning} className="feature-icon" /> Pista de jogging con estaciones de ejercicio</li>
                        </ul>
                    </div>
                    <div className="play-club-image-wrapper">
                         <img src={MASCOTAS_IMAGE} alt="Pet Park del desarrollo" loading="lazy" className="play-club-img" />
                    </div>
                </div>
            </section>
  <StablePanoViewerR3F 
                    imageUrl={testImageURL1}
                height="650px" 
                />
            {/* SLIDER DE IMÁGENES REUTILIZABLE */}
            <AmenitySlider 
                images={ParqueLinealImages} 
                title="Galería Fotográfica del Parque Lineal"
            />
  <StablePanoViewerR3F 
                    imageUrl={testImageURL2}
                height="650px" 
                />
            {/* 4. Llamada a la Acción (CTA) */}
            <section className="amenity-cta-section">
                 <div className="cta-inner-container">
                    <h2>Vive la Naturaleza Granados</h2>
                    <p>Solicita una visita guiada para recorrer los senderos y conocer nuestro Masterplan.</p>
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

export default ParqueLinealPage;