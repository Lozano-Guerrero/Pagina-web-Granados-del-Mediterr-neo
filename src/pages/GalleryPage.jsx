// src/pages/GalleryPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faChevronRight, 
    faChevronLeft, 
    faExpandAlt, // Nuevo ícono para expandir/abrir
} from '@fortawesome/free-solid-svg-icons';

import AmenityTrioHero from '../components/AmenityTrioHero';
import './GalleryPage.css';

// 🛑 Rutas de Imagen de Referencia (Mantenidas)
const IMG_REFERENCES = {
    HERO: '/img/hero/casagalary.jpg',
// Actualización del array de rutas de imágenes para LAGOON
LAGOON: [
    // La nueva ruta usa /img/Galeria/LagoonClub/Compress/ y el formato .webp
    '/img/Galeria/LagoonClub/Compress/Lago.webp', // Asumo 'Lago.webp' es aereacasalago/albercanatural
    '/img/Galeria/LagoonClub/Compress/interior.webp', // Sustituye a casainterior2
    '/img/Galeria/LagoonClub/Compress/Croquet.webp', // Sustituye a croquet
    '/img/Galeria/LagoonClub/Compress/fachada.webp', // Sustituye a fachada / dosfachada
    '/img/Galeria/LagoonClub/Compress/Fogateros.webp', // Sustituye a fogateros
    '/img/Galeria/LagoonClub/Compress/camping.webp', // Sustituye a glamping2
    '/img/Galeria/LagoonClub/Compress/interiorv.webp', // Sustituye a interior3
    '/img/Galeria/LagoonClub/Compress/noche.webp', // Imagen de la noche (Nueva o sustituto)
    '/img/Galeria/LagoonClub/Compress/Vistaaerea.webp', // Sustituye a aereacasalago (si no es 'Lago.webp')
],
    
    CASA_CLUB: [
    // La nueva ruta usa /img/Galeria/CasaClub/compress/ y el formato .webp
    '/img/Galeria/CasaClub/compress/alberca.webp',
    '/img/Galeria/CasaClub/compress/asadores.webp', 
    '/img/Galeria/CasaClub/compress/bar.webp',
    
    // Fachadas (Usamos las fachadas comprimidas)
    '/img/Galeria/CasaClub/compress/FACHADA.webp', // Sustituye Fachada.jpg, Fachadaderecha.jpg, Fachadaizquierda.jpg, Fachadalateral.jpg
    '/img/Galeria/CasaClub/compress/FACHADAFRONTAL.webp', // Sustituye Fachadafrontal.jpg
    
    // Interiores / Áreas Específicas
    '/img/Galeria/CasaClub/compress/lounge.webp', // Sustituye Lounge.jpg y/o Terraza.jpg
    '/img/Galeria/CasaClub/compress/playclub.webp', // Sustituye Kids club.jpg
    '/img/Galeria/CasaClub/compress/garden.webp',
    
    // Baños
    '/img/Galeria/CasaClub/compress/bañomujeres.webp',
    '/img/Galeria/CasaClub/compress/bañoshombres.webp',
    '/img/Galeria/CasaClub/compress/bañodiscapacitados.webp',
    '/img/Galeria/CasaClub/compress/bañomujeresalberca.webp',
    '/img/Galeria/CasaClub/compress/bañosmujeres-casaclub.webp',
],
 // Actualización del array de rutas de imágenes para LINEAL (Parque Lineal)
LINEAL: [
    // La nueva ruta usa /img/Galeria/ParqueLineal/compress/ y el formato .webp
    '/img/Galeria/ParqueLineal/compress/Ajedrez.webp', // Sustituye AJEDREZ3.jpg
    '/img/Galeria/ParqueLineal/compress/asadores.webp', // Sustituye ASADORES.jpg
    '/img/Galeria/ParqueLineal/compress/cinerenderdos.webp', // Sustituye cine.jpg
    '/img/Galeria/ParqueLineal/compress/jardinbotanico.webp', // Sustituye jardinComestible.jpg
    '/img/Galeria/ParqueLineal/compress/dogpark.webp', // Sustituye petpark.jpg
    '/img/Galeria/ParqueLineal/compress/Rampas.webp', // Sustituye pistas2.jpg
    '/img/Galeria/ParqueLineal/compress/xtreamclubdos.webp', // Sustituye XTREAM FUERTE2.jpg o xtreamclub.jpg
    '/img/Galeria/ParqueLineal/compress/xtreamclub.webp', // Sustituye la imagen restante de xtream
    '/img/Galeria/ParqueLineal/compress/Acceso-n.webp', // Añadimos imagen de Acceso (Acceso 2-n.webp o Acceso-n.webp)
    '/img/Galeria/ParqueLineal/compress/juegos.webp', // Añadimos juegos.webp
],
    
// Actualización del array de rutas de imágenes para HOGAR (Casa Muestra)
HOGAR: [
    // La nueva ruta usa /img/Galeria/CasaMuestra/Compress/ y el formato .webp
    
    // CASAS / EXTERIORES
    '/img/Galeria/CasaMuestra/Compress/casam1.webp', // Sustituye a la original casam1.jpeg
    '/img/Galeria/CasaMuestra/Compress/casam2.webp', // Sustituye a la original casam2.jpeg
    '/img/Galeria/CasaMuestra/Compress/casam3.webp', // Sustituye a la original casam3.jpeg
    '/img/Galeria/CasaMuestra/Compress/casam4.webp', // Sustituye a la original casam4.jpeg
    '/img/Galeria/CasaMuestra/Compress/casam5.webp', // Sustituye a la original casam5.jpeg
    '/img/Galeria/CasaMuestra/Compress/exterior.webp',
    '/img/Galeria/CasaMuestra/Compress/ENTRADA.webp',

    // FACHADAS (Diferentes ángulos)
    '/img/Galeria/CasaMuestra/Compress/fachada.webp', 
    '/img/Galeria/CasaMuestra/Compress/FACHADA 2.webp',
    '/img/Galeria/CasaMuestra/Compress/FACHADA FONTAL 2.webp',
    '/img/Galeria/CasaMuestra/Compress/FACHADA frontal 2.webp',
    '/img/Galeria/CasaMuestra/Compress/FACHADA LATERAL 2.webp',
    '/img/Galeria/CasaMuestra/Compress/FACHADA lateral.webp',

    // INTERIORES - Áreas Comunes
    '/img/Galeria/CasaMuestra/Compress/INTERIOR SALA.webp',
    '/img/Galeria/CasaMuestra/Compress/SALA.webp',
    '/img/Galeria/CasaMuestra/Compress/SALA -COMEDOR 2.webp',
    '/img/Galeria/CasaMuestra/Compress/SALA -COMEDOR 3.webp',
    '/img/Galeria/CasaMuestra/Compress/SALA -COMEDOR.webp',
    '/img/Galeria/CasaMuestra/Compress/cocina.webp',

    // INTERIORES - Privadas
    '/img/Galeria/CasaMuestra/Compress/habitacion.webp',
    '/img/Galeria/CasaMuestra/Compress/habitacion ppal 2.webp',
    '/img/Galeria/CasaMuestra/Compress/habitacion ppal 3.webp',
    '/img/Galeria/CasaMuestra/Compress/baño.webp',

    // PLANO
    '/img/Galeria/CasaMuestra/Compress/PLANTA CONJUNTO.webp',
    '/img/Galeria/CasaMuestra/Compress/conjunto 2.webp',
],
};

