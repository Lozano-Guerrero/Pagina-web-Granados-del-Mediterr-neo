// src/components/MasterplanFinancingV2.jsx
import React from 'react';
import './MasterplanFinancingV2.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faHistory, faCalendarAlt, faFileSignature, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const MasterplanFinancingV2 = () => {
    return (
        <section className="mpf-v2-container">
            <div className="mpf-v2-content">

                {/* --- SECCIÓN SUPERIOR: TEXTO Y PLANO MAESTRO --- */}
                <div className="mpf-v2-top-section">

                    {/* Izquierda: Textos y Botón */}
                    <div className="mpf-v2-text-col">
                        <h2 className="mpf-v2-main-title">Plano maestro<br />del desarrollo</h2>
                        <div className="mpf-v2-separator"></div>
                        <h3 className="mpf-v2-subtitle">Nuestra visión,<br />tu legado</h3>
                        <p className="mpf-v2-description">
                            Un proyecto de más de 200 lotes para construir el legado de tu familia.
                            Descubre la visión completa de Granados, que integra amenidades
                            exclusivas, extensas áreas verdes y la mejor ubicación en Montemorelos,
                            garantizando tu plusvalía.
                        </p>
                        <Link to="/precios" className="mpf-v2-btn">
                            Ver disponibilidad y precios
                            <span className="mpf-v2-btn-icon">
                                <FontAwesomeIcon icon={faArrowRight} />
                            </span>
                        </Link>
                    </div>

                    {/* Derecha: Imagen del Plano Maestro */}
                    <div className="mpf-v2-image-col">
                        <img
                            src="/img/mapa3dhorizontal.png"
                            alt="Plano Maestro Granados del Mediterráneo 3D"
                            className="mpf-v2-map-img desktop-img"
                        />
                        <img
                            src="/img/mapa3d.png"
                            alt="Plano Maestro Granados del Mediterráneo 3D"
                            className="mpf-v2-map-img mobile-img"
                        />
                    </div>
                </div>

                {/* --- SECCIÓN INFERIOR: TARJETAS DE FINANCIAMIENTO --- */}
                <div className="mpf-v2-bottom-section">
                    <h2 className="mpf-v2-finance-title">Planes de financiamiento a tu medida</h2>

                    <div className="mpf-v2-cards-grid">

                        {/* Tarjeta 1 */}
                        <div className="mpf-v2-card">
                            <span className="mpf-v2-card-text">Enganche<br />desde del 15%</span>
                            <div className="mpf-v2-card-icon-wrapper">
                                <FontAwesomeIcon icon={faCreditCard} className="mpf-v2-card-icon" />
                            </div>
                        </div>

                        {/* Tarjeta 2 */}
                        <div className="mpf-v2-card">
                            <span className="mpf-v2-card-text">Hasta 40 MSI</span>
                            <div className="mpf-v2-card-icon-wrapper">
                                <FontAwesomeIcon icon={faHistory} className="mpf-v2-card-icon" />
                            </div>
                        </div>

                        {/* Tarjeta 3 */}
                        <div className="mpf-v2-card">
                            <span className="mpf-v2-card-text">3 anualidades</span>
                            <div className="mpf-v2-card-icon-wrapper">
                                <FontAwesomeIcon icon={faCalendarAlt} className="mpf-v2-card-icon" />
                            </div>
                        </div>

                        {/* Tarjeta 4 */}
                        <div className="mpf-v2-card">
                            <span className="mpf-v2-card-text">pago contra<br />escritura</span>
                            <div className="mpf-v2-card-icon-wrapper">
                                <FontAwesomeIcon icon={faFileSignature} className="mpf-v2-card-icon" />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section >
    );
};

export default MasterplanFinancingV2;
