// src/components/GallerySection.jsx
import React, { useState } from 'react';
import './GallerySection.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// 🛑 Datos basados en el brochure
const GALLERY_DATA = [
    {
        id: 'lagoon',
        name: 'Lagoon Club & Playa',
        description: 'Playa privada con laguna cristalina, palapas, asadores y canchas de arena.',
        images: [
            '/img/lagoon-club-1.jpg', // Imagen principal del club
            '/img/lagoon-club-2.jpg',
            '/img/lagoon-club-3.jpg',
            // Añadir más rutas de imágenes
        ],
    },
    {
        id: 'casa',
        name: 'Casa Club Principal',
        description: 'Gimnasio, alberca semiolímpica, salón de eventos y áreas lounge con arquitectura mediterránea.',
        images: [
            '/img/casa-club-1.jpg',
            '/img/casa-club-2.jpg', 
            '/img/casa-club-3.jpg',
        ],
    },
    {
        id: 'deportes',
        name: 'Deportes y Naturaleza',
        description: 'Canchas de pádel, tenis, pista de jogging, áreas de pícnic y la Casa del Árbol.',
        images: [
            '/img/deportes-1.jpg',
            '/img/deportes-2.jpg', 
            '/img/deportes-3.jpg',
        ],
    },
];

const GallerySection = () => {
    const [currentCategory, setCurrentCategory] = useState(GALLERY_DATA[0]);
    const [mainImageIndex, setMainImageIndex] = useState(0);

    const handleCategoryChange = (category) => {
        setCurrentCategory(category);
        setMainImageIndex(0); // Reiniciar al índice 0 al cambiar de categoría
    };

    const handleNext = () => {
        const nextIndex = (mainImageIndex + 1) % currentCategory.images.length;
        setMainImageIndex(nextIndex);
    };

    const handlePrev = () => {
        const prevIndex = (mainImageIndex - 1 + currentCategory.images.length) % currentCategory.images.length;
        setMainImageIndex(prevIndex);
    };

    return (
        <section className="project-gallery-section">
            <div className="gallery-header">
                <h2 className="section-heading">Recorre Nuestras Amenidades</h2>
                <p className="section-subheading">Explora las áreas que definen el estilo de vida en Granados del Mediterráneo.</p>
            </div>

            {/* Selector de Categorías (Tabs) */}
            <div className="gallery-tabs">
                {GALLERY_DATA.map(category => (
                    <button
                        key={category.id}
                        className={`gallery-tab-button ${category.id === currentCategory.id ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(category)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {/* Contenedor Principal de la Galería */}
            <div className="gallery-main-container">
                
                {/* Imagen Destacada (Hero) */}
                <div className="main-image-hero">
                    <img 
                        src={currentCategory.images[mainImageIndex]} 
                        alt={currentCategory.name} 
                        className="main-photo"
                    />

                    {/* Controles de Navegación */}
                    <button className="nav-arrow prev" onClick={handlePrev}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button className="nav-arrow next" onClick={handleNext}>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>

                    {/* Información flotante sobre la imagen */}
                    <div className="image-info-overlay">
                        <h3>{currentCategory.name}</h3>
                        <p>{currentCategory.description}</p>
                    </div>
                </div>

                {/* Grid de Miniaturas (Navegación Rápida) */}
                <div className="thumbnails-grid">
                    {currentCategory.images.map((image, index) => (
                        <div 
                            key={index} 
                            className={`thumbnail-item ${index === mainImageIndex ? 'active' : ''}`}
                            onClick={() => setMainImageIndex(index)}
                        >
                            <img src={image} alt={`${currentCategory.name} ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="gallery-cta-footer">
                <Link to="/amenidades" className="gallery-cta-button">
                    Ver Todas las 40+ Amenidades
                </Link>
            </div>
        </section>
    );
};

export default GallerySection;