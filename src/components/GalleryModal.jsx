// src/components/GalleryModal.jsx
import React, { useState } from 'react';
import './GalleryModal.css'; // Crearemos el CSS para que flote sobre la página

const GalleryModal = ({ item, onClose }) => {
  // Estado para manejar la imagen principal que se está viendo
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = item.images[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % item.images.length // Vuelve al inicio si llega al final
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex - 1 + item.images.length) % item.images.length // Vuelve al final si llega al inicio
    );
  };
  
  // Si la tecla ESC es presionada, cierra el modal
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* ÍCONO DE CIERRE (X) */}
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="modal-grid">
          
          {/* COLUMNA IZQUIERDA: Información y Contexto (color blanco) */}
          <div className="modal-info-panel">
            <h3>{item.title}</h3>
            <p className="modal-concept">{item.concept}</p>
            
            <div className="modal-technical-data">
              <h4>Datos Técnicos:</h4>
              <p>{currentImage.technicalData}</p>
              {/* Aquí puedes añadir un botón de Contacto o Descargar Brochure */}
            </div>
            
            <p className="current-image-desc">{currentImage.desc}</p>
          </div>
          
          {/* COLUMNA DERECHA: Galería Principal */}
          <div className="modal-gallery-panel">
            
            {/* IMAGEN PRINCIPAL */}
            <div className="main-image-container">
              {/* Aquí se cargaría la imagen actual */}
              <div className="main-image-placeholder">
                  [IMAGEN PRINCIPAL: {currentImage.src}]
              </div>

              {/* BOTONES DE NAVEGACIÓN */}
              <button className="nav-btn prev" onClick={prevImage}>&#10094;</button>
              <button className="nav-btn next" onClick={nextImage}>&#10095;</button>
            </div>

            {/* ZONA INFERIOR: MINIATURAS DE PREVISUALIZACIÓN */}
            <div className="thumbnails-container">
              {item.images.map((img, index) => (
                <div 
                  key={index} 
                  className={`thumbnail-item ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  {/* Placeholder de Miniatura */}
                  [Miniatura]
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;