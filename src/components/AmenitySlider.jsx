// src/components/AmenitySlider.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import './AmenitySlider.css';

const AmenitySlider = ({ images, title }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    // 🛑 sliderRef ahora se usa para el desplazamiento del wrapper
    const sliderRef = useRef(null); 

    // --- Navegación del Slider Principal ---
    const goToPrevSlide = () => {
        setCurrentSlideIndex((prevIndex) => 
            (prevIndex === 0 ? images.length - 1 : prevIndex - 1)
        );
    };

    const goToNextSlide = () => {
        setCurrentSlideIndex((prevIndex) => 
            (prevIndex === images.length - 1 ? 0 : prevIndex + 1)
        );
    };

    // 🛑 CORRECCIÓN CLAVE: Desplazamiento del slider track
    useEffect(() => {
        const sliderWrapper = sliderRef.current;
        if (sliderWrapper && images.length > 0) {
            const slideTrack = sliderWrapper.children[0]; // .slider-track
            const slideItem = slideTrack.children[0]; // .slider-item
            
            if (slideItem) {
                const slideWidth = slideItem.offsetWidth;
                const gap = 20; // El mismo gap definido en AmenitySlider.css
                
                // Usamos scrollLeft en el wrapper para el desplazamiento suave
                sliderWrapper.scrollTo({
                    left: currentSlideIndex * (slideWidth + gap),
                    behavior: 'smooth',
                });
            }
        }
    }, [currentSlideIndex, images.length]);

    // --- Control del Modal ---
    const openModal = (index) => {
        setModalImageIndex(index);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsModalOpen(false);
        document.body.style.overflow = 'unset';
    };

    const goToPrevModalImage = useCallback(() => {
        setModalImageIndex((prevIndex) => 
            (prevIndex === 0 ? images.length - 1 : prevIndex - 1)
        );
    }, [images.length]);

    const goToNextModalImage = useCallback(() => {
        setModalImageIndex((prevIndex) => 
            (prevIndex === images.length - 1 ? 0 : prevIndex + 1)
        );
    }, [images.length]);

    // Teclado para navegación en el modal
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (isModalOpen) {
                if (event.key === 'ArrowLeft') {
                    goToPrevModalImage();
                } else if (event.key === 'ArrowRight') {
                    goToNextModalImage();
                } else if (event.key === 'Escape') {
                    closeModal();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, goToPrevModalImage, goToNextModalImage]);

    if (!images || images.length === 0) {
        return null;
    }

    // --- Renderizado del Slider y Modal ---
    return (
        <section className="amenity-slider-section">
            <div className="amenity-slider-container">
                {title && <h2 className="slider-title">{title}</h2>}
                
                <div className="slider-wrapper">
                    <button 
                        className="slider-nav-button left" 
                        onClick={goToPrevSlide}
                        aria-label="Imagen anterior"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>

                    {/* 🛑 REF APLICADO AQUÍ PARA CONTROLAR EL SCROLL */}
                    <div className="slider-track-wrapper" ref={sliderRef}> 
                        <div className="slider-track">
                            {images.map((imageURL, index) => (
                                <div 
                                    key={index} 
                                    className={`slider-item ${index === currentSlideIndex ? 'active' : ''}`}
                                    onClick={() => openModal(index)} 
                                >
                                    <img 
                                        src={imageURL} 
                                        alt={`Galería de Amenidad ${index + 1}`} 
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        className="slider-nav-button right" 
                        onClick={goToNextSlide}
                        aria-label="Siguiente imagen"
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>

            {/* --- Modal/Lightbox para imagen expandida --- */}
            {isModalOpen && (
                <div className="amenity-modal-overlay" onClick={closeModal}>
                    <div className="amenity-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-button" onClick={closeModal} aria-label="Cerrar galería">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        
                        <button className="modal-nav-button left" onClick={goToPrevModalImage} aria-label="Imagen anterior">
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        <div className="modal-image-wrapper">
                            {/* La imagen aquí se centrará dentro del wrapper de tamaño fijo */}
                            <img 
                                src={images[modalImageIndex]} 
                                alt={`Galería de Amenidad ${modalImageIndex + 1}`} 
                                className="modal-main-image"
                            />
                        </div>

                        <button className="modal-nav-button right" onClick={goToNextModalImage} aria-label="Siguiente imagen">
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AmenitySlider;