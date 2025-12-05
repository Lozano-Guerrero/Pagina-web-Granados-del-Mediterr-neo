// src/components/HeroSlider.jsx - CORREGIDO: SUAVIZADO DEL SALTO EN CARRUSEL INFINITO

import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'; 
import './HeroSlider.css'; 

// Datos de las Diapositivas
const slides = [
  {
    id: 1,
    image: '/img/hero/FACHADA.jpg', 
    title: 'El Lujo Mediterráneo, Centro de tu Legado', 
    subtitle: 'Nuestra Casa Club es el centro de reunión perfecto. Disfruta de la alberca con carril de nado, jacuzzi, sauna/vapor y áreas sociales diseñadas para conectar y celebrar. Un espacio donde tu familia y vecinos crean memorias invaluables.',
    ctaText: 'Conoce más',
    ctaLink: '/proyecto',
    indicatorColor: '#FFFFFF' 
  },
  {
    id: 2,
    image: '/img/hero/Lago.webp',
    title: 'Tu Escape Campestre, Todos los Días',
    subtitle: 'Un gran lago para la aventura y el descanso. Disfruta de Glamping, Palapas con asadores, canchas de arena y la exclusiva Cancha de Croquet. Es el paraíso natural de Montemorelos, diseñado para crear recuerdos únicos en familia.',
    ctaText: 'Ver Detalles',
    ctaLink: '/proyecto',
    indicatorColor: '#E4C59F'
  },
  {
    id: 3,
    image: '/img/hero/Accesoparque.jpg',
    title: 'Inversión Inteligente en un Entorno Natural',
    subtitle: 'Granados del Mediterráneo es más que un fraccionamiento; es un proyecto que garantiza la plusvalía de tu patrimonio. Vive rodeado de la Sierra Madre y a solo 2.5 km de Carretera Nacional, con espacios verdes y seguros para toda la familia.',
    ctaText: 'Ver Detalles',
    ctaLink: '/proyecto',
    indicatorColor: '#BC7C74'
  },
];

const INTERVAL_DURATION = 5000;
const MANUAL_TRANSITION_TIME = 500;
const SLIDE_TRANSITION_DURATION = 1000; 

// 🛑 1. Crear las diapositivas extendidas (Añadir clones)
const extendedSlides = [
    slides[slides.length - 1], // Último clonado al inicio (índice 0)
    ...slides,                  // Diapositivas reales (índices 1, 2, 3)
    slides[0]                   // Primero clonado al final (índice 4)
];

