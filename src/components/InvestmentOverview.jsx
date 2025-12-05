// src/components/InvestmentOverview.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './InvestmentOverview.css'; 
// ... datos investmentData ... (Mantener sin cambios)

const investmentData = [
    // ... (Tu array de datos) ...
    // Asegúrate de que los datos tienen el campo 'stage'
    {
        stage: 'Early Bird (1ª Etapa)',
        stageTag: '¡ÚLTIMOS LOTES!',
        // ... (resto de los datos) ...
    },
    // ...
];


const InvestmentOverview = () => {
    
    return (
        <div className="investment-overview">
            <h3 className="investment-heading">Panorama de Inversión por Etapa y Tipo de Lote</h3>
            
            <div className="investment-grid">
                {investmentData.map((item, index) => {
                    
                    // LÓGICA CLAVE DE DESTAQUE
                    const isCurrentStage = index === 0;
                    const cardClasses = `investment-card ${isCurrentStage ? 'current-stage-card' : ''}`;
                    
                    return (
                        <div key={index} className={cardClasses}>
                            <div className="card-stage-header">
                                {/* Clase para destacar la etiqueta (EJ. ¡ÚLTIMOS LOTES!) */}
                                <span className={`stage-tag ${isCurrentStage ? 'tag-highlight' : ''}`}>{item.stageTag}</span>
                                <p className="stage-date">{item.date}</p>
                            </div>
                            
                            <div className="card-price-body">
                                {/* NUEVO: Nombre de la etapa con destaque */}
                                <p className={`stage-name ${isCurrentStage ? 'name-highlight' : ''}`}>{item.stage}</p> 
                                
                                <div className="lot-price-details">
                                    {item.lotTypes.map((lot, lotIndex) => (
                                        <div key={lotIndex} className="lot-price-item">
                                            <span className="lot-type">{lot.type}:</span>
                                            <span className="price-tag">{lot.price}</span> 
                                        </div>
                                    ))}
                                </div>
                                <p className={`callout ${isCurrentStage ? 'callout-highlight' : ''}`}>{item.callout}</p>
                            </div>
                            
                            <ul className="benefits-list">
                                {item.benefits.map((benefit, bIndex) => (
                                    <li key={bIndex}>{benefit}</li>
                                ))}
                            </ul>
                            {/* ... */}
                        </div>
                    );
                })}
            </div>

            {/* ... (Resto del componente sin cambios) ... */}
            <div className="investment-cta-container">
                <Link to="/precios" className="global-investment-cta">
                    Ver Disponibilidad de Lotes
                </Link>
            </div>
            
            <p className="disclaimer">
                *Precios mostrados por metro cuadrado (m²) para lotes tipo A, AA y AAA según la etapa vigente. 
                El tamaño mínimo de lote es de 350 m² (Lote Tipo A), consulte existencias.
                Los precios y la disponibilidad están sujetos a cambio sin previo aviso.
            </p>
        </div>
    );
};

export default InvestmentOverview;