
import React, { useState, useEffect } from 'react';
import './PlusvaliaVariants.css';

const fetchPlusvaliaData = async () => {
    try {
        const response = await fetch('https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1');
        const responseData = await response.json();
        const root = (Array.isArray(responseData) && responseData[0]) ? (responseData[0].json || responseData[0]) : responseData;
        const rows = root.lotes || (Array.isArray(root) ? root : []);
        const summary = root.summary || {};

        const byRow = {};
        rows.forEach((row) => {
            const rn = Number(row?.row_number);
            if (Number.isFinite(rn)) byRow[rn] = row;
        });

        const parseNumeric = (value) => {
            if (value === null || value === undefined || value === '') return 0;
            const cleaned = String(value).replace(/[^0-9.]/g, '');
            const num = Number(cleaned);
            return Number.isNaN(num) ? 0 : num;
        };

        const startRow = byRow[13];
        const endRow = byRow[49];
        const startPrice = parseNumeric(startRow?.Separado ?? startRow?.separado);
        const endPrice = parseNumeric(endRow?.Separado ?? endRow?.separado);

        const configRow = byRow[3] || {};
        const aaHoy = parseNumeric(configRow?.AA ?? configRow?.aa ?? summary?.AA?.precio);
        const aaaHoy = parseNumeric(configRow?.AAA ?? configRow?.aaa ?? summary?.AAA?.precio);
        const todayPrice = (aaHoy > 0 && aaaHoy > 0) ? ((aaHoy + aaaHoy) / 2) : (aaHoy || aaaHoy || 0);

        return {
            startPrice: startPrice || 800,
            todayPrice: todayPrice || 1050,
            endPrice: endPrice || 1650
        };
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
};

const pesos = (value) => `$${Math.round(value).toLocaleString('es-MX')}`;

export const PlusvaliaGlass = () => {
    const [data, setData] = useState(null);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        fetchPlusvaliaData().then(d => {
            setData(d);
            setTimeout(() => setAnimated(true), 1000);
        });
    }, []);

    if (!data) return <div className="pv-loading">Cargando Glass...</div>;
    const { startPrice, todayPrice, endPrice } = data;

    return (
        <div className={`pv-variant pv-glass ${animated ? 'is-animated' : ''}`}>
            <div className="pv-glass-blob"></div>
            <div className="pv-content">
                <header>
                    <h3>Inversión Inteligente</h3>
                    <div className="pv-glass-price">{pesos(todayPrice)} <small>/ m²</small></div>
                </header>
                <div className="pv-chart-svg">
                    <svg viewBox="0 0 400 150">
                        <defs>
                            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path className="pv-path-area" d="M 40 130 Q 140 120, 200 80 T 360 20 L 360 130 L 40 130 Z" fill="url(#glassGrad)" />
                        <path className="pv-path-line" d="M 40 130 Q 140 120, 200 80 T 360 20" fill="none" strokeWidth="3" />
                        <circle cx="200" cy="80" r="10" fill="rgba(255,255,255,0.3)" className="pv-pulse" />
                        <circle cx="200" cy="80" r="4" fill="#fff" />
                    </svg>
                </div>
                <footer>
                    <span>Plusvalía Estimada</span>
                    <strong>+{Math.round(((endPrice - startPrice) / startPrice) * 100)}%</strong>
                </footer>
            </div>
        </div>
    );
};

export const PlusvaliaMinimal = () => {
    const [data, setData] = useState(null);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        fetchPlusvaliaData().then(d => {
            setData(d);
            setTimeout(() => setAnimated(true), 300);
        });
    }, []);

    if (!data) return <div className="pv-loading">Cargando Minimal...</div>;
    const { startPrice, todayPrice, endPrice } = data;

    return (
        <div className={`pv-variant pv-minimal ${animated ? 'is-animated' : ''}`}>
            <div className="pv-minimal-header">
                <h2>Crecimiento Patrimonial</h2>
                <div className="pv-minimal-stat">
                    <span>Hoy</span>
                    <strong>{pesos(todayPrice)}</strong>
                </div>
            </div>
            <div className="pv-minimal-bar-container">
                <div className="pv-minimal-bar-bg">
                    <div className="pv-minimal-bar-fill" style={{ width: `${((todayPrice - startPrice) / (endPrice - startPrice)) * 100}%` }}></div>
                </div>
                <div className="pv-minimal-steps">
                    <div className="pv-step"><span>Pre-venta</span><strong>{pesos(startPrice)}</strong></div>
                    <div className="pv-step"><span>Proyectado</span><strong>{pesos(endPrice)}</strong></div>
                </div>
            </div>
            <div className="pv-minimal-footer">
                <span className="pv-tag">Potencial: +{Math.round(((endPrice - startPrice) / startPrice) * 100)}%</span>
            </div>
        </div>
    );
};

