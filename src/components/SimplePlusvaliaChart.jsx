
import React, { useState, useEffect, useMemo } from 'react';
import './SimplePlusvaliaChart.css';

const SimplePlusvaliaChart = ({ hideMilestone = false }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
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

                const labels = [];
                for (let rn = 13; rn <= 49; rn += 1) {
                    const row = byRow[rn];
                    if (row) {
                        const label = row?.Disponible ?? row?.disponible;
                        if (label) labels.push(String(label));
                    }
                }

                const startPrice = parseNumeric(startRow?.Separado ?? startRow?.separado);
                const endPrice = parseNumeric(endRow?.Separado ?? endRow?.separado);

                const configRow = byRow[3] || {};
                const aaHoy = parseNumeric(configRow?.AA ?? configRow?.aa ?? summary?.AA?.precio);
                const aaaHoy = parseNumeric(configRow?.AAA ?? configRow?.aaa ?? summary?.AAA?.precio);
                const todayPrice = (aaHoy > 0 && aaaHoy > 0) ? ((aaHoy + aaaHoy) / 2) : (aaHoy || aaaHoy || 0);

                setData({
                    startPrice: startPrice || 800,
                    todayPrice: todayPrice || 1050,
                    endPrice: endPrice || 1650,
                    labels,
                });
                setLoading(false);
                setTimeout(() => setAnimated(true), 100);
            } catch (error) {
                console.error("Error fetching plusvalia data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const pesos = (value) => `$${Math.round(value).toLocaleString('es-MX')}`;

    const [showMilestone, setShowMilestone] = useState(true);

    if (loading) return <div className="spc-loader">Analizando plusvalía...</div>;
    if (!data) return <div className="spc-error">Error al cargar datos de plusvalía</div>;

    const { startPrice, todayPrice, endPrice } = data;

    const PROYECTADO = 3500;

    // Cálculo dinámico de coordenadas Y para que todo encaje en la línea recta
    // X va de 80 a 450 (rango 370)
    // Y va de 240 a 80 (rango 160)
    // Cálculo estricto de la recta Y basado puramente en la coordenada X para forzar línea recta visual.
    // La recta va del punto (80, 240) al punto (450, 80).
    // m = (80 - 240) / (450 - 80) = -160 / 370 = -16/37
    // Y(x) = m(x - x0) + y0
    const getYForX = (x) => {
        return (-16 / 37) * (x - 80) + 240;
    };

    const yToday = getYForX(210);
    const yPermisos = getYForX(330);

    return (
        <div className={`spc-container ${animated ? 'is-animated' : ''}`}>
            <div className="spc-header">
                <div className="spc-title-group">
                    <span className="spc-kicker">PROYECCIÓN DE VALOR</span>
                    <h2 className="spc-main-title">Evolución de Tu Inversión</h2>
                </div>
                <div className="spc-current-badge">
                    <span className="spc-badge-label">PRECIO PROMEDIO / m²</span>
                    <span className="spc-badge-value">{pesos(todayPrice)}</span>
                </div>
            </div>

            <div className="spc-chart-wrapper">
                <svg viewBox="0 0 500 320" className="spc-svg">
                    <defs>
                        <linearGradient id="spc-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#2e7d32" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#2e7d32" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Eje Y Labels */}
                    <g className="spc-axis-y">
                        <text x="40" y="240" textAnchor="end" className="spc-axis-text">{pesos(startPrice)}</text>
                        <text x="40" y={yToday} textAnchor="end" className="spc-axis-text">{pesos(todayPrice)}</text>
                        <text x="40" y="80" textAnchor="end" className="spc-axis-text">{pesos(PROYECTADO)}</text>
                    </g>

                    {/* Guías de fondo */}
                    <line x1="50" y1="240" x2="470" y2="240" className="spc-grid-line" />
                    <line x1="50" y1={yToday} x2="470" y2={yToday} className="spc-grid-line" strokeDasharray="4 4" />
                    <line x1="50" y1="80" x2="470" y2="80" className="spc-grid-line" />

                    {/* Área sombreada lineal perfecta (Como estaba antes) */}
                    <path
                        className="spc-area-path"
                        d={`M 80 240 L 450 80 L 450 240 Z`}
                        fill="url(#spc-gradient)"
                    />

                    {/* Línea de crecimiento lineal perfecta */}
                    <path
                        className="spc-line-path"
                        d="M 80 240 L 450 80"
                        fill="none"
                        stroke="#2e7d32"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />

                    {/* Conexiones en el punto de HOY */}
                    <g className="spc-today-connectors">
                        <line x1="210" y1={yToday + 8} x2="210" y2="240" stroke="#b47c7c" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
                        <line x1="50" y1={yToday} x2="202" y2={yToday} stroke="#b47c7c" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
                    </g>

                    {/* Etiquetas Eje X (Fechas) */}
                    <g className="spc-axis-x">
                        <text x="80" y="260" textAnchor="middle" className="spc-axis-text">DIC 2025</text>
                        <text x="210" y="260" textAnchor="middle" className="spc-axis-text" style={{ fill: '#b47c7c', fontWeight: '800' }}>FEB 2026</text>
                        <text x="330" y="260" textAnchor="middle" className="spc-axis-text">JUN 2026</text>
                        <text x="390" y="260" textAnchor="middle" className="spc-axis-text">DIC 2027</text>
                        <text x="450" y="260" textAnchor="middle" className="spc-axis-text">DIC 2028</text>
                    </g>

                    {/* Hito: Friends & Family */}
                    <g className="spc-point spc-point-start">
                        <circle cx="80" cy="240" r="7" fill="#fff" stroke="#2e7d32" strokeWidth="2.5" />
                        <text x="80" y="280" textAnchor="middle" className="spc-point-label">F&F ETAPA 1B</text>
                    </g>

                    {/* Hito: Proyecto / Urbanización */}
                    <g className="spc-point spc-point-today">
                        <circle cx="210" cy={yToday} r="10" fill="#b47c7c" stroke="#fff" strokeWidth="3" />
                        <text x="210" y={yToday + 26} textAnchor="middle" className="spc-point-price highlight">{pesos(todayPrice)}</text>
                    </g>

                    {/* Tag: "Hoy estamos aquí" */}
                    <g className="spc-today-tag">
                        <text x="210" y={yToday - 50} textAnchor="middle" className="spc-point-label" style={{ fontWeight: '800', color: '#1a1a1a', textTransform: 'lowercase' }}>urbanización</text>
                        <rect x="155" y={yToday - 42} width="110" height="28" className="spc-today-tag-rect" />
                        <text x="210" y={yToday - 24} textAnchor="middle" className="spc-today-tag-text">Hoy estamos aquí</text>
                        <path d={`M 205 ${yToday - 14} L 210 ${yToday - 6} L 215 ${yToday - 14}`} fill="#b47c7c" />
                    </g>

                    {/* Hito: Permisos */}
                    <g className="spc-point">
                        <circle cx="330" cy={yPermisos} r="7" fill="#fff" stroke="#2e7d32" strokeWidth="2.5" />
                        <text x="330" y={yPermisos - 10} textAnchor="middle" className="spc-point-label">Permisos</text>
                    </g>

                    {/* Hito: Meta Final +$3500 */}
                    <g className="spc-point spc-point-end">
                        <circle cx="450" cy="80" r="9" fill="#fff" stroke="#1a1a1a" strokeWidth="4" />
                        <text x="450" y="70" textAnchor="middle" className="spc-point-price highlight" style={{ fill: '#1a1a1a', fontSize: '16px' }}>{pesos(PROYECTADO)}</text>
                        <text x="450" y="105" textAnchor="middle" className="spc-point-label" style={{ fontSize: '8px' }}>VALOR<br />APROXIMADO</text>
                        <text x="450" y="115" textAnchor="middle" className="spc-point-label" style={{ opacity: 0.5 }}>META PROYECTADA</text>
                    </g>
                </svg>
            </div>

            {/* ## HITO ACTUAL BAR (CON BOTÓN DE CIERRE) ## */}
            {!hideMilestone && showMilestone && (
                <div className="spc-milestone-bar">
                    <div className="spc-m-label">HITO ACTUAL</div>
                    <div className="spc-m-icon-wrapper">
                        <span className="spc-m-icon-anim">🚜</span>
                    </div>
                    <div className="spc-m-content">
                        COMIENZO DE LA URBANIZACIÓN EN TIEMPO Y FORMA
                    </div>
                    <button className="spc-m-close" onClick={() => setShowMilestone(false)}>×</button>
                </div>
            )}

            <div className="spc-footer">
                <div className="spc-footer-item">
                    <span className="spc-percent">+{Math.round(((endPrice - startPrice) / startPrice) * 100)}%</span>
                    <span className="spc-footer-label">Plusvalía Total</span>
                </div>
                <button className="spc-cta-btn" onClick={() => window.open('https://wa.me/5218123852034', '_blank')}>
                    CONSULTAR DISPONIBILIDAD
                </button>
            </div>
        </div>
    );
};

export default SimplePlusvaliaChart;
