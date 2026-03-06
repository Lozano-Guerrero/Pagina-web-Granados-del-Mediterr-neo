import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMountain,
    faRoad,
    faStar,
    faVectorSquare,
    faArchway
} from '@fortawesome/free-solid-svg-icons';
import './RefugeBannerV2.css';

const RefugeBannerV2 = () => {
    return (
        <section className="refuge-banner-v2-wrapper">
            <div className="refuge-banner-v2-container">

                {/* Capa oscura para permitir lectura del texto blanco */}
                <div className="refuge-banner-v2-overlay"></div>

                <div className="refuge-banner-v2-content">
                    {/* Columna Izquierda: Títulos y CTA */}
                    <div className="refuge-banner-v2-left">
                        <h2 className="refuge-title-v2">
                            Granados del <br />
                            Mediterráneo:
                        </h2>
                        <h3 className="refuge-subtitle-v2">
                            Un Refugio Residencial Campestre Único
                        </h3>
                        <div className="refuge-divider-v2"></div>
                        <p className="refuge-description-v2">
                            En Montemorelos, donde la Sierra Madre se encuentra con
                            nuevas oportunidades, nace un concepto único. Más que un
                            desarrollo residencial, es un lienzo para construir un legado
                            que fusiona vistas imponentes con la calidez de la
                            arquitectura mediterránea.
                        </p>
                        <a
                            href="https://wa.me/528123852034?text=Hola,%20me%20interesa%20agendar%20una%20visita%20a%20Granados%20del%20Mediterr%C3%A1neo."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="refuge-btn-v2"
                        >
                            AGENDA UNA VISITA
                        </a>
                    </div>

                    {/* Columna Derecha: Atributos/Features */}
                    <div className="refuge-banner-v2-right">

                        {/* Feature 1 */}
                        <div className="refuge-feature-v2">
                            <span className="refuge-icon-v2">
                                <FontAwesomeIcon icon={faMountain} />
                            </span>
                            <div className="refuge-feature-text-v2">
                                <h4>Entorno natural</h4>
                                <p>Vista a la sierra madre oriental</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="refuge-feature-v2">
                            <span className="refuge-icon-v2">
                                <FontAwesomeIcon icon={faRoad} />
                            </span>
                            <div className="refuge-feature-text-v2">
                                <h4>Fácil acceso</h4>
                                <p>A solo 5 min de Carretera Nacional</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="refuge-feature-v2">
                            <span className="refuge-icon-v2">
                                <FontAwesomeIcon icon={faStar} />
                            </span>
                            <div className="refuge-feature-text-v2">
                                <h4>Amenidades</h4>
                                <p>Más de 40 experiencias únicas para la familia</p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="refuge-feature-v2">
                            <span className="refuge-icon-v2">
                                <FontAwesomeIcon icon={faVectorSquare} />
                            </span>
                            <div className="refuge-feature-text-v2">
                                <h4>Amplitud</h4>
                                <p>Lotes de más de 1500 m2</p>
                            </div>
                        </div>

                        {/* Feature 5 */}
                        <div className="refuge-feature-v2">
                            <span className="refuge-icon-v2">
                                <FontAwesomeIcon icon={faArchway} />
                            </span>
                            <div className="refuge-feature-text-v2">
                                <h4>Estilo Mediterráneo</h4>
                                <p>Arquitectura diseñada con intención y estilo</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default RefugeBannerV2;
