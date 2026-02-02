
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMountain,
    faHome,
    faPalette,
    faRulerCombined,
} from "@fortawesome/free-solid-svg-icons";
import "./ProjectSummaryV2.css";

const keyFeatures = [
    {
        icon: faMountain,
        title: "Entorno Natural",
        detail: "Sierra Madre",
        description: "Vistas imponentes que fusionan naturaleza y paz.",
    },
    {
        icon: faRulerCombined,
        title: "Exclusividad",
        detail: "Desde 1500 m²",
        description: "Lotes amplios para garantizar tu privacidad y legado.",
    },
    {
        icon: faPalette,
        title: "Arquitectura",
        detail: "Sello Mediterráneo",
        description: "Diseño que complementa la belleza del paisaje natural.",
    },
    {
        icon: faHome,
        title: "Amenidades",
        detail: "+40 Experiencias",
        description: "Club familiar, parques y espacios deportivos de primer nivel.",
    },
];

const MAIN_IMAGE = "/img/casa1.jpg";

const ProjectSummaryV2 = () => {
    return (
        <section className="summary-section-v2">
            <div className="summary-container-v2">
                <div className="summary-layout-v2">

                    {/* Columna Izquierda: Imagen */}
                    <div className="summary-visual-v2">
                        <div className="image-frame-v2">
                            <img src={MAIN_IMAGE} alt="Granados del Mediterráneo" loading="lazy" />
                        </div>
                    </div>

                    {/* Columna Derecha: Contenido */}
                    <div className="summary-info-v2">
                        <header className="info-header-v2">
                            <span className="info-tag-v2">Concepto Integral</span>
                            <h2 className="info-title-v2">
                                Granados del Mediterráneo:
                                <span className="info-subtitle-v2">Un Refugio Residencial Campestre Único</span>
                            </h2>
                            <p className="info-description-v2">
                                En Montemorelos, donde la Sierra Madre se encuentra con nuevas oportunidades, nace un concepto único. Más que un desarrollo residencial, es un lienzo para construir un legado que fusiona vistas imponentes con la calidez de la arquitectura mediterránea.
                            </p>

                            <div className="info-cta-v2">
                                <a href="https://wa.me/528123852034" target="_blank" rel="noopener noreferrer" className="cta-button-v2">
                                    Agenda una Visita
                                </a>
                            </div>
                        </header>

                        <div className="info-features-v2">
                            {keyFeatures.map((feature, index) => (
                                <div key={index} className="feature-item-v2">
                                    <div className="feature-icon-wrapper-v2">
                                        <FontAwesomeIcon icon={feature.icon} />
                                    </div>
                                    <div className="feature-text-v2">
                                        <h4 className="feature-title-v2">{feature.title}</h4>
                                        <span className="feature-detail-v2">{feature.detail}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ProjectSummaryV2;
