// src/components/AmenitiesCardsV2.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AmenitiesCardsV2.css';

const AMENITIES = [
    {
        title: "PARQUE LINEAL",
        shortDesc: "Senderos, naturaleza y áreas de recreación al aire libre.",
        longDesc: "Espacios diseñados para la convivencia familiar y el contacto con la naturaleza, incluyendo áreas de picnic, juegos infantiles y senderos ecológicos.",
        image: '/img/amenidades/parque_lineal/Jardinbot.jpg',
        path: '/amenidades/parque-lineal'
    },
    {
        title: "CASA CLUB",
        shortDesc: "El corazón social y deportivo del desarrollo.",
        longDesc: "Este espacio arquitectónico con estilo mediterráneo alberga la alberca, gimnasio, salón de eventos y áreas de recreación social y familiar.",
        image: '/img/amenidades/casa_club/Asacasa.jpg',
        path: '/amenidades/casa-club'
    },
    {
        title: "LAGOON CLUB",
        shortDesc: "Playa artificial, deportes acuáticos y fogateros.",
        longDesc: "Disfruta de la vida de playa sin salir del club. Nuestro Lagoon Club ofrece una laguna cristalina, área de asadores, fogateros y canchas de arena.",
        image: '/img/amenidades/lagoon_club/Fachadalagoon.jpg',
        path: '/amenidades/lagoon-club'
    }
];

const AmenitiesCardsV2 = () => {
    return (
        <section className="amenities-v2-section" id="amenidades">
            <h2 className="amenities-v2-title">Conoce nuestras amenidades</h2>
            <div className="amenities-v2-grid">
                {AMENITIES.map((item, index) => (
                    <div className="amenity-v2-card" key={index}>
                        <Link to={item.path} className="amenity-v2-image-box">
                            <img src={item.image} alt={item.title} className="amenity-v2-img" />
                            <div className="amenity-v2-overlay">
                                <div className="amenity-v2-overlay-content">
                                    <h3 className="amenity-v2-card-title">{item.title}</h3>
                                    <p className="amenity-v2-card-tagline">{item.shortDesc}</p>
                                    <span className="amenity-v2-link">Ver Detalle &rarr;</span>
                                </div>
                            </div>
                        </Link>
                        <div className="amenity-v2-bottom-content">
                            <p className="amenity-v2-long-desc">{item.longDesc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AmenitiesCardsV2;
