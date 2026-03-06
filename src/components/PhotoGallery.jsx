// src/components/PhotoGallery.jsx

import React, { useState } from 'react'; // ¡Asegúrate de incluir useState aquí!
import GalleryModal from './GalleryModal'; 
import './PhotoGallery.css';

// ... el resto del código ...
// Datos simulados para la galería. 
// En un proyecto real, estos vendrían de una API o un archivo de configuración.
const galleryItems = [
  { 
    id: 1, 
    slug: 'casa-club',
    title: 'Casa Club y Amenidades', 
    cover: 'img/casa1.jpg', 
    concept: 'El corazón social del proyecto. Más de 1000m² dedicados al esparcimiento.',
    technicalData: 'Superficie total: 1200 m² / Piscina semiolímpica / Salón de eventos para 150 personas.',
    images: [ // Array de imágenes para el slider interno
      { src: 'img/club/club_main.jpg', desc: 'Entrada principal de la Casa Club' },
      { src: 'img/club/piscina_club.jpg', desc: 'Vista de la piscina' },
      { src: 'img/club/salon_eventos.jpg', desc: 'Salón de eventos interior' },
    ],
  },
  { 
    id: 2, 
    slug: 'lagoon-club',
    title: 'Lagoon Club (Club de Playa)', 
    cover: '/img/galeria/lagoon-cover.jpg', 
    concept: 'Un oasis de arena blanca y agua cristalina, ideal para actividades acuáticas no motorizadas.',
    
    images: [
        { src: 'img/lagoon/lagoon_main.jpg', desc: 'Vista general del Lagoon Club',technicalData: 'Área de arena: 800 m² / carril de nado / Palapas privadas y asadores.' },
        { src: 'img/lagoon/palapas.jpg', desc: 'Palapas de descanso' , technicalData: 'Área de arena: 10000 m² / Profundidad máx: 1.5m / lagoon club'},
        { src: 'img/lagoon/arena.jpg', desc: 'Detalle de la arena' },
    ],
  },
  // ... Agregar datos para Parque Lineal, Distribucion, Vista Aerea
];
const PhotoGallery = () => {
  // Estado para controlar si el modal está abierto y qué item mostrar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };
  
  return (
    <section className="gallery-section">
      {/* ... Título y Subtítulo ... */}

      <div className="gallery-grid">
        {galleryItems.map((item) => (
          <div key={item.id} className={`gallery-item photo`}>
            {/* ... item-placeholder ... */}
            
            <div className="item-overlay">
              {/* ¡Cambiamos el Link a un botón que abre el modal! */}
              <button 
                className="details-link"
                onClick={() => openModal(item)} // Llama a la función de apertura
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* RENDERIZADO CONDICIONAL DEL MODAL */}
      {isModalOpen && selectedItem && (
        <GalleryModal item={selectedItem} onClose={closeModal} />
      )}
      
    </section>
  );
};

export default PhotoGallery;