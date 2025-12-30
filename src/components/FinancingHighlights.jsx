import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; // Importación para manejar la navegación
import './FinancingHighlights.css';

// Importar los componentes y los íconos específicos de Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHandHoldingDollar, // Enganche
  faClockRotateLeft,   // MSI
  faCalendarCheck,     // Anualidades
  faFileSignature      // Escriturar
} from '@fortawesome/free-solid-svg-icons';

/**
 * Componente que muestra los aspectos destacados del financiamiento
 * con animación de aparición al hacer scroll y enlace a Contacto.
 */
const FinancingHighlights = () => {
  // --- Configuración de la Animación de Aparición ---
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: null, 
        rootMargin: '0px',
        threshold: 0.2, // Visible cuando el 20% entra al viewport
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // --- Datos y Título (Hook Sugerente) ---
  const titleHook = "NO TE DESCAPITALICES. CONOCE NUESTRAS OPCIONES DE PAGO";

  const highlights = [
    { 
      id: 1, 
      text: "Desde el 15% de Enganche", 
      icon: faHandHoldingDollar, 
    },
    { 
      id: 2, 
      text: "Hasta 36 Meses Sin Intereses (MSI)", 
      icon: faClockRotateLeft, 
    },
    { 
      id: 3, 
      text: "Anualidades del 5%", 
      icon: faCalendarCheck, 
    },
    { 
      id: 4, 
      text: "10% al Escriturar", 
      icon: faFileSignature, 
    },
  ];

  return (
    <section 
      ref={sectionRef} 
      className={`financing-section ${isVisible ? 'is-visible' : ''}`}
    >
      {/* Título usando el hook sugerente */}
      <h2 className="financing-title">{titleHook}</h2>
      
      <div className="highlights-container">
        {highlights.map((item, index) => (
          <div 
            key={item.id} 
            className="highlight-card"
            style={{ transitionDelay: `${index * 0.1}s` }} // Animación escalonada
          >
            {/* Uso del componente FontAwesomeIcon */}
            <FontAwesomeIcon 
              icon={item.icon} 
              className="highlight-icon" 
            />
            
            <p className="highlight-text">
              <strong>{item.text}</strong>
            </p>
          </div>
        ))}
      </div>
      
      <div className="call-to-action">
        {/* Usamos Link para navegar a /Contacto y le aplicamos los estilos del botón */}
        <Link to="/Contacto" className="cta-button-link">
          <button className="cta-button">
            ¡PREGUNTA POR UN PLAN PERSONALIZADO!
          </button>
        </Link>
      </div>
    </section>
  );
};

export default FinancingHighlights;