const TAB_DATA = [
    
    { 
        id: 'casa', 
        name: 'Casa Club Principal', 
        images: IMG_REFERENCES.CASA_CLUB,
        description: "Lujo, comodidad y arquitectura mediterránea. La Casa Club es tu centro social y deportivo: alberca, gimnasio de última generación, salones privados y áreas de *coworking*. El diseño está pensado para elevar tu rutina diaria.",
    },
    { 
        id: 'lagoon', 
        name: 'Lagoon Club', 
        images: IMG_REFERENCES.LAGOON,
        description: "El corazón del desarrollo. Disfruta de la vida de playa sin salir de casa. Nuestras aguas cristalinas y la arena suave te esperan para atardeceres memorables, fogatas y deportes acuáticos. ¡Una amenidad única en la región!",
    },
    { 
        id: 'lineal', 
        name: 'Parque Lineal', 
        images: IMG_REFERENCES.LINEAL,
        description: "Más de 5,000 m² dedicados al bienestar. Pista de jogging, áreas de yoga al aire libre, zona de calistenia y jardines de contemplación. Es el espacio ideal para reconectar con la naturaleza y tu salud.",
    },
    { 
        id: 'hogar', 
        name: 'Imagina tu Nuevo Hogar', 
        images: IMG_REFERENCES.HOGAR,
        description: "Inspírate con nuestros modelos de vivienda que reflejan la calidez del estilo Mediterráneo. Estos renders muestran el potencial arquitectónico que puedes alcanzar en tu lote, combinando diseño y funcionalidad.",
    }
];

