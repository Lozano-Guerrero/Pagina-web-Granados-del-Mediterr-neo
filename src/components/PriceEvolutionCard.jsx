
import React, { useState, useEffect } from 'react';
import './PriceEvolutionCard.css';

const DATA_URL = 'https://n8n.srv894483.hstgr.cloud/webhook/lotes-json';

const PriceEvolutionCard = () => {
    const [stats, setStats] = useState({
        minPrice: 0,
        availableCount: 0,
        totalLots: 0,
        loading: true
    });

    const [displayedPrice, setDisplayedPrice] = useState(0);

    // Fetch data logic similar to InteractiveMapV2
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(DATA_URL); // simple fetch
                if (!response.ok) throw new Error('Network response was not ok');

                const jsonData = await response.json();

                // Normalize rows matching InteractiveMapV2 logic
                let rows = [];
                if (Array.isArray(jsonData)) rows = jsonData[0]?.json ? jsonData.map(x => x.json) : jsonData;
                else if (jsonData?.data) rows = jsonData.data;
                else if (jsonData?.items) rows = jsonData.items.map(x => x.json ?? x);
                else if (jsonData?.rows) rows = jsonData.rows;
                else rows = Array.isArray(jsonData) ? jsonData : [];

                // Calculate stats
                const available = rows.filter(r => (r.estado || '').toLowerCase() === 'disponible');

                // Parse prices (handling costo_m2 and costo)
                const prices = available
                    .map(r => {
                        const raw = r.costo_m2 || r.costo || '0';
                        return parseFloat(raw.toString().replace(/[^0-9.]/g, ''));
                    })
                    .filter(p => !isNaN(p) && p > 0);

                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                // Simulated 'previous' price for animation context (e.g., 85% of current)
                // This gives the impression of "elevation" from a better price
                const startPrice = minPrice * 0.85;

                setStats({
                    minPrice,
                    availableCount: available.length,
                    totalLots: rows.length, // rough total
                    loading: false
                });

                // Start animation
                animateValue(startPrice, minPrice, 2000);

            } catch (error) {
                console.error("Error fetching price data:", error);
                setStats(s => ({ ...s, loading: false }));
            }
        };

        fetchData();
    }, []);

    const animateValue = (start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Ease-out expo function for smooth landing
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const current = start + (end - start) * easeOut;
            setDisplayedPrice(Math.floor(current));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    if (stats.loading || stats.minPrice === 0) {
        return <div className="price-evolution-card skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
        </div>;
    }

    const percentageSold = stats.totalLots > 0
        ? Math.round(((stats.totalLots - stats.availableCount) / stats.totalLots) * 100)
        : 0;

    return (
        <div className="price-evolution-card">
            <div className="pec-header">
                <span className="pec-badge">Alta Plusvalía</span>
                <span className="pec-live-indicator">
                    <span className="pec-dot"></span> Actualizado en tiempo real
                </span>
            </div>

            <div className="pec-price-container">
                <div className="pec-label">Precio por m² desde:</div>
                <div className="pec-value-wrapper">
                    <span className="pec-currency">$</span>
                    <span className="pec-amount">{displayedPrice.toLocaleString('es-MX')}</span>
                    <span className="pec-unit">MXN</span>
                </div>
                <div className="pec-trend">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    <span>Tendencia al alza</span>
                </div>
            </div>

            <div className="pec-divider"></div>

            <div className="pec-counter-section">
                <div className="pec-counter-info">
                    <span className="pec-count">{stats.availableCount}</span>
                    <span className="pec-count-label">lotes disponibles con precio actual</span>
                </div>

                <div className="pec-scarcity-bar">
                    <div
                        className="pec-progress"
                        style={{ width: `${100 - (stats.availableCount / (stats.totalLots || 100) * 100)}%` }} // width represents Sold % or scarcity
                    ></div>
                </div>
                <p className="pec-urgency-text">¡Asegura tu plusvalía antes del próximo ajuste!</p>
            </div>
        </div>
    );
};

export default PriceEvolutionCard;
