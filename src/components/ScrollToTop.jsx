// src/components/ScrollToTop.jsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
 
/**
 * Componente que fuerza el scroll al inicio de la página (0, 0)
 * cada vez que la ruta (pathname) cambia.
 * * Se debe usar envolv iendo el <Routes> o el <Router> principal.
 */
const ScrollToTop = () => {
    // El hook useLocation nos permite acceder al pathname (la ruta actual)
    const { pathname } = useLocation();

    useEffect(() => {
        // Esta función se ejecuta cada vez que 'pathname' cambia
        window.scrollTo(0, 0);
    }, [pathname]); // Dependencia: re-ejecutar cuando la ruta cambie

    // Este componente no renderiza nada visible, solo maneja el efecto secundario.
    return null;
};

export default ScrollToTop;