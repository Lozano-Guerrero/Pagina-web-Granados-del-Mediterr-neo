
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import './InteractiveMasterPlanMapV2.css';

const MAP_IMAGE_VERTICAL = '/img/mapa-granados.png';
const MAP_IMAGE_HORIZONTAL = '/img/mapa-granados-horizontal.png';

const InteractiveMasterPlanMapV2 = ({
    title = "Plano Maestro del Desarrollo",
    text = "Un proyecto de más de 200 lotes para construir el legado de tu familia. Descubre la visión completa de Granados, que integra amenidades exclusivas, extensas áreas verdes y la mejor ubicación en Montemorelos, garantizando tu plusvalía."
}) => {

    return (
        <section className="masterplan-v2">
            <div className="masterplan-container-v2">

                <header className="masterplan-header-v2">
                    <span className="masterplan-tag-v2">Arquitectura y Paisaje</span>
                    <h2 className="masterplan-main-title-v2">{title}</h2>
                    <div className="title-accent-v2"></div>
                </header>

                <div className="masterplan-content-v2">

                    {/* Informative block */}
                    <div className="masterplan-info-v2">
                        <h3 className="info-title-v2">Nuestra Visión, <br /><span>Tu Legado</span></h3>
                        <p className="info-text-v2">{text}</p>

                        <div className="info-actions-v2">
                            <Link to="/precios" className="masterplan-cta-v2">
                                Ver Disponibilidad y Precios
                                <FontAwesomeIcon icon={faArrowRight} className="cta-icon-v2" />
                            </Link>
                        </div>
                    </div>

                    {/* Map block */}
                    <div className="masterplan-visual-v2">
                        <div className="map-frame-v2">
                            <picture>
                                <source media="(min-width: 1024px)" srcSet={MAP_IMAGE_HORIZONTAL} />
                                <img
                                    src={MAP_IMAGE_VERTICAL}
                                    alt="Plano Maestro Granados del Mediterráneo"
                                    className="map-image-v2"
                                    loading="lazy"
                                />
                            </picture>
                            <div className="map-overlay-v2"></div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default InteractiveMasterPlanMapV2;
