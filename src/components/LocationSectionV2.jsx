import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faRoad, faHospital, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './LocationSectionV2.css';

// Datos clave de ubicación
const keyFacts = [
    {
        icon: faRoad,
        title: 'Conectividad Total',
        detail: 'A solo 2.5 km',
        description: 'Acceso inmediato a la Carretera Nacional, facilitando tus traslados diarios.'
    },
    {
        icon: faMapMarkerAlt,
        title: 'Cercanía al Corazón',
        detail: '6.5 km',
        description: 'A pocos minutos del centro de Montemorelos, donde la vida social y comercial sucede.'
    },
    {
        icon: faHospital,
        title: 'Bienestar y Salud',
        detail: '4.5 km',
        description: 'La tranquilidad de estar cerca del Hospital General para cualquier necesidad médica.'
    },
];

const LocationSectionV2 = () => {
    return (
        <section className="location-section-v2">
            <div className="location-content-wrapper-v2">
                <header className="location-header-v2">
                    <span className="section-tag-v2">Conexión y Entorno</span>
                    <h2 className="location-title-v2">Todo lo que necesitas, siempre a tu alcance</h2>
                    <br /><p className="location-subtitle-v2">
                        Granados del Mediterráneo combina la serenidad del campo con la infraestructura urbana que tu familia merece.
                    </p>
                </header>

                <div className="location-facts-grid-v2">
                    {keyFacts.map((fact, index) => (
                        <article key={index} className="location-fact-item-v2" style={{ transitionDelay: `${index * 0.1}s` }}>
                            <div className="icon-box-v2">
                                <FontAwesomeIcon icon={fact.icon} />
                            </div>
                            <h3 className="fact-item-title-v2">{fact.title}</h3>
                            <div className="fact-item-detail-v2">{fact.detail}</div>
                            <p className="fact-item-desc-v2">{fact.description}</p>
                        </article>
                    ))}
                </div>

                <div className="location-footer-v2">
                    <a href="#mapa" className="cta-location-link-v2">
                        Explorar mapa interactivo
                        <FontAwesomeIcon icon={faChevronRight} />
                    </a>
                </div>
            </div>
        </section>
    );
};

export default LocationSectionV2;
