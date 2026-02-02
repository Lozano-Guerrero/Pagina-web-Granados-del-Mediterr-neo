/* src/components/PlusvaliaDashboard.jsx */

import React, { useState, useEffect } from 'react';
import './PlusvaliaDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faClock, faCalendarAlt, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const PlusvaliaDashboard = () => {
    const [availability, setAvailability] = useState({
        A: { count: 0, total: 35, currentPrice: 850 },
        AA: { count: 0, total: 20, currentPrice: 990 },
        AAA: { count: 0, total: 15, currentPrice: 1150 },
        stageTotal: 70,
        stageAvail: 0,
        m14: null, // Lotes que quedan antes de subida
        l14: null, // Otro métrico de la fila 14
        loading: true
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const response = await fetch('https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1');
                const responseData = await response.json();

                // El webhook devuelve [{ summary, lotes }]
                const root = (Array.isArray(responseData) && responseData[0]) ? (responseData[0].json || responseData[0]) : responseData;
                const summary = root.summary || {};
                const rows = root.lotes || (Array.isArray(root) ? root : []);

                const stats = {
                    A: { avail: 0, prices: [] },
                    AA: { avail: 0, prices: [] },
                    AAA: { avail: 0, prices: [] }
                };

                const norm = (val) => val?.toString().trim().toUpperCase() || '';

                rows.forEach(r => {
                    const type = norm(r.tipo || r.Tipo);
                    const status = norm(r.estado || r.Estado).toLowerCase();
                    const stage = norm(r.etapa || r.Etapa);

                    // Filtramos estrictamente por Etapa 1
                    if (stage === '1' || stage.includes('1')) {
                        if (stats[type]) {
                            if (status === 'disponible') {
                                stats[type].avail++;
                                const pStr = String(r.costo_m2 || r.costo || '0').replace(/[^0-9.]/g, '');
                                const price = parseFloat(pStr);
                                if (price > 0) stats[type].prices.push(price);
                            }
                        }
                    }
                });

                setAvailability({
                    A: { count: stats.A.avail, total: 35, currentPrice: summary.A?.precio || 800 },
                    AA: { count: stats.AA.avail, total: 20, currentPrice: summary.AA?.precio || 990 },
                    AAA: { count: stats.AAA.avail, total: 15, currentPrice: summary.AAA?.precio || 1150 },
                    stageTotal: 70,
                    stageAvail: stats.A.avail + stats.AA.avail + stats.AAA.avail,
                    m14: summary.AAA?.quedanHike || 0,
                    l14: summary.AA?.quedanHike || 0,
                    loading: false
                });
            } catch (error) {
                console.error("Error fetching Plusvalia Data:", error);
                setAvailability(prev => ({ ...prev, loading: false }));
            }
        };
        fetchAvailability();
    }, []);

    const formatCurrency = (val) => `$${Number(val).toLocaleString('es-MX')}`;

    const formatDate = (date) => {
        return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + " CST";
    };

    const lotTypes = [
        { key: 'AAA', label: 'LOTE TIPO AAA', accent: '#2e7d32', nextPrice: 1650 },
        { key: 'AA', label: 'LOTE TIPO AA', accent: '#fcc419', nextPrice: 1100 },
        { key: 'A', label: 'LOTE TIPO A', accent: '#ff6b6b', nextPrice: 950 }
    ];

    // Chart Components
    const DonutChart = ({ available, total }) => {
        const sold = Math.max(0, total - available);
        const availPerc = total > 0 ? (available / total) * 100 : 0;
        const soldPerc = total > 0 ? (sold / total) * 100 : 0;

        // Dasharrays and offsets
        const strokeAvail = `${availPerc} ${100 - availPerc}`;
        const strokeSold = `${soldPerc} ${100 - soldPerc}`;

        return (
            <div className="v5-donut-box">
                <svg viewBox="0 0 42 42" className="v5-donut">
                    <circle className="v5-donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
                    <circle className="v5-donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f0f0f0" strokeWidth="4"></circle>
                    {/* Disponible (Verde) - Empieza en el tope */}
                    <circle className="v5-donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#4caf50" strokeWidth="4" strokeDasharray={strokeAvail} strokeDashoffset="25"></circle>
                    {/* Vendido (Naranja) - Empieza después del disponible */}
                    <circle className="v5-donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ff922b" strokeWidth="4" strokeDasharray={strokeSold} strokeDashoffset={25 - availPerc}></circle>
                </svg>
                <div className="v5-donut-text">
                    <span className="v5-donut-num">{available}/{total}</span>
                    <span className="v5-donut-sub">DISPONIBLES</span>
                </div>
            </div>
        );
    };

    const LineChart = () => (
        <svg viewBox="0 0 400 150" className="v5-line-chart">
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4dabf7" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4dabf7" stopOpacity="1" />
                </linearGradient>
            </defs>
            <path
                d="M 0 100 Q 50 80, 100 90 T 200 60 T 300 65 T 400 10"
                fill="none"
                stroke="#4dabf7"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M 0 100 Q 50 80, 100 90 T 200 60 T 300 65 T 400 10 L 400 150 L 0 150 Z"
                fill="rgba(77, 171, 247, 0.1)"
            />
            <circle cx="400" cy="10" r="4" fill="#4dabf7" />
        </svg>
    );

    if (availability.loading) return <div className="v5-loader">Cargando Panel de Propiedades...</div>;

    return (
        <div className="v5-dashboard-container">
            <div className="v5-glass-wrapper">
                <header className="v5-header">
                    <div className="v5-header-left">
                        <h1>PANEL DE PROPIEDADES</h1>
                        <p>Resumen General & Oportunidades de Inversión</p>
                    </div>
                    <div className="v5-header-right">
                        <div className="v5-date-box">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{formatDate(currentTime)}</span>
                        </div>
                        <div className="v5-time-box">
                            <span className="v5-v-sep" />
                            <span>{formatTime(currentTime)}</span>
                        </div>
                    </div>
                </header>

                <div className="v5-stats-summary">
                    <div className="v5-stat-item">
                        <span className="v5-stat-label">DISPONIBLES ETAPA 1</span>
                        <div className="v5-stat-value-group">
                            <span className="v5-stat-number">{availability.stageAvail}</span>
                            <span className="v5-stat-total">/ {availability.stageTotal}</span>
                        </div>
                    </div>
                    {availability.m14 && (
                        <div className="v5-stat-item highlight">
                            <span className="v5-stat-label">ANTES DE SUBIDA</span>
                            <div className="v5-stat-value-group">
                                <span className="v5-stat-number">{availability.m14}</span>
                                <span className="v5-stat-unit">LOTES</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* TOP ROW: CHARTS */}
                <div className="v5-top-grid">
                    <div className="v5-main-card">
                        <div className="v5-card-header">
                            <h2>ESTADO DE LOTES</h2>
                            <div className="v5-btn-tool" />
                        </div>
                        <div className="v5-donut-container">
                            <DonutChart available={availability.stageAvail} total={availability.stageTotal} />
                            <div className="v5-donut-legend">
                                <div className="v5-legend-item">
                                    <span className="dot dot-avail" />
                                    <span>Disponible (Etapa 1) <strong>{Math.round((availability.stageAvail / 70) * 100)}%</strong></span>
                                </div>
                                <div className="v5-legend-item">
                                    <span className="dot dot-sold" />
                                    <span>Lotes Vendidos/Apartados <strong>{Math.round(((70 - availability.stageAvail) / 70) * 100)}%</strong></span>
                                </div>
                                {availability.m14 && (
                                    <div className="v5-m14-badge">
                                        Quedan {availability.m14} lotes antes de subida
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="v5-card-footer-note">Métricas exclusivas de la primera etapa. Disponibilidad sujeta a cambios.</p>
                    </div>

                    <div className="v5-main-card">
                        <div className="v5-card-header">
                            <h2>PLUSVALÍA HISTÓRICA</h2>
                            <div className="v5-btn-tool" />
                        </div>
                        <div className="v5-chart-box">
                            <div className="v5-chart-meta">
                                <span className="dot dot-blue" />
                                <span>Plusvalía en Aumento <strong>+21%</strong></span>
                            </div>
                            <LineChart />
                            <div className="v5-chart-labels">
                                <span>Ene 23</span>
                                <span>Ene 24</span>
                                <span>Ene 25</span>
                                <span>Ene 26</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW: LOT CARDS */}
                <div className="v5-lot-grid">
                    {lotTypes.map((type) => {
                        const data = availability[type.key];
                        return (
                            <div key={type.key} className="v5-lot-card">
                                <div className="v5-lot-head">
                                    <h3>{type.label}</h3>
                                    <div className="v5-btn-tool-mini" />
                                </div>
                                <div className="v5-lot-price-row">
                                    <span className="v5-lot-current">{formatCurrency(data.currentPrice)}</span>
                                    <FontAwesomeIcon icon={faArrowTrendUp} className="v5-trend-icon" />
                                    <span className="v5-lot-estimate">ESTIMADO {formatCurrency(type.nextPrice)}</span>
                                </div>
                                <div className="v5-lot-progress-box">
                                    <span className="v5-prog-label">Disponibilidad Etapa 1</span>
                                    <div className="v5-prog-row">
                                        <div className="v5-prog-bar-bg">
                                            <div
                                                className="v5-prog-bar-fill"
                                                style={{
                                                    width: `${(data.count / data.total) * 100}%`,
                                                    backgroundColor: type.accent
                                                }}
                                            />
                                        </div>
                                        <span className="v5-prog-perc" style={{ color: type.accent }}>
                                            {Math.round((data.count / data.total) * 100)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="v5-lot-avail-count">
                                    {data.count} / {data.total} Disp.
                                </div>
                            </div>
                        );
                    })}
                </div>

                <footer className="v5-footer-disclaimer">
                    <p>* Los precios mostrados son promedios referenciales basados en el registro histórico de operaciones y proyecciones de mercado. Pueden variar según el lote específico y condiciones comerciales sin previo aviso. Valores puramente informativos.</p>
                </footer>
            </div>
        </div >
    );
};

export default PlusvaliaDashboard;
