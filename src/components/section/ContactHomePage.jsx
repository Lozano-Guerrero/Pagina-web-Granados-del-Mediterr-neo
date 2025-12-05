// src/components/ContactHomePage.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEnvelope, 
    faUser, 
    faPhone, 
    faPaperPlane, 
    faMapMarkerAlt, 
    faDirections 
} from '@fortawesome/free-solid-svg-icons';
import './ContactHomePage.css'; // Asegúrate de crear este archivo CSS

// 🛑 Sustituir por la ruta real de tu imagen de la torre
const TOWER_IMAGE_URL = "/img/tower.png"; 

const OFFICE_ADDRESS = "Edificio Connexity, Av. Alfonso Reyes Local 11, Monterrey Sur, 64920 Monterrey, N.L.";
// Se corrige la construcción del enlace de Google Maps. Se debe usar encodeURIComponent
const GOOGLE_MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(OFFICE_ADDRESS)}`;


const ContactHomePage = ({ lotesData }) => {
    
    // --- LÓGICA DEL FORMULARIO (Mantenida de ContactForm) ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        loteInteres: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error', 'idle'

    // Maneja los cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Lógica de envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');

        // 🛑 URL de tu API de Express
        const ENDPOINT_URL = 'https://granadosdelmediterraneo.com/api/email/send-form';

        // 🛑 Mapear los nombres de campo
        const payload = {
            nombre: formData.name,      // Frontend 'name' -> Backend 'nombre'
            email: formData.email,      // Email coincide
            mensaje: formData.message,  // Frontend 'message' -> Backend 'mensaje'
            telefono: formData.phone,
            loteInteres: formData.loteInteres,
        };

        try {
            const response = await fetch(ENDPOINT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload), 
            });

            const result = await response.json(); 

            if (response.ok) {
                setStatus('success');
                // Limpiar formulario
                setFormData({ name: '', email: '', phone: '', message: '', loteInteres: '' }); 
            } else {
                console.error("Error de la API:", result.error.message);
                setStatus('error');
            }
        } catch (error) {
            console.error('Error de conexión al enviar el formulario:', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Opciones de lotes disponibles
    const lotesOptions = Object.keys(lotesData || {}).filter(id => {
        const data = lotesData[id];
        return data && data.estado !== 'vendido';
    }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })); 
    
    // Contenido dinámico del botón de envío
    const buttonContent = isSubmitting ? 'Enviando...' : (
        <>
            <FontAwesomeIcon icon={faPaperPlane} /> Enviar Mensaje
        </>
    );

    // --- RENDERIZADO COMBINADO ---

    return (
        // Contenedor principal
        <section className="SHP-contact-section">
            
            {/* Contenedor que aplica el layout de 50/50 en escritorio */}
            <div className="SHP-layout-container">
                
                {/* Columna 1: Formulario de Contacto */}
                <div className="SHP-form-column">
                    <h2 className="SHP-contact-title">
                        Contáctanos e Inicia Tu Legado
                    </h2>
                    <p className="SHP-contact-subtitle">
                        Déjanos tus datos y un asesor se comunicará contigo de inmediato para brindarte información detallada sobre la disponibilidad y planes de financiamiento.
                    </p>
                    
                    {/* Mensajes de Estado */}
                    {status === 'success' && (
                        <div className="SHP-form-alert SHP-success">
                            ¡Mensaje enviado con éxito! Nos comunicaremos contigo a la brevedad.
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="SHP-form-alert SHP-error">
                            Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo o llámanos.
                        </div>
                    )}

                    <form className="SHP-contact-form" onSubmit={handleSubmit}>
                        
                        {/* Grupo 1: Nombre, Email, Teléfono */}
                        <div className="SHP-form-group-triple">
                            <div className="SHP-form-field">
                                <label htmlFor="name">Nombre Completo *</label>
                                <div className="SHP-input-with-icon">
                                    <FontAwesomeIcon icon={faUser} className="SHP-input-icon" />
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Tu nombre completo"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="SHP-form-field">
                                <label htmlFor="email">Correo Electrónico *</label>
                                <div className="SHP-input-with-icon">
                                    <FontAwesomeIcon icon={faEnvelope} className="SHP-input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="ejemplo@correo.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="SHP-form-field">
                                <label htmlFor="phone">Teléfono (WhatsApp)</label>
                                <div className="SHP-input-with-icon">
                                    <FontAwesomeIcon icon={faPhone} className="SHP-input-icon" />
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(81) 1234 5678"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Campo Lote de Interés */}
                        {lotesOptions.length > 0 && (
                            <div className="SHP-form-field">
                                <label htmlFor="loteInteres">Lote de Interés (Opcional)</label>
                                <select
                                    id="loteInteres"
                                    name="loteInteres"
                                    value={formData.loteInteres}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecciona un lote o deja vacío</option>
                                    {lotesOptions.map(id => (
                                        <option key={id} value={id}>Lote {id} - {lotesData[id]?.estado}</option>
                                    ))}
                                </select>
                            </div>
                        )}


                        {/* Campo de Mensaje */}
                        <div className="SHP-form-field">
                            <label htmlFor="message">Tu Mensaje</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Me gustaría saber más sobre la financiación o los lotes disponibles..."
                            ></textarea>
                        </div>

                        <button type="submit" className="SHP-submit-button" disabled={isSubmitting}>
                            {buttonContent}
                        </button>
                    </form>
                </div>
                
                {/* Columna 2: Invitación a la Oficina */}
                <div className="SHP-office-column">
                    <div className="SHP-office-content">
                        
                        {/* Contenedor de Texto */}
                        <div className="SHP-text-container">
                            <h3>
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="SHP-icon-marker" />
                                Visítanos en Nuestras Oficinas de Monterrey.
                            </h3>
                            <p className="SHP-description">
                                Te invitamos a conocer todos los detalles de nuestro proyecto y modelos de inversión en nuestra oficina de ventas.
                            </p>
                            <p className="SHP-address-detail">
                                <strong>Dirección:</strong> {OFFICE_ADDRESS}
                            </p>
                            
                            <a 
                                href={GOOGLE_MAPS_LINK} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="SHP-btn-directions"
                            >
                                <FontAwesomeIcon icon={faDirections} />
                                Cómo Llegar
                            </a>
                        </div>
                        
                        {/* Contenedor de Imagen */}
                        <div className="SHP-image-container">
                            <img 
                                src={TOWER_IMAGE_URL} 
                                alt="Oficina de ventas en Torre Connexity" 
                                className="SHP-office-tower-image"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ContactHomePage;