// Componente del Modal Lightbox
const LightboxModal = ({ images, currentIndex, onClose, onPrev, onNext, onThumbnailClick }) => {
    if (images.length === 0) return null;

    // Hook para cerrar con tecla ESC
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="lightbox-modal-overlay">
            <div className="lightbox-modal-content">
                
                {/* Botón de Cerrar */}
                <button className="lightbox-close-btn" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                {/* Contenedor de Imagen Principal */}
                <div className="lightbox-main-image-container">
                    {/* Botón Anterior */}
                    <button className="lightbox-nav-btn prev" onClick={onPrev}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    
                    {/* Imagen Actual */}
                    <img 
                        src={images[currentIndex]} 
                        alt={`Galería - Imagen ${currentIndex + 1}`} 
                        className="lightbox-main-image"
                    />

                    {/* Botón Siguiente */}
                    <button className="lightbox-nav-btn next" onClick={onNext}>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
                
                {/* Carrusel de Miniaturas */}
                <div className="lightbox-thumbnail-carousel">
                    {images.map((imgUrl, index) => (
                        <img
                            key={index}
                            src={imgUrl}
                            alt={`Miniatura ${index + 1}`}
                            className={`lightbox-thumbnail ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => onThumbnailClick(index)}
                            loading="lazy"
                        />
                    ))}
                </div>

                {/* Contador */}
                <div className="lightbox-counter">
                    {currentIndex + 1} / {images.length}
                </div>
            </div>
        </div>
    );
};

// Componente de Colage Dinámico (Modificado para ser interactivo)
const DynamicImageCollage = ({ images, onImageClick }) => (
    <div className="image-collage-grid">
        {images.slice(0, 10).map((imgUrl, index) => (
            <div 
                key={index} 
                className={`collage-item item-${index + 1}`} 
                onClick={() => onImageClick(index)} // 🛑 Nuevo manejador de click
            >
                <img 
                    src={imgUrl} 
                    alt={`Amenidad ${index + 1}`} 
                    loading="lazy"
                    className={
                        index === 0 ? 'span-row-2' : 
                        index === 3 ? 'span-col-2' : 
                        ''
                    }
                />
                {/* Ícono de "Expandir" para indicar interactividad */}
                <div className="image-expand-overlay">
                    <FontAwesomeIcon icon={faExpandAlt} className="expand-icon" />
                </div>
            </div>
        ))}
    </div>
);


// Componente Principal
const GalleryPage = () => {
    const [activeTab, setActiveTab] = useState(TAB_DATA[0].id);
    const [isPopupOpen, setIsPopupOpen] = useState(true);
    
    // 🛑 Estados para el Lightbox
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    const currentTab = TAB_DATA.find(tab => tab.id === activeTab);
    const imagesInTab = currentTab ? currentTab.images : [];

    // 🛑 Funciones para Lightbox
    const openModal = useCallback((index) => {
        setModalImageIndex(index);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const showPrev = () => {
        setModalImageIndex((prevIndex) => 
            (prevIndex - 1 + imagesInTab.length) % imagesInTab.length
        );
    };

    const showNext = () => {
        setModalImageIndex((prevIndex) => 
            (prevIndex + 1) % imagesInTab.length
        );
    };

    // Función para manejar el cambio de pestaña y restablecer el popup
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Opcional: Reabrir el popup descriptivo al cambiar de pestaña
        // setIsPopupOpen(true); 
    };

    return (
        <div className="gallery-page">
            
            {/* 1. Portada */}
            <section className="gallery-hero-cover" style={{ backgroundImage: `url(${IMG_REFERENCES.HERO})` }}>
                <div className="hero-content-gallery">
                    <h1 className="hero-title">Tu Legado en Imágenes: Vive Granados</h1>
                    <p className="hero-tagline">
                        Más que renders, la visión completa de tu próximo hogar. 
                        Enamórate de cada rincón, desde la laguna cristalina hasta los senderos de la Sierra Madre.
                    </p>
                    <a href="https://wa.me/528123852034?text=" target="_blank" className="hero-cta-button-gallery">
                        Agendar Visita al Desarrollo <FontAwesomeIcon icon={faChevronRight} className="cta-icon-right"/>
                    </a>
                </div>
            </section>

            {/* 2. Galería por Secciones */}
            <section className="gallery-tabs-section">
                
                {/* 🛑 POPUP FLOTANTE (Modal Descriptivo) */}
                {isPopupOpen && (
                    <div className="descriptive-popup">
                        <button className="popup-close-btn" onClick={() => setIsPopupOpen(false)}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <h3 className="popup-title">Navega por las secciones clave...</h3>
                        <p>
                            Utiliza el menú de abajo para explorar cada amenidad en detalle. Haz **clic en cualquier imagen** para verla a pantalla completa en la galería interactiva.
                        </p>
                    </div>
                )}

                <div className="section-header-gallery">
                    <h2 className="section-heading">Detalles que Enamoran</h2>
                </div>

                <div className="gallery-tabs-nav">
                    {TAB_DATA.map(tab => (
                        <button
                            key={tab.id}
                            className={`gallery-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
                
                {/* 🛑 TEXTO DESCRIPTIVO DINÁMICO */}
                <div className="dynamic-description-container">
                    <p className="dynamic-description-text">
                        <strong style={{ 
          fontSize: '3rem',  // Aumenta el tamaño de la fuente
          color: '#bc7c74'      // Opcional: añade un color de acento
        }}>{currentTab.name}:</strong> <br/>{currentTab.description}
                    </p>
                </div>

                <div className="gallery-content-display">
                    <DynamicImageCollage 
                        images={imagesInTab} 
                        onImageClick={openModal} // Pasa la función para abrir el modal
                    />
                </div>
            </section>
            
            {/* 3. Componente Amenity Trio para Desglose */}
            <section className="amenity-trio-integration">
                <div className="info-inner-container">
                    <h2 className="section-heading">Explora a Profundidad</h2>
                    <p className="section-subheading">Accede al detalle de cada una de nuestras zonas exclusivas.</p>
                </div>
                <AmenityTrioHero /> 
            </section>


            {/* 4. Contact CTA */}
            <section className="contact-cta-section-gallery">
                <div className="cta-content-gallery">
                    <h2>¿Listo para Construir tu Legado?</h2>
                    <p>Contáctanos para recibir el brochure completo y plan de financiamiento.</p>
                    <a href="https://wa.me/528123852034?text=" target="_blank" className="hero-cta-button-gallery">
                        Solicitar Información <FontAwesomeIcon icon={faChevronRight} className="cta-icon-right"/>
                    </a>
                </div>
            </section>

            {/* 🛑 Lightbox Modal */}
            {isModalOpen && (
                <LightboxModal
                    images={imagesInTab}
                    currentIndex={modalImageIndex}
                    onClose={closeModal}
                    onPrev={showPrev}
                    onNext={showNext}
                    onThumbnailClick={setModalImageIndex}
                />
            )}
        </div>
    );
};

export default GalleryPage;