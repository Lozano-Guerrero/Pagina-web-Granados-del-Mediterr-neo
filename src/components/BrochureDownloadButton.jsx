// src/components/BrochureDownloadButton.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons'; 
import './BrochureDownloadButton.css'; 

// --- CONFIGURACIÓN DE RUTAS Y BREAKPOINT ---
const BROCHURE_PATH_DESKTOP = '/brochureHorizontal.pdf'; 
const BROCHURE_PATH_MOBILE = '/brochureVertical.pdf'; 
const BREAKPOINT = 900; // Define el límite en píxeles para considerar móvil/escritorio

/**
 * Hook personalizado para determinar si es vista móvil
 * basado en el ancho de la ventana.
 */
const useIsMobile = (breakpoint) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Escuchar el evento de redimensionamiento de la ventana
        window.addEventListener('resize', handleResize);
        
        // Limpiar el event listener al desmontar el componente
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};


/**
 * Componente reutilizable para descargar el Brochure.
 * El archivo descargado cambia según el tamaño de la pantalla.
 * @param {string} className - Clase CSS adicional para estilizado contextual.
 * @param {string} text - Texto del botón (por defecto: "Descargar Brochure").
 */
const BrochureDownloadButton = ({ className = '', text = 'Descargar Brochure' }) => {
    
    const isMobile = useIsMobile(BREAKPOINT);
    
    // 💡 Lógica Condicional: 
    // Si es móvil (isMobile es true), usa BROCHURE_PATH_MOBILE, 
    // si es escritorio (isMobile es false), usa BROCHURE_PATH_DESKTOP.
    const BROCHURE_PATH = isMobile ? BROCHURE_PATH_MOBILE : BROCHURE_PATH_DESKTOP;

    return (
        <a 
            href={BROCHURE_PATH} 
            download
            className={`download-button ${className}`} // Aplica la clase base y la clase contextual
            // Es buena práctica mantener target="_blank" aunque download fuerce la descarga.
            target="_blank" 
            rel="noopener noreferrer"
        >
            <FontAwesomeIcon icon={faDownload} style={{ marginRight: '10px' }} />
            {text}
        </a>
    );
};

export default BrochureDownloadButton;