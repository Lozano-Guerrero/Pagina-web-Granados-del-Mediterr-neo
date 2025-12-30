// src/pages/precios/PricingPage.jsx
import React from 'react';
// Asegúrate de que esta ruta sea correcta para tu componente
import PriceGrid from '../../components/PriceGrid'; 
import './PricingPag.css';
import InteractiveMap from '../../components/InteractiveMap.jsx';
import FinancingHighlights from '../../components/FinancingHighlights.jsx';

// 🛑 RUTA DE IMAGEN: Usa la ruta de tu nuevo mapa de masterplan
const MASTERPLAN_IMAGE = '/img/masterplan.jpg'; 

const PricingPage = () => {
    return (
        <div className="pricing-page">
            
           

            {/* Sección de Precios (usando el PriceGrid) */}
            <section className="prices-section">
                
                    <div className="prices-disclaimer-box">
                        <p className="disclaimer-text">
  <strong>Nota importante:</strong> Los precios por m² aquí mostrados son precios base y están expresados en pesos mexicanos. 
  La disponibilidad de lotes, así como los precios y condiciones de venta, están 
  <strong> sujetos a cambios sin previo aviso </strong>. 
  Para recibir un plan de financiamiento personalizado y confirmar existencias, por favor, contacta a un asesor.
</p>
                    </div>
                <div className="prices-inner-container">
                   
                    
                    {/* 🛑 COMPONENTE PRINCIPAL */}
                    <PriceGrid />

                </div>
            </section>
             {/* Sección de Encabezado y Mapa */}
            <section className="map-section">
                <InteractiveMap/>
            </section>
            <section className='metodosdepago' ><FinancingHighlights /></section>

        </div>
    );
};

export default PricingPage;