import React from 'react';
import { Link } from 'react-router-dom';
import './AmenityTrioHero.css';

// Datos de las Amenidades para la vista Hero
const AMENITIES_DATA = [
    {
        title: "Parque Lineal",
        tagline: "Senderos, naturaleza y áreas de recreación al aire libre.",
        image: '/img/amenidades/parque_lineal/Jardinbot.jpg',
        path: '/amenidades/parque-lineal',
    },
    {
        title: "Casa Club",
        tagline: "El corazón social y deportivo del desarrollo.",
        image: '/img/amenidades/casa_club/Asacasa.jpg',
        path: '/amenidades/casa-club',
    },
    {
        title: "Lagoon Club",
        tagline: "Playa artificial, deportes acuáticos y fogateros.",
        image: '/img/amenidades/lagoon_club/Fachadalagoon.jpg',
        path: '/amenidades/lagoon-club',
    },
];

const AmenityTrioHero = () => {
    return (
        <div className="amenity-trio-container">
            <h2 className="sr-only">Explora nuestras Amenidades Principales</h2>

            {AMENITIES_DATA.map((amenity) => (
                <Link 
                    key={amenity.title}
                    to={amenity.path}
                    className="amenity-trio-card"
                    style={{ backgroundImage: `url(${amenity.image})` }}
                >
                    <div className="trio-overlay">
                        <h3>{amenity.title}</h3>
                        <p>{amenity.tagline}</p>
                        <span className="view-more">Ver Detalle &rarr;</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default AmenityTrioHero;
