// src/pages/ContactPage.jsx - VERSIÓN FINAL Y MEJORADA CON LAYOUT DE 2 COLUMNAS
import React from 'react';
import ContactForm from '../../components/ContactForm';
import LocationMap from '../../components/LocationMap';
import OfficeInvitationSection from '../../components/OfficeInvitationSection'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faMapMarkerAlt, faPhoneAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons'; 
import './ContactPage.css';
import ContactHomePage from '../../components/section/ContactHomePage';

// --- ESTRUCTURAS DE DATOS ---

const CONTACT_DETAILS = [
    // El 'link' solo se usa para Teléfono y Email
    { icon: faPhoneAlt, label: 'Llámanos', detail: '+52 81 4166 0969', link: 'tel:+52 81 4166 0969' },
    { icon: faEnvelope, label: 'Escríbenos', detail: 'ventas@granadosdelmediterraneo.com', link: 'mailto:ventas@granadosdelmediterraneo.com' },
    { icon: faMapMarkerAlt, label: 'Ubicación', detail: 'Edificio Connexity, Av. Alfonso Reyes Local 11, Monterrey Sur, 64920 Monterrey, N.L.' },
];

const VALUE_PROPOSITION = [
    'Recibe el Brochure Digital Completo y Actualizado.',
    'Consulta Planes de Financiamiento Directo y Descuentos.',
    'Agenda un Tour Virtual o Visita Presencial del Desarrollo.',
    'Conoce el Precio Exacto por m² de los Lotes disponibles.'
];

// --- COMPONENTE PRINCIPAL ---

const ContactPage = () => {
    return (
        <div className="contact-page">
            
            {/* Encabezado Principal */}
            <header className="contact-hero">
                <h1>Hablemos de tu Mejor Inversión en Nuevo León.</h1>
            </header>

            {/* 🛑 CONTENEDOR DE TARJETAS (Layou de 2 columnas en PC / Apilado en Móvil) 🛑 */}
            <div className="contact-cards-container">
                
                {/* 🛑 1. SECCIÓN EXPERTOS / CONTACTO DIRECTO */}
                <section className="contact-section-wrapper contact-info-panel">
                    <div className="contact-panel-content">
                        <h2>Nuestros Expertos están Listos para Asesorarte.</h2>
                        <p className="subtitle">
                            Comunícate directamente con nuestro equipo de asesores inmobiliarios 
                            para resolver todas tus dudas sobre Granados.
                        </p>
                        
                        {/* Contenedor de Detalles de Contacto */}
                        <div className="direct-contact-details">
                            {CONTACT_DETAILS.map((item, index) => (
                                <div key={index} className="contact-detail-item">
                                    <FontAwesomeIcon icon={item.icon} className="detail-icon" />
                                    <div>
                                        
                                        {/* Ajuste ligero en la presentación del detalle */}
                                        <strong>{item.label} : </strong>
                                        {item.link ? (
                                            <a href={item.link}>{item.detail}</a>
                                        ) : (
                                            <span>{item.detail}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 🛑 2. SECCIÓN PROPUESTA DE VALOR / LO QUE OBTIENES */}
                <section className="contact-section-wrapper value-list-panel">
                    <div className="value-list">
                        <img 
    src="../../img/asesora.jpg" 
    alt="Contacto" 
    className="contact-header-image" 
  />

                        <h3>Accede a la Información Exclusiva al Contactarnos:</h3>
                        <ul>
                            {VALUE_PROPOSITION.map((item, index) => (
                                <li key={index}>
                                    <FontAwesomeIcon icon={faCheckCircle} className="check-icon" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
                
            </div>
            {/* 🛑 FIN DEL CONTENEDOR DE TARJETAS 🛑 */}

            {/* SECCIÓN DE MAPA/UBICACIÓN (Mantenemos la estructura original) */}
            <section className="location-section" id="map">
              <ContactHomePage/>
            </section>
        </div>
    );
};

export default ContactPage;