export const PlusvaliaPro = () => {
    const [data, setData] = useState(null);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        fetchPlusvaliaData().then(d => {
            setData(d);
            setTimeout(() => setAnimated(true), 300);
        });
    }, []);

    if (!data) return <div className="pv-loading">Cargando Pro...</div>;
    const { startPrice, todayPrice, endPrice } = data;

    return (
        <div className={`pv-variant pv-pro ${animated ? 'is-animated' : ''}`}>
            <div className="pv-pro-grid">
                <div className="pv-pro-sidebar">
                    <div className="pv-pro-card">
                        <label>Plusvalía Acumulada</label>
                        <h3>+{Math.round(((todayPrice - startPrice) / startPrice) * 100)}%</h3>
                    </div>
                    <div className="pv-pro-card highlight">
                        <label>Proyectado</label>
                        <h3>+{Math.round(((endPrice - startPrice) / startPrice) * 100)}%</h3>
                    </div>
                </div>
                <div className="pv-pro-main">
                    <header>
                        <div className="pv-pro-title">
                            <h3>Análisis de Plusvalía</h3>
                            <p>Actualizado: Febrero 2026</p>
                        </div>
                    </header>
                    <div className="pv-pro-chart">
                        <svg viewBox="0 0 400 150">
                            <line x1="0" y1="130" x2="400" y2="130" stroke="#eee" />
                            <line x1="0" y1="80" x2="400" y2="80" stroke="#eee" strokeDasharray="4" />
                            <path className="pv-path-line-pro" d="M 0 130 L 100 120 L 200 90 L 300 50 L 400 20" fill="none" stroke="#166534" strokeWidth="4" />
                            <circle cx="200" cy="90" r="6" fill="#166534" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

// NEW VARIANTS
export const PlusvaliaDarkTech = () => {
    const [data, setData] = useState(null);
    const [animated, setAnimated] = useState(false);
    useEffect(() => { fetchPlusvaliaData().then(d => { setData(d); setTimeout(() => setAnimated(true), 300); }); }, []);
    if (!data) return null;
    return (
        <div className={`pv-variant pv-dark-tech ${animated ? 'is-animated' : ''}`}>
            <div className="pv-dt-header">
                <span className="pv-dt-status">LIVE MONITOR</span>
                <h3>{pesos(data.todayPrice)}</h3>
            </div>
            <div className="pv-dt-visual">
                <svg viewBox="0 0 400 100">
                    <polyline points="0,100 50,90 100,95 150,70 200,60 250,40 300,45 350,20 400,10" fill="none" stroke="#4ade80" strokeWidth="3" className="pv-dt-line" />
                </svg>
            </div>
            <div className="pv-dt-footer">ROI: +{Math.round(((data.endPrice - data.startPrice) / data.startPrice) * 100)}%</div>
        </div>
    );
};

export const PlusvaliaOrganic = () => {
    const [data, setData] = useState(null);
    const [animated, setAnimated] = useState(false);
    useEffect(() => { fetchPlusvaliaData().then(d => { setData(d); setTimeout(() => setAnimated(true), 300); }); }, []);
    if (!data) return null;
    return (
        <div className={`pv-variant pv-organic ${animated ? 'is-animated' : ''}`}>
            <div className="pv-organic-bg"></div>
            <h3>Crecimiento Natural</h3>
            <div className="pv-organic-val">{pesos(data.todayPrice)}</div>
            <div className="pv-organic-chart">
                <svg viewBox="0 0 200 60">
                    <path d="M0,60 C50,60 50,40 100,40 C150,40 150,10 200,10" fill="none" stroke="#2e7d32" strokeWidth="3" className="pv-org-path" />
                </svg>
            </div>
            <span className="pv-org-footer">Inversión Sostenible</span>
        </div>
    );
};

export const PlusvaliaPremiumCard = () => {
    const [data, setData] = useState(null);
    const [animated, setAnimated] = useState(false);
    useEffect(() => { fetchPlusvaliaData().then(d => { setData(d); setTimeout(() => setAnimated(true), 300); }); }, []);
    if (!data) return null;
    return (
        <div className={`pv-variant pv-premium-card ${animated ? 'is-animated' : ''}`}>
            <div className="pv-pc-top">
                <label>VALOR ACTUAL</label>
                <h2>{pesos(data.todayPrice)}</h2>
            </div>
            <div className="pv-pc-mid">
                <span className="pv-pc-trend">▲ +{Math.round(((data.todayPrice - data.startPrice) / data.startPrice) * 100)}%</span>
            </div>
            <div className="pv-pc-bottom">
                <div className="pv-pc-info">META: <strong>{pesos(data.endPrice)}</strong></div>
                <div className="pv-pc-line-bg"><div className="pv-pc-line-fill"></div></div>
            </div>
        </div>
    );
};

export const Plusvalia3D = () => {
    const [data, setData] = useState(null);
    const [animated, setAnimated] = useState(false);
    useEffect(() => { fetchPlusvaliaData().then(d => { setData(d); setTimeout(() => setAnimated(true), 300); }); }, []);
    if (!data) return null;
    return (
        <div className={`pv-variant pv-3d ${animated ? 'is-animated' : ''}`}>
            <div className="pv-3d-box">
                <svg viewBox="0 0 400 200" className="pv-3d-svg">
                    <path d="M 50 150 L 350 150 L 350 50 L 50 150" fill="#f0f0f0" opacity="0.5" />
                    <path className="pv-3d-line" d="M 50 150 Q 150 140, 200 100 T 350 50" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                    <circle cx="200" cy="100" r="10" fill="#b47c7c" />
                </svg>
            </div>
            <div className="pv-3d-overlay">
                <h3>Impacto 3D</h3>
                <strong>{pesos(data.todayPrice)}</strong>
            </div>
        </div>
    );
};
