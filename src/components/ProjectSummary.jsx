// src/components/ProjectSummary.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMountain,
  faHome,
  faPalette,
  faRulerCombined,
} from "@fortawesome/free-solid-svg-icons";
import "./ProjectSummary.css";

// Datos clave extraídos del PDF (Páginas 2 y 4)
const keyFeatures = [
  {
    icon: faMountain,
    title: "Entorno Natural",
    detail: "Vistas a la Sierra Madre",
    description:
      "Ubicado en Montemorelos, fusionando naturaleza y nuevas oportunidades.",
  },
  {
    icon: faRulerCombined,
    title: "Exclusividad",
    detail: "Lotes desde 1500 m²",
    description:
      "Espacios amplios para construir un legado y garantizar privacidad.",
  },
  {
    icon: faPalette,
    title: "Arquitectura",
    detail: "Estilo Mediterráneo",
    description:
      "Calidez y diseño que complementan el paisaje natural del área.",
  },
  {
    icon: faHome,
    title: "Amenidades",
    detail: "+40 Experiencias",
    description:
      "Lagoon Club, Casa Club, Parques, Canchas y mucho más para toda la familia.",
  },
];

// 🛑 NOTA: Asegúrate de que esta ruta sea correcta en tu proyecto
const MAIN_IMAGE = "/img/casa1.jpg"; // Imagen representativa del proyecto

const ProjectSummary = () => {
  return (
    <section className="summary-section">
      <div className="summary-layout-grid">
        {/* 1. Columna Izquierda: Imagen (30% de ancho) */}
        <div className="summary-image-wrapper">
          <img
            src={MAIN_IMAGE}
            alt="Vista del Club Residencial Granados del Mediterráneo"
            loading="lazy"
          />
        </div>
        {/* 2. Columna Derecha: Contenido (70% de ancho) */}
        <div className="summary-content-wrapper">
          {/* PARTE SUPERIOR DERECHA: Título y Concepto */}
          <div className="summary-concept-container">
            <h2 className="summary-title">
              <span className="accent-text">Granados del Mediterráneo:</span>
            </h2>
            <h3 className="summary-subtitle">
              Un Refugio Residencial Campestre Único
            </h3>

            {/* Subtítulo */}
            <p className="summary-intro-text">
              En Montemorelos, donde la Sierra Madre se encuentra con nuevas
              oportunidades, nace Granados del Mediterráneo desde un concepto
              integral. Más que un fraccionamiento, es un lienzo para construir
              un legado.
              <br />
              Un refugio que fusiona las imponentes vistas y la calidez de la
              arquitectura mediterránea con más de 40 amenidades exclusivas para
              crear una experiencia de club residencial campestre única.
            </p>
          </div>
          {/* Llamado a la Acción */   }
          <div className="summary-cta-box">
            <a
              href="https://wa.me/528123852034?text="
              target="_blank"
              className="summary-cta-button"
            >
              Agenda una Visita
            </a>
          </div>
          {/* PARTE INFERIOR DERECHA: Tarjetas de Datos Clave */}
          <div className="summary-features-group">
            <div className="summary-features-container">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="card-header">
                    <FontAwesomeIcon
                      icon={feature.icon}
                      className="feature-icon"
                    />
                    <h3 className="card-title">{feature.title}</h3>
                  </div>
                  <p className="card-detail">{feature.detail}</p>
                  <p className="card-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>{" "}
        {/* Fin de .summary-content-wrapper */}
      </div>
    </section>
  );
};

export default ProjectSummary;
