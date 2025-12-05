// src/components/PriceGrid.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './PriceGrid.css';

// --- CONFIGURACIÓN ---
const API_URL = 'https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1';

// Información estática (Nota: Cambié ligeramente el orden del array estático o usamos CSS order para acomodarlos)
const STATIC_LOT_INFO = [
    { 
        type: 'A', 
        apiKey: 'tipo_A',
      
        sizeRange: 'Desde 1500 m²', 
        detail: 'Plusvalía interior, acceso rápido.' 
    },
    { 
        type: 'AA', 
        apiKey: 'tipo_AA',
        
        sizeRange: 'Desde 1500 m²', 
        detail: 'Cerca de amenidades y áreas verdes.' 
    },
    { 
        type: 'AAA', 
        apiKey: 'tipo_AAA',
       
        sizeRange: 'Desde 1500 m²', 
        detail: 'Vistas panorámicas o esquinas exclusivas.' 
    }
];

const TEXT_CONTENT = {
    title: 'Precios de lanzamiento: Su oportunidad exclusiva',
    tagline: 'Asegure su inversión con las tarifas vigentes por metro cuadrado. ¡Cupo limitado!'
};

const PriceGrid = () => {
    const [activeLotType, setActiveLotType] = useState(STATIC_LOT_INFO[0].type);
    const [showNotification, setShowNotification] = useState(true);
    const [prices, setPrices] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('Error al obtener precios');
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setPrices(data[0]);
                }
            } catch (error) {
                console.error("Error cargando precios:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, []);

    const lots = useMemo(() => {
        return STATIC_LOT_INFO.map(lot => {
            const dynamicPrice = prices ? prices[lot.apiKey] : null;
            return {
                ...lot,
                priceM2: dynamicPrice || (loading ? null : 'Consultar') 
            };
        });
    }, [prices, loading]);

    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => setShowNotification(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [showNotification]);

    const formatPrice = (val) => {
        if (!val) return '...';
        if (typeof val === 'string') return val;
        return `$${val.toLocaleString('es-MX')}`;
    };

    return (
        <div className="price-grid-container">
            <div className="stage-section current-stage">
                
                <div className="stage-header-wrapper">
                    <h2 className="stage-title price-highlight">{TEXT_CONTENT.title}</h2>
                    <p className="stage-tagline">{TEXT_CONTENT.tagline}</p>
                    
                    <Link to="/Contacto" className="agenda-visit-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1H2V3zm12 12H2a1 1 0 0 1-1-1V5h14v9a1 1 0 0 1-1 1z"/>
                        </svg>
                        Agendar Visita
                    </Link>
                </div>
                
                {/* NOTIFICACIÓN (Solo visible en Móvil normalmente o si se desea) */}
                {showNotification && (
                    <div className="floating-info-box fade-in-out mobile-only-notification">
                        <p>Selecciona un lote para ver detalles</p>
                        <button onClick={() => setShowNotification(false)} className="close-btn">&times;</button>
                    </div>
                )}
                
                {/* --- PESTAÑAS (SOLO MÓVIL) --- */}
                <div className="lot-tabs-navigation mobile-only-tabs">
                    {lots.map((lot) => (
                        <button 
                            key={lot.type} 
                            className={`tab-button ${activeLotType === lot.type ? 'active' : ''}`}
                            onClick={() => setActiveLotType(lot.type)}
                        >
                            <span className="tab-icon">{lot.icon}</span> 
                            <span className="tab-text">{lot.type}</span>
                        </button>
                    ))}
                </div>

                {/* --- CONTENEDOR DE TARJETAS (PODIUM EN DESKTOP, CARROUSEL EN MÓVIL) --- */}
                <div className="cards-podium-container">
                    {lots.map((lot) => {
                        const isActive = activeLotType === lot.type;
                        // En desktop siempre visible, en móvil solo si es active
                        return (
                            <div 
                                key={lot.type} 
                                className={`
                                    lot-card-wrapper 
                                    lot-type-${lot.type.toLowerCase()} 
                                    ${isActive ? 'is-active-mobile' : 'is-hidden-mobile'}
                                `}
                            >
                                <div className="lot-card-inner">
                                    <div className="lot-badge-icon">{lot.icon}</div>
                                    <h3 className="lot-card-title">TIPO {lot.type}</h3>
                                    
                                    <p className="lot-card-size">{lot.sizeRange}</p>
                                    
                                    <div className="lot-card-price">
                                        <span className="currency">$</span>
                                        <span className="amount">{formatPrice(lot.priceM2).replace('$','')}</span>
                                        <span className="unit">/m²</span>
                                    </div>

                                    <p className="lot-card-detail">{lot.detail}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default PriceGrid;