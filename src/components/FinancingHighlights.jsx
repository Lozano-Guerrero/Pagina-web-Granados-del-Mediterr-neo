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
      text: "Hasta 40 Meses Sin Intereses",
      icon: faClockRotateLeft,
    },
    { 
      id: 2, 
      text: "Hasta 40 Meses Sin Intereses (MSI)", 
      icon: faClockRotateLeft, 
    },
    { 
      id: 3, 
      text: "Anualidades del 5%", 
      icon: faCalendarCheck, 
    },
    { 
      id: 4, 
      text: "15% contra escritura", 
      icon: faFileSignature, 
    },
  ];

  return (
    <section
      ref={sectionRef}
      className={`financing-section-v3 ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="financing-content-wrapper">
        <header className="financing-header-v3">
          <span className="section-tag">Inversión Inteligente</span>
          <h2 className="financing-title-v3">Planes de Financiamiento a tu medida</h2>
          <p className="financing-subtitle-v3">Opciones flexibles diseñadas para asegurar tu patrimonio sin comprometer tu liquidez.</p>
        </header>

        <div className="highlights-grid-v3">
          {highlights.map((item, index) => (
            <div
              key={item.id}
              className="highlight-item-v3"
              style={{ transitionDelay: `${index * 0.15}s` }}
            >
              <div className="icon-wrapper-v3">
                <FontAwesomeIcon icon={item.icon} className="highlight-icon-v3" />
              </div>
              <p className="highlight-text-v3">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="financing-cta-v3">
          <Link to="/Contacto" className="cta-link-v3">
            Explorar Plan Personalizado
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinancingHighlights;