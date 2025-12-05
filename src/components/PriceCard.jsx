// src/components/InvestmentOverview.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './InvestmentOverview.css';

// 🛑 DATOS DE INVERSIÓN CORREGIDOS: Ortografía, Gramática y Capitalización (Minúsculas salvo inicio de frase)
const investmentData = [
    {
        stage: 'Etapa 1: Early Bird',
        stageTag: '¡ÚLTIMOS LOTES!', // Se mantiene la mayúscula para la URGENCIA (Etiqueta)
        date: 'Cierre próximo',
        callout: '¡El mejor precio por m²! Asegure su lote hoy.', // Primera mayúscula
        lotTypes: [
            { type: 'Tipo A', price: '$600 m²' }, 
            { type: 'Tipo AA', price: '$700 m²' }, 
            { type: 'Tipo AAA', price: '$800 m²' } 
        ],
        benefits: ['Máximo descuento por m²', 'Selección preferencial de lotes', 'Lotes desde 350 m²*'] 
    },
    {
        stage: 'Etapa 2: Friends & Family',
        stageTag: 'Próxima etapa',
        date: 'Enero 2026',
        callout: 'Ahorre antes de la preventa general.',
        lotTypes: [
            { type: 'Tipo A', price: '$900 m²' }, 
            { type: 'Tipo AA', price: '$1,100 m²' }, 
            { type: 'Tipo AAA', price: '$1,300 m²' } 
        ],
        benefits: ['Inversión a precio preferencial', 'Planes de financiamiento flexibles', 'Lotes desde 350 m²*']
    },
    {
        stage: 'Etapa 3: Preventa General',
        stageTag: 'Proyectado',
        date: 'Mayo 2026',
        callout: 'El precio está sujeto a un incremento considerable (hasta $1,800 m²).', 
        lotTypes: [
            { type: 'Rango estimado', price: 'Desde $1,400 m²*' }, 
        ],
        benefits: ['Amplios planes de financiamiento', 'Planes a meses sin intereses', 'Reserve con menor inversión inicial']
    }
];


const InvestmentOverview = () => {
    
    return (
        <div className="investment-overview">
            {/* Título formal y legible */}
            <h3 className="investment-heading">Panorama de inversión por etapa y tipo de lote</h3>
            
            <div className="investment-grid">
                {investmentData.map((item, index) => {
                    
                    const isCurrentStage = index === 0;
                    // El CSS debe encargarse de reducir el tamaño si aún se ve grande
                    const cardClasses = `investment-card ${isCurrentStage ? 'current-stage-card' : ''}`;
                    
                    return (
                        <div key={index} className={cardClasses}>
                            <div className="card-stage-header">
                                <span className={`stage-tag ${isCurrentStage ? 'tag-highlight' : ''}`}>{item.stageTag}</span>
                                <p className="stage-date">{item.date}</p>
                            </div>
                            
                            <div className="card-price-body">
                                {/* Nombre de la etapa sin capitalización agresiva */}
                                <p className={`stage-name ${isCurrentStage ? 'name-highlight' : ''}`}>{item.stage}</p> 
                                
                                <div className="lot-price-details">
                                    {(item.lotTypes || []).map((lot, lotIndex) => (
                                        <div key={lotIndex} className="lot-price-item">
                                            {/* Los tipos de lote se mantienen capitalizados (Tipo A) por ser nombres propios de clasificación */}
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
                            
                        </div>
                    );
                })}
            </div>

            <div className="investment-cta-container">
                <Link to="/precios" className="global-investment-cta">
                    Ver disponibilidad de lotes
                </Link>
            </div>
            
            <p className="disclaimer">
                *Los precios mostrados son por metro cuadrado (m²) para lotes tipo A, AA y AAA según la etapa vigente. 
                El tamaño mínimo de lote es de 350 m² (lote tipo A), consulte existencias.
                Los precios y la disponibilidad están sujetos a cambio sin previo aviso.
            </p>
        </div>
    );
};

export default InvestmentOverview;