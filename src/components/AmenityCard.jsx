// src/components/AmenityCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AmenityCard.css';

const AmenityCard = ({ title, description, imageUrl, linkUrl, isReversed = false }) => {
    const cardClass = `amenity-card ${isReversed ? 'reversed' : ''}`;
    
    return (
        <div className={cardClass}>
            {/* Contenedor de Imagen */}
            <div className="amenity-image-container">
                <img 
                    src={imageUrl} 
                    alt={`Vista de ${title}`} 
                    className="amenity-image" 
                    loading="lazy" 
                />
            </div>
            
            {/* Contenedor de Contenido */}
            <div className="amenity-content">
                <h3 className="amenity-title">{title}</h3>
                <p className="amenity-description">{description}</p>
                <Link to={linkUrl} className="amenity-detail-button">
                    Ver Más Detalles 
                </Link>
            </div>
        </div>
    );
};

export default AmenityCard;