// src/layouts/Footer.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faMapMarkerAlt, 
    faPhone, 
    faEnvelope 
} from '@fortawesome/free-solid-svg-icons';
import { 
    faFacebookF, 
    faInstagram, 
    faWhatsapp 
} from '@fortawesome/free-brands-svg-icons';
import './Footer.css'; // Debes crear este archivo CSS

const Footer = () => {

    // Datos Fijos del Proyecto (Ajusta estos valores)
    const COMPANY_NAME = "Granados del Mediterráneo";
    const ADDRESS = "Edificio Connexity, Av. Alfonso Reyes Local 11, Monterrey, N.L.";
    const PHONE = "+52 81 1234 5678";
    const EMAIL = "contacto@granadosdelmediterraneo.com";
    const WHATSAPP_LINK = "https://wa.me/528123852034?text="; // Reemplaza con tu número real
    const MAPS_LINK = "https://www.google.com/maps/dir//Ubify,+Edificio+Connexity,+Av.+Alfonso+Reyes+Local+11,+Monterrey+Sur,+64920+Monterrey,+N.L./@25.8077333,-100.7403946,11z/data=!4m18!1m8!3m7!1s0x8662bfcfc38d7bd3:0xa20fd5a039bfffc8!2sUbify!8m2!3d25.630086!4d-100.3035008!15sCj9FZGlmaWNpbyBDb25uZXhpdHksIEF2LiBBbGZvbnNvIFJleWVzIExvY2FsIDExLCBNb250ZXJyZXksIE4uTC6SARNob3VzaW5nX2RldmVsb3BtZW50qgGUARABKjAiLGVkaWZpY2lvIGNvbm5leGl0eSBhdiBhbGZvbnNvIHJleWVzIGxvY2FsIDExKA4yHxABIhu_fwhDploP0IwZnOsdzZs9z7svUP7ifnEngLYyPRACIjllZGlmaWNpbyBjb25uZXhpdHkgYXYgYWxmb25zbyByZXllcyBsb2NhbCAxMSBtb250ZXJyZXkgbmzgAQA!16s%2Fg%2F11shn_jqsc!4m8!1m0!1m5!1m1!1s0x8662bfcfc38d7bd3:0xa20fd5a039bfffc8!2m2!1d-100.3035008!2d25.630086!3e0?entry=ttu&g_ep=EgoyMDI1MTExNy4wIKXMDSoASAFQAw%3D%3D"; // Reemplaza con tu enlace

    return (
        // Contenedor principal con el color Terracota
        <footer className="SHP-footer-main">
            <div className="SHP-footer-container">

                {/* Columna 1: Contacto e Información de Marca */}
                <div className="SHP-footer-col SHP-col-brand">
              
                    <p className="SHP-brand-name">{COMPANY_NAME}</p>
                    
                    <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="SHP-contact-item">
                        <FontAwesomeIcon icon={faMapMarkerAlt} /> 
                        <span>{ADDRESS}</span>
                    </a>
                    
                    <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="SHP-contact-item">
                        <FontAwesomeIcon icon={faPhone} /> 
                        <span>{PHONE}</span>
                    </a>
                    
                    <a href={`mailto:${EMAIL}`} className="SHP-contact-item">
                        <FontAwesomeIcon icon={faEnvelope} /> 
                        <span>{EMAIL}</span>
                    </a>
                </div>

                {/* Columna 2: Navegación Rápida */}
                <div className="SHP-footer-col">
                    <h4 className="SHP-col-title">Explora</h4>
                    <ul className="SHP-footer-links">
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/proyecto">El Proyecto</a></li>
                        <li><a href="/precios">Disponibilidad de Lotes</a></li>
                        <li><a href="/galeria">Amenidades</a></li>
                        <li><a href="/Contacto">Contacto</a></li>
                    </ul>
                </div>

                {/* Columna 3: Legal y Ayuda *
                <div className="SHP-footer-col">
                    <h4 className="SHP-col-title">Legal</h4>
                    <ul className="SHP-footer-links">
                        <li><a href="/avisos/privacidad">Aviso de Privacidad</a></li>
                        <li><a href="/avisos/terminos">Términos y Condiciones</a></li>
                        <li><a href="/preguntas">Preguntas Frecuentes</a></li>
                        <li><a href="/financiamiento">Planes de Financiamiento</a></li>
                    </ul>
                </div>
                /}
                {/* Columna 4: Redes Sociales */}
                <div className="SHP-footer-col SHP-col-social">
                    <h4 className="SHP-col-title">Síguenos</h4>
                    <div className="SHP-social-icons">
                        <a href="https://www.facebook.com/profile.php?id=61581870316206" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <FontAwesomeIcon icon={faFacebookF} />
                        </a>
                        <a href="https://www.instagram.com/granadosmediterraneo/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <FontAwesomeIcon icon={faInstagram} />
                        </a>
                        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                            <FontAwesomeIcon icon={faWhatsapp} />
                        </a>
                    </div>
                    {/* Botón de Contacto Destacado */}
                     <a href="/contacto" className="SHP-cta-button">
                        Agenda una Visita
                    </a>
                </div>
            </div>

            {/* Fila de Derechos de Autor (sección inferior) */}
            <div className="SHP-footer-bottom">
                <p>
                    Derechos Reservados © {new Date().getFullYear()} {COMPANY_NAME}. Diseño y Desarrollo por Lozano Guerrero Group.
                </p>
            </div>
        </footer>
    );
};

export default Footer;