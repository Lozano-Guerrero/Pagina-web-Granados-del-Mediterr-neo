
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faHandHoldingUsd, faClock } from '@fortawesome/free-solid-svg-icons';
import './LotTypeCards.css';

const DATA_URL = 'https://n8n.srv894483.hstgr.cloud/webhook/lotes-json';

const LotTypeCards = () => {
    const [prices, setPrices] = useState({
        A: 0,
        AA: 0,
        AAA: 0,
        loading: true
    });
    const [displayedPrices, setDisplayedPrices] = useState({
        A: 0,
        AA: 0,
        AAA: 0
    });

    const animateValue = (type, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOut);

            setDisplayedPrices(prev => ({
                ...prev,
                [type]: current
            }));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await fetch(DATA_URL);
                if (!response.ok) throw new Error('Network response was not ok');
                const jsonData = await response.json();

                let rows = [];
                if (Array.isArray(jsonData)) rows = jsonData[0]?.json ? jsonData.map(x => x.json) : jsonData;
                else if (jsonData?.data) rows = jsonData.data;
                else if (jsonData?.items) rows = jsonData.items.map(x => x.json ?? x);
                else if (jsonData?.rows) rows = jsonData.rows;
                else rows = Array.isArray(jsonData) ? jsonData : [];

                const getMinPrice = (type) => {
                    const typeRows = rows.filter(r =>
                        (r.estado || '').toLowerCase() === 'disponible' &&
                        (r.tipo || '').toUpperCase() === type
                    );

                    if (typeRows.length === 0) return 0;

                    const prices = typeRows.map(r => {
                        const raw = r.costo_m2 || r.costo || '0';
                        return parseFloat(raw.toString().replace(/[^0-9.]/g, ''));
                    }).filter(p => !isNaN(p) && p > 0);

                    return prices.length > 0 ? Math.min(...prices) : 0;
                };

                const finalPrices = {
                    A: getMinPrice('A'),
                    AA: getMinPrice('AA'),
                    AAA: getMinPrice('AAA')
                };

                setPrices({
                    ...finalPrices,
                    loading: false
                });

                Object.keys(finalPrices).forEach(type => {
                    if (finalPrices[type] > 0) {
                        animateValue(type, finalPrices[type] * 0.85, finalPrices[type], 2000);
                    }
                });

            } catch (error) {
                console.error("Error fetching prices:", error);
                setPrices(p => ({ ...p, loading: false }));
            }
        };

        fetchPrices();
    }, []);

    const cards = [
        { type: 'A', price: displayedPrices.A, badge: 'PLUSVALÍA INTER...' },
        { type: 'AA', price: displayedPrices.AA, badge: 'CERCA DE AMENI...' },
        { type: 'AAA', price: displayedPrices.AAA, badge: 'VISTAS PANORÁM...' }
    ];

    if (prices.loading) {
        return (
            <div className="lot-type-cards-wrapper">
                <div className="lot-type-card skeleton"></div>
                <div className="lot-type-card skeleton"></div>
                <div className="lot-type-card skeleton"></div>
            </div>
        );
    }

    return (
        <section className="lot-type-cards-section">
            <div className="lot-type-cards-container">
                {cards.map((card) => (
                    <div key={card.type} className={`lot-type-card type-${card.type}`}>
                        <div className="ltc-header">
                            <span className="ltc-type">TIPO {card.type}</span>
                            <span className="ltc-badge">{card.badge}</span>
                        </div>

                        <div className="ltc-price-block">
                            <span className="ltc-label">Desde</span>
                            <div className="ltc-price-value">
                                <span className="ltc-currency">$</span>
                                <span className="ltc-amount">
                                    {card.price > 0 ? card.price.toLocaleString('es-MX') : 'Consultar'}
                                </span>
                                <span className="ltc-unit">/m²</span>
                            </div>
                        </div>

                        <div className="ltc-divider"></div>

                        <div className="ltc-financing-single">
                            <FontAwesomeIcon icon={faCreditCard} className="ltc-fin-icon-large" />
                            <div className="ltc-fin-text-large">
                                <strong>40 MESES</strong>
                                <span>SIN INTERESES</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default LotTypeCards;
