import React, { useState } from 'react';
import './ContactSectionV2.css';

const ContactSectionV2 = () => {
    // Map URL from instructions
    const mapUrl = "https://www.google.com/maps/place/Edificio+Connexity,+Sin+Nombre+de+Col+39,+Monterrey,+N.L./@25.6298573,-100.3040236,303m/data=!3m1!1e3!4m15!1m8!3m7!1s0x8662bfaabda6dd79:0x98c270cc928941ab!2sEdificio+Connexity,+Sin+Nombre+de+Col+39,+Monterrey,+N.L.!3b1!8m2!3d25.630086!4d-100.3035008!16s%2Fg%2F11mcy2j3ch!3m5!1s0x8662bfaabda6dd79:0x98c270cc928941ab!8m2!3d25.630086!4d-100.3035008!16s%2Fg%2F11mcy2j3ch!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDIyNC4wIKXMDSoASAFQAw%3D%3D";

    // Form logic state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');

        const ENDPOINT_URL = 'https://granadosdelmediterraneo.com/api/email/send-form';
        const payload = {
            nombre: formData.name,
            email: formData.email,
            mensaje: formData.message,
            telefono: formData.phone,
        };

        try {
            const response = await fetch(ENDPOINT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contacto-v2" className="contact-section-v2-wrapper">
            <div className="contact-section-v2-container">

                {/* --- Left Column: Form --- */}
                <div className="contact-form-box-v2">
                    <h2 className="contact-title-v2">AGENDA UN RECORRIDO PRIVADO</h2>
                    <p className="contact-desc-v2">
                        Déjanos tus datos y un asesor se comunicará contigo de inmediato para
                        brindarte información detallada sobre la disponibilidad y planes de
                        financiamiento.
                    </p>

                    <form className="contact-form-v2" onSubmit={handleSubmit}>
                        {status === 'success' && (
                            <div className="contact-alert-v2 contact-success-v2">
                                ¡Mensaje enviado con éxito! Nos comunicaremos contigo a la brevedad.
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="contact-alert-v2 contact-error-v2">
                                Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo.
                            </div>
                        )}
                        <div className="input-group-full-v2">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                                required
                            />
                        </div>
                        <div className="input-group-half-v2">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Correo electrónico"
                                required
                            />
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Número celular"
                                required
                            />
                        </div>
                        <div className="input-group-full-v2">
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Mensaje"
                                rows="3"
                                required
                            ></textarea>
                        </div>
                        <div className="contact-form-submit-v2">
                            <button type="submit" className="btn-submit-v2" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- Right Column: Office Info --- */}
                <div className="contact-office-box-v2">
                    <h2 className="office-title-v2">
                        Visítanos en nuestras oficinas en Monterrey.
                    </h2>
                    <p className="office-desc-v2">
                        Dirección: Edificio Connexity, Av. Alfonso Reyes Local 11,<br />
                        Monterrey Sur, 64920 Monterrey, N.L.
                    </p>

                    <div className="office-card-v2">
                        <img
                            src="/img/tower.png"
                            alt="Edificio Connexity Monterrey"
                            className="office-img-v2"
                        />
                        <div className="office-card-overlay-v2">
                            <p className="office-overlay-text-v2">
                                Te invitamos a conocer todos los detalles de nuestro proyecto y modelos de inversión en nuestra oficina de ventas.
                            </p>
                            <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-map-v2"
                            >
                                ¿Como llego ahi?
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ContactSectionV2;
