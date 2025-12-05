// src/components/PromoVirtual.jsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Importamos solo los íconos necesarios (faEye y faMapMarkerAlt, aunque solo usaremos faEye visualmente)
import { faEye, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'; 
import './PromoVirtual.css'; 

// Sustituir por la ruta real de tu imagen de RV
const VR_IMAGE_URL = "../../img/RVimg.png"; 

// Separamos la dirección en líneas para facilitar el estilizado en el CSS
const OFFICE_LOCATION_LINE_1 = "Edificio Connexity, Av. Alfonso Reyes";
const OFFICE_LOCATION_LINE_2 = "Local 11, Monterrey Sur, 64920";
const OFFICE_LOCATION_LINE_3 = "Monterrey, N.L.";

const PromoVirtual = () => {
    return (
        // 🛑 CORRECCIÓN CLAVE: Eliminar la clase vr-promo-section para que el fondo gris no se aplique a toda la pantalla
        // Le agregamos una clase simple para aplicar estilos de margen si es necesario, pero el fondo lo quitamos.
        <section className="promo-container-wrapper">
            <div className="vr-promo-content">
                
                {/* 1. CONTENEDOR DE IMAGEN */}
                <div className="vr-image-container">
                    <img 
                        src={VR_IMAGE_URL} 
                        alt="Persona experimentando tour de realidad virtual" 
                        className="vr-experience-image"
                    />
                </div>
                
                {/* 2. CONTENEDOR DE TEXTO Y ACCIÓN */}
                <div className="vr-text-container">
                    
                    {/* Contenedor del Título y el Ícono para controlar su alineación */}
                    <div className="title-block">
                        <FontAwesomeIcon icon={faEye} className="icon-vr" />
                        <h2 className="vr-title">
                            Experimenta el Proyecto en Realidad Virtual.
                        </h2>
                    </div>

                    <p className="subtitle">
                        No esperes más. Conoce cada detalle de tu futura propiedad y las amenidades del desarrollo desde la comodidad de nuestra oficina de ventas.
                    </p>
                    
                    {/* Contenedor de la dirección */}
                    <div className="location-detail">
                        {/* 🛑 AJUSTE: Quitamos el ícono de FontAwesome y usamos texto simple y etiquetas <strong> */}
                        <p className="location-label">
                            Disponible en nuestras oficinas en:
                        </p>
                        <p className="location-address">
                            <strong>{OFFICE_LOCATION_LINE_1}</strong><br/>
                            <strong>{OFFICE_LOCATION_LINE_2}</strong><br/>
                            <strong>{OFFICE_LOCATION_LINE_3}</strong>
                        </p>
                    </div>
                    
                    {/* Botón de Acción */}
                    <a 
                        href="https://wa.me/528123852034?text=" // Enlazar al formulario de contacto
                        className="btn-vr-agenda"
                    >
                        Agenda un Recorrido en Realidad Virtual
                    </a>
                </div>
            </div>
        </section>
    );
};

export default PromoVirtual;