const HeroSlider = () => {
  // Inicializar en 1 (el primer slide real)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  // 🛑 Estado para controlar la transición CSS. Inicialmente TRUE.
  const [isTransitioning, setIsTransitioning] = useState(true); 

  const totalRealSlides = slides.length;
  const totalExtendedSlides = extendedSlides.length;

  const intervalRef = useRef(null); 

  // 🛑 Función para manejar el salto instantáneo (sin transición CSS)
  const handleTransitionEnd = useCallback(() => {
    // Solo actuamos si el carrusel está en modo de transición (no si ya saltó)
    if (!isTransitioning) return;

    // Si estamos en la diapositiva clonada final (índice 4)
    if (currentSlideIndex === totalExtendedSlides - 1) {
      // 1. Desactivar la transición
      setIsTransitioning(false);
      // 2. Saltar instantáneamente a la primera diapositiva real (índice 1)
      setCurrentSlideIndex(1);
    } 
    // Si estamos en la diapositiva clonada inicial (índice 0)
    else if (currentSlideIndex === 0) {
      // 1. Desactivar la transición
      setIsTransitioning(false);
      // 2. Saltar instantáneamente a la última diapositiva real (índice 3)
      setCurrentSlideIndex(totalRealSlides);
    }
    
    // 🛑 Este es el cambio clave: Reactivar la transición inmediatamente después del salto
    // (o después de que se detectó que no hubo salto, para el resto de los movimientos).
    // Esto asegura que el siguiente movimiento (ya sea manual o automático) será suave.
    if (!isTransitioning) {
        // Usamos setTimeout para asegurar que React complete el render del 'none' antes de volver a 'ease-in-out'
        setTimeout(() => {
            setIsTransitioning(true);
        }, 50); 
    }

  }, [currentSlideIndex, totalExtendedSlides, totalRealSlides, isTransitioning]);
  // Dependencia 'isTransitioning' es crucial aquí.


  // Función clave para iniciar el temporizador automático
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setIsAnimatingOut(true); 
      
      setTimeout(() => {
        // Aseguramos que la transición esté activa antes de mover
        setIsTransitioning(true); 
        setCurrentSlideIndex(prevIndex => prevIndex + 1);
        setIsAnimatingOut(false);
      }, MANUAL_TRANSITION_TIME);
      
    }, INTERVAL_DURATION);
  }, [totalRealSlides]);


  // Lógica para el cambio automático de diapositivas
  useEffect(() => {
    startAutoSlide();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startAutoSlide]); 

  // Función auxiliar para reiniciar el temporizador después de una acción manual
  const restartAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Reiniciamos después de que la transición CSS y de texto haya terminado
    setTimeout(startAutoSlide, SLIDE_TRANSITION_DURATION + MANUAL_TRANSITION_TIME); 
  }, [startAutoSlide]);


  // Funciones de control manual
  const nextSlide = () => {
    // Aseguramos que la transición esté activa
    setIsTransitioning(true); 
    setIsAnimatingOut(true);
    setTimeout(() => {
      setCurrentSlideIndex(prevIndex => prevIndex + 1);
      setIsAnimatingOut(false);
    }, MANUAL_TRANSITION_TIME);
    restartAutoSlide();
  };

  const prevSlide = () => {
    // Aseguramos que la transición esté activa
    setIsTransitioning(true); 
    setIsAnimatingOut(true);
    setTimeout(() => {
      setCurrentSlideIndex(prevIndex => prevIndex - 1);
      setIsAnimatingOut(false);
    }, MANUAL_TRANSITION_TIME);
    restartAutoSlide();
  };


  const goToSlide = (realIndex) => {
    const extendedIndex = realIndex + 1;
    // Aseguramos que la transición esté activa
    setIsTransitioning(true); 
    setIsAnimatingOut(true);
    setTimeout(() => {
      setCurrentSlideIndex(extendedIndex);
      setIsAnimatingOut(false);
    }, MANUAL_TRANSITION_TIME);
    restartAutoSlide();
  };

  // Cálculo del índice real para los indicadores y el contenido
  const realSlideIndex = (currentSlideIndex - 1 + totalRealSlides) % totalRealSlides;

  return (
    <section className="hero-slider-container">
      
      <div 
        className="slides-wrapper"
        style={{ 
          transform: `translateX(-${currentSlideIndex * 100}%)`,
          // 🛑 Control de la transición
          transition: isTransitioning ? `transform ${SLIDE_TRANSITION_DURATION / 1000}s ease-in-out` : 'none'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((slide, index) => (
          <div
            key={slide.id + "-" + index} 
            className={`slide ${index === currentSlideIndex ? 'active' : ''}`}
            style={{ 
              backgroundImage: `url(${slide.image})` 
            }}
          >
            {/* Degradado Superior para unir con la Navbar */}
            <div className="slide-gradient-top"></div>
            
            {/* Overlay para legibilidad */}
            <div className="slide-overlay"></div>
            
            <div className={`slide-content ${index === currentSlideIndex ? 'active' : ''} ${isAnimatingOut ? 'animating-out' : ''}`}>
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>
              <div className='bottonblock'>
              <Link to={slide.ctaLink} className="hero-cta-buttonslide">
                {slide.ctaText}
              </Link></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Flechas de control */}
      <button className="nav-arrow left" onClick={prevSlide} aria-label="Anterior">
        <FontAwesomeIcon icon={faChevronLeft} /> 
      </button>
      <button className="nav-arrow right" onClick={nextSlide} aria-label="Siguiente">
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      {/* Indicadores de Diapositiva (Puntos) */}
      <div className="slide-indicators">
        {slides.map((slide, index) => (
          <button
            key={index}
            className={`indicator ${index === realSlideIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir a la diapositiva ${index + 1}`}
            style={index === realSlideIndex ? { backgroundColor: slide.indicatorColor, borderColor: slide.indicatorColor } : {}}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;