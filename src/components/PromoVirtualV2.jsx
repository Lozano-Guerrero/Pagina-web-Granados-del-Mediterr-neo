
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './PromoVirtualV2.css';

const VR_IMAGE_URL = "/img/RVimg.png";

const PromoVirtualV2 = () => {
    return (
        <section className="promo-virtual-v2">
            <div className="promo-inner-v2">

                {/* Visual Side */}
                <div className="promo-visual-v2">
                    <div className="vr-badge-v2">
                        <FontAwesomeIcon icon={faEye} />
                        <span>Tour 360°</span>
                    </div>
                    <div className="promo-image-frame-v2">
                        <img
                            src={VR_IMAGE_URL}
                            alt="Experiencia VR Granados"
                            className="vr-hero-image-v2"
                        />
                        <div className="image-overlay-v2"></div>
                    </div>
                </div>

                {/* Content Side */}
                <div className="promo-content-v2">
                    <header className="promo-header-v2">
                        <span className="promo-tag-v2">Inmersión Digital</span>
                        <h2 className="promo-title-v2">
                            El futuro de tu hogar, <br /><span>hoy en realidad virtual</span>
                        </h2>
                        <p className="promo-desc-v2">
                            No solo imagines tu próxima propiedad. Camina por sus pasillos, siente la amplitud de sus espacios y descubre cada amenidad desde nuestra oficina de ventas.
                        </p>
                    </header>

                    <div className="promo-details-v2">
                        <div className="location-card-v2">
                            <p className="location-heading-v2">Visítanos y vive la experiencia:</p>
                            <address className="location-body-v2">
                                <strong>Edificio Connexity</strong><br />
                                Av. Alfonso Reyes, Local 11<br />
                                Monterrey Sur, N.L.
                            </address>
                        </div>
                    </div>

                    <div className="promo-actions-v2">
                        <a
                            href="https://wa.me/528123852034"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="promo-btn-v2"
                        >
                            Agendar Recorrido VR
                            <FontAwesomeIcon icon={faChevronRight} className="btn-icon-v2" />
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default PromoVirtualV2;
