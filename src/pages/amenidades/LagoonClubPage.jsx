import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    // Íconos para el Lagoon Club
    faWater, faFire, faTree, faHammer, faTents, faSwimmer, faFootballBall, faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

// Importación de componentes y datos
import AmenitySlider from '../../components/AmenitySlider'; 
import { LagoonClubImages } from '../../data/amenityImages'; 
import './CasaClubPage.css'; // Reutilizamos el mismo CSS para la estructura general
import CasaLago360 from '/img/360img/lagoon360/CasaLago360.jpg';
import StablePanoViewerR3F from '../../components/StablePanoViewerR3F';


// RUTAS DE IMAGENES FIJAS
const HERO_IMAGE = '/img/amenidades/lagoonclubvista.jpeg';
const LAGOON_CLUB_INTRO_IMAGE = '/img/lagoon-club-main.jpg'; 
const PLAYA_ARENA_IMAGE = '/img/amenidades/asadores.jpg'; 
const testImageURL1 = "/img/360img/lagoon360/CasaLago360.jpg";
    const testImageURL2 = "/img/360img/lagoon360/Fogateros360.jpg";
    const testImageURL3 = "/img/360img/lagoon360/Glamping360.jpg";
// Facilidades del Lagoon Club
const CLUB_FEATURES = [
    { icon: faWater, text: 'Lago con actividades acuáticas (no motorizadas).' },
    { icon: faHammer, text: 'Palapa y área de asadores con vistas al lago.' },
    { icon: faFire, text: 'Fogateros para cerrar el día con ambiente.' }, 
    { icon: faTree, text: 'Área de hamacas para un descanso profundo.' }, 
    { icon: faFootballBall, text: 'Cancha de fútbol y voleibol de arena.' },
    { icon: faFootballBall, text: 'Cancha de cróquet.' }, 
    { icon: faTents, text: 'Área de Glamping para noches especiales.' }, 
    { icon: faSwimmer, text: 'Muelle para actividades y contemplación.' },
];

// Reutilizamos el componente FeaturesList (asume que está en este archivo o importado globalmente)
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


const LagoonClubPage = () => {
    return (
        <div className="amenity-detail-page">
            
            {/* 1. Hero / Título */}
            <section className="amenity-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
                <div className="hero-overlay">
                    <Link to="/proyecto" className="back-link">
                        <FontAwesomeIcon icon={faChevronLeft} /> Regresar a Amenidades
                    </Link>
                    <div className="hero-content-detail">
                        <h1 className="amenity-title-page">Lagoon Club</h1>
                        <p className="amenity-tagline">Diversión Acuática y Relax al Aire Libre frente al Lago.</p>
                    </div>
                </div>
            </section>

            {/* 2. Contenido Principal y Facilidades (Lagoon Club) */}
            <section className="amenity-intro-section">
                <div className="amenity-inner-container intro-content-layout"> 
                    <div className="text-and-image-column">
                        <div className="intro-text">
                            <h2 className="section-heading">El Destino de Aventura</h2>
                            <p>
                                El Lagoon Club te invita a vivir la naturaleza y el deporte. Con un impresionante lago como protagonista, este espacio está dedicado a actividades acuáticas no motorizadas, reuniones junto a la fogata y deportes de playa.
                            </p>
                            <p>
                                Es el lugar perfecto para escapar de la rutina y conectar con la naturaleza, ofreciendo una experiencia única de convivencia y esparcimiento para toda la familia.
                            </p>
                        </div>
                        <div className="intro-image-wrapper">
                            <img 
                                src={LAGOON_CLUB_INTRO_IMAGE} 
                                alt="Palapa del Lagoon Club con vistas al lago" 
                                loading="lazy" 
                                className="intro-section-img" 
                            />
                        </div>
                    </div>
                  
                    <FeaturesList features={CLUB_FEATURES} title="Amenidades Destacadas del Lago" />
                </div>
            </section>


            {/* 3. Sub-sección: Deportes y Playa */}
            <section className="play-club-section">
                <div className="amenity-inner-container play-club-content">
                    <div className="play-club-details">
                        <h2 className="section-heading">Glamping y Deportes de Playa</h2>
                        <p>
                            Vive experiencias memorables con nuestras áreas diseñadas para la actividad física y el descanso profundo, incluyendo zonas de playa con arena natural y la posibilidad de acampar con estilo.
                        </p>
                        <ul className="features-list">
                            <li className="feature-item"><FontAwesomeIcon icon={faTents} className="feature-icon" /> Glamping y Campismo de Lujo</li>
                            <li className="feature-item"><FontAwesomeIcon icon={faFootballBall} className="feature-icon" /> Voleibol y Fútbol de Arena</li>
                            <li className="feature-item"><FontAwesomeIcon icon={faFire} className="feature-icon" /> Fogateros Nocturnos</li>
                        </ul>
                    </div>
                    <div className="play-club-image-wrapper">
                         <img src={PLAYA_ARENA_IMAGE} alt="Área de playa y deportes en el Lagoon Club" loading="lazy" className="play-club-img" />
                    </div>
                </div>
            </section>
  <StablePanoViewerR3F 
                    imageUrl={testImageURL1}
                   
                />

            {/* SLIDER DE IMÁGENES REUTILIZABLE */}
            <AmenitySlider 
                images={LagoonClubImages} 
                title="Galería Fotográfica del Lagoon Club"
            />
  <StablePanoViewerR3F 
                    imageUrl={testImageURL2}
                
                />

            {/* 4. Llamada a la Acción (CTA) */}
            <section className="amenity-cta-section">
                 <div className="cta-inner-container">
                    <h2>Vive la Experiencia Lagoon Club</h2>
                    <p>Solicita una visita guiada para recorrer el Lagoon Club y conocer nuestro Masterplan.</p>
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

export default LagoonClubPage;