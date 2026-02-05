import React, { useMemo, useState } from 'react';
import './PlusvaliaChart.css';

const pesos = (value) => {
    const num = Number(value) || 0;
    return `$${num.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
};

const MONTH_LABELS = {
    ene: 'Ene',
    feb: 'Feb',
    mar: 'Mar',
    abr: 'Abr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    ago: 'Ago',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dic: 'Dic',
};

const MONTH_INDEX = {
    ene: 0,
    feb: 1,
    mar: 2,
    abr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    ago: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dic: 11,
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function parseMonthYear(label) {
    const raw = String(label ?? '').trim().toLowerCase();
    const compact = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');

    // "dic-25" / "dic 25" / "diciembre 2025"
    const dash = compact.match(/^([a-zñ]{3,9})[-\s]?(\d{2,4})$/);
    if (dash) {
        const mKey = dash[1].slice(0, 3);
        const yRaw = dash[2];
        const y = yRaw.length === 2 ? (2000 + parseInt(yRaw, 10)) : parseInt(yRaw, 10);
        return { monthKey: mKey, year: Number.isFinite(y) ? y : null };
    }

    const parts = compact.split(' ');
    if (parts.length >= 2) {
        const mKey = parts[0].slice(0, 3);
        const y = parseInt(parts[1], 10);
        return { monthKey: mKey, year: Number.isFinite(y) ? y : null };
    }

    return { monthKey: compact.slice(0, 3), year: null };
}

function tickLabel(label) {
    const { monthKey, year } = parseMonthYear(label);
    const m = MONTH_LABELS[monthKey] || String(label ?? '').slice(0, 3);
    const y = year ? String(year).slice(-2) : '';
    return `${m} ${y}`.trim();
}

function easeExpConcaveDown(t, k, T) {
    // (1 - e^{-k t}) / (1 - e^{-k T})
    if (!T) return 0;
    const denom = 1 - Math.exp(-k * T);
    if (denom === 0) return t / T;
    return (1 - Math.exp(-k * t)) / denom;
}

function solveKConcaveDown({ T, t0, y0, yT, yAtT0 }) {
    const ratio = (yAtT0 - y0) / (yT - y0);
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 1) return null;

    // Concave-down exponential is always >= linear. If ratio is below linear, no exact solution.
    const linearRatio = t0 / T;
    if (ratio < linearRatio) return null;

    let lo = 0.001;
    let hi = 12;
    for (let i = 0; i < 44; i += 1) {
        const mid = (lo + hi) / 2;
        const val = easeExpConcaveDown(t0, mid, T);
        if (val < ratio) lo = mid;
        else hi = mid;
    }
    return (lo + hi) / 2;
}

function buildSmoothPath(points) {
    if (!points || points.length < 2) return '';
    const d = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
    }
    return d.join(' ');
}

function wrapText(text, maxChars = 44, maxLines = 7) {
    const raw = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!raw) return [];
    const words = raw.split(' ');
    const lines = [];
    let current = '';
    for (const w of words) {
        const next = current ? `${current} ${w}` : w;
        if (next.length <= maxChars) {
            current = next;
        } else {
            if (current) lines.push(current);
            current = w;
            if (lines.length >= maxLines - 1) break;
        }
    }
    if (current && lines.length < maxLines) lines.push(current);
    return lines;
}

export default function PlusvaliaChart({ data }) {
    const [hoveredKey, setHoveredKey] = useState(null);
    const [pinnedKey, setPinnedKey] = useState(null);

    const computed = useMemo(() => {
        const labels = Array.isArray(data?.labels) ? data.labels : [];
        const startPrice = Number(data?.startPrice) || 0;
        const endPrice = Number(data?.endPrice) || 0;
        const todayPrice = Number(data?.todayPrice) || 0;

        if (!labels.length || !startPrice || !endPrice) return null;

        const n = labels.length;
        const T = n - 1;

        // HOY: ubicar el mes actual dentro del rango P13:P49 (o el más cercano) y fijar el precio promedio.
        let hoyIndex = null;
        const hoyPrice = (Number.isFinite(todayPrice) && todayPrice > 0) ? todayPrice : null;
        if (hoyPrice !== null) {
            const now = new Date();
            const nowKey = now.getFullYear() * 12 + now.getMonth();
            let bestIdx = null;
            let bestDist = Infinity;
            for (let i = 0; i < n; i += 1) {
                const { monthKey, year } = parseMonthYear(labels[i]);
                const mi = MONTH_INDEX[monthKey];
                if (!year || mi === undefined) continue;
                const k = year * 12 + mi;
                const dist = Math.abs(k - nowKey);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            if (bestIdx !== null) hoyIndex = clamp(bestIdx, 1, Math.max(1, n - 2));
        }

        const defaultK = 2.0;
        let k = defaultK;
        if (hoyIndex !== null && hoyPrice !== null && T > 0) {
            const solved = solveKConcaveDown({
                T,
                t0: hoyIndex,
                y0: startPrice,
                yT: endPrice,
                yAtT0: hoyPrice
            });
            if (Number.isFinite(solved)) k = solved;
            else k = 0.06; // casi lineal si no hay solución exacta (caso raro)
        }

        const ease = (t) => easeExpConcaveDown(t, k, T);
        const seriesPrices = Array.from({ length: n }, (_, i) => startPrice + (endPrice - startPrice) * ease(i));

        const minP = Math.min(startPrice, endPrice, ...(hoyPrice ? [hoyPrice] : []));
        const maxP = Math.max(startPrice, endPrice, ...(hoyPrice ? [hoyPrice] : []));
        const yMin = Math.max(0, minP * 0.9);
        // Un poco más de “aire” arriba para que la curva nunca se sienta pegada.
        const yMax = Math.max(yMin + 1, maxP * 1.12);

        // Más aire y escala: reservar franja superior amplia + margen inferior para etiquetas.
        const view = { w: 1120, h: 660 };
        const pad = { l: 92, r: 58, t: 120, b: 140 };
        const chartW = view.w - pad.l - pad.r;
        const chartH = view.h - pad.t - pad.b;

        const points = seriesPrices.map((p, i) => {
            const x = pad.l + (T ? (i / T) * chartW : 0);
            const yNorm = (p - yMin) / (yMax - yMin);
            const y = pad.t + (1 - yNorm) * chartH;
            return { x, y, price: p, index: i, label: labels[i] };
        });

        const linePath = buildSmoothPath(points);
        const fillPath = `${linePath} L ${points[points.length - 1].x} ${pad.t + chartH} L ${points[0].x} ${pad.t + chartH} Z`;

        const milestones = Array.isArray(data?.milestones) ? data.milestones : [];
        const cleanedMilestones = milestones
            .filter((m) => m && typeof m.index === 'number' && m.index > 0 && m.index < n - 1 && String(m.text ?? '').trim())
            .map((m) => ({ ...m, text: String(m.text).trim() }));

        const effHoyIndex = (hoyIndex !== null) ? hoyIndex : clamp(Math.floor(n * 0.3), 1, Math.max(1, n - 2));
        const tickIndices = Array.from(new Set([0, effHoyIndex, n - 1]));

        return {
            view,
            pad,
            chartH,
            startPrice,
            endPrice,
            hoyPrice,
            effHoyIndex,
            tickIndices,
            points,
            linePath,
            fillPath,
            cleanedMilestones,
        };
    }, [data]);

    if (!computed) {
        return (
            <div className="plusvalia-card">
                <div className="plusvalia-head">
                    <div className="plusvalia-hero-message">HOY nuestro competidor ya vende a — / m²</div>
                    <div className="plusvalia-meta">
                        <div className="plusvalia-kicker">PLUSVALÍA PROYECTADA</div>
                        <div className="plusvalia-range">Cargando…</div>
                    </div>
                </div>
                <div className="plusvalia-skeleton" aria-hidden="true" />
            </div>
        );
    }

    const {
        view,
        pad,
        chartH,
        startPrice,
        endPrice,
        hoyPrice,
        effHoyIndex,
        tickIndices,
        points,
        linePath,
        fillPath,
        cleanedMilestones,
    } = computed;

    const startPoint = points[0];
    const hoyPoint = points[effHoyIndex] || points[Math.max(0, points.length - 1)];
    const endPoint = points[points.length - 1];
    // Mensaje principal (1 línea). El monto toma el precio final proyectado.
    const heroMessage = `HOY nuestro competidor ya vende a ${pesos(endPrice)} / m²`;

    const activeKey = pinnedKey ?? hoveredKey;
    const activeMilestone = activeKey
        ? cleanedMilestones.find((m) => `${m.index}` === `${activeKey}`)
        : null;

    const tooltip = activeMilestone ? (() => {
        const p = points[activeMilestone.index];
        if (!p) return null;
        const lines = wrapText(activeMilestone.text, 44, 7);
        const boxW = 380;
        const boxH = 30 + lines.length * 16 + 16;
        const x = clamp(p.x + 18, pad.l, view.w - pad.r - boxW);
        const y = clamp(p.y - boxH - 10, pad.t, pad.t + chartH - boxH - 10);
        return { x, y, w: boxW, h: boxH, lines, label: tickLabel(p.label) };
    })() : null;

    // Reubicación y jerarquía: etiquetas pegadas al punto, sin empalmes.
    const startLabelX = clamp(startPoint.x + 16, pad.l + 8, view.w - pad.r - 220);
    const startLabelY = clamp(startPoint.y - 10, pad.t + 26, pad.t + chartH - 12);

    const hoyLabelWidth = 240;
    const hoyCanGoRight = hoyPoint.x + 18 + hoyLabelWidth <= view.w - pad.r;
    const hoyLabelAnchor = hoyCanGoRight ? 'start' : 'end';
    const hoyLabelX = hoyCanGoRight
        ? clamp(hoyPoint.x + 18, pad.l + 8, view.w - pad.r - hoyLabelWidth)
        : clamp(hoyPoint.x - 18, pad.l + hoyLabelWidth, view.w - pad.r - 8);
    const hoyLabelY = clamp(hoyPoint.y - 20, pad.t + 40, pad.t + chartH - 60);

    const endLabelX = clamp(endPoint.x - 16, pad.l + 220, view.w - pad.r - 8);
    const endLabelY = clamp(endPoint.y - 16, pad.t + 34, pad.t + chartH - 12);

    return (
        <div className="plusvalia-card">
            <div className="plusvalia-head">
                <div className="plusvalia-hero-message">{heroMessage}</div>
                    <div className="plusvalia-meta">
                        <div className="plusvalia-kicker">PLUSVALÍA PROYECTADA</div>
                        <div className="plusvalia-range">
                        {pesos(startPrice)} → {pesos(endPrice)} por m²
                    </div>
                </div>
            </div>

            <svg
                className="plusvalia-svg"
                viewBox={`0 0 ${view.w} ${view.h}`}
                role="img"
                aria-label="Gráfica de plusvalía"
                onClick={() => setPinnedKey(null)}
            >
                <defs>
                    <filter id="pvShadow" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="rgba(0,0,0,0.10)" />
                    </filter>
                    <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#166534" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#166534" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Axes (minimal) */}
                <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + chartH} stroke="rgba(15,23,42,0.24)" strokeWidth="2" />
                <line x1={pad.l} y1={pad.t + chartH} x2={view.w - pad.r} y2={pad.t + chartH} stroke="rgba(15,23,42,0.24)" strokeWidth="2" />

                {/* Curve */}
                <path d={fillPath} fill="url(#pvFill)" />
                <path d={linePath} fill="none" stroke="#1f5f2a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Big conceptual label */}
                <text
                    x={view.w - pad.r - 260}
                    y={pad.t + chartH * 0.55}
                    fontSize="74"
                    fill="rgba(15, 23, 42, 0.07)"
                    fontFamily="'Playfair Display', serif"
                    fontWeight="400"
                    textAnchor="middle"
                >
                    Plusvalía
                </text>

                {/* Milestones (anotaciones) */}
                {cleanedMilestones.map((m) => {
                    const p = points[m.index];
                    if (!p) return null;
                    const isActive = `${m.index}` === `${activeKey}`;
                    return (
                        <g key={`m-${m.index}`}>
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={isActive ? 12 : 7}
                                fill="#b91c1c"
                                stroke="#ffffff"
                                strokeWidth="2"
                                opacity={isActive ? 0.95 : 0.72}
                                onMouseEnter={() => setHoveredKey(String(m.index))}
                                onMouseLeave={() => setHoveredKey(null)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setPinnedKey((prev) => (prev === String(m.index) ? null : String(m.index)));
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                        </g>
                    );
                })}

                {/* Start marker */}
                <g>
                    <circle cx={startPoint.x} cy={startPoint.y} r={10} fill="#166534" stroke="#ffffff" strokeWidth="2" />
                    <text
                        x={startLabelX}
                        y={startLabelY}
                        fontSize="13"
                        fill="rgba(20,83,45,0.92)"
                        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
                        fontWeight="900"
                    >
                        {pesos(startPrice)} / m²
                    </text>
                </g>

                {/* Hoy marker */}
                <g>
                    <line
                        x1={hoyPoint.x}
                        y1={hoyPoint.y}
                        x2={hoyPoint.x}
                        y2={pad.t + chartH}
                        stroke="#1d4ed8"
                        strokeWidth="2.5"
                        strokeDasharray="7 8"
                        opacity="0.85"
                    />
                    <circle cx={hoyPoint.x} cy={hoyPoint.y} r={11} fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
                    <text
                        x={hoyLabelX}
                        y={hoyLabelY}
                        textAnchor={hoyLabelAnchor}
                        fontSize="13"
                        fill="#1e3a8a"
                        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
                        fontWeight="900"
                    >
                        <tspan x={hoyLabelX} y={hoyLabelY}>Hoy (promedio)</tspan>
                        <tspan x={hoyLabelX} y={hoyLabelY + 20} fontSize="15" fill="#0f2a6a">
                            {pesos(hoyPrice || 0)} / m²
                        </tspan>
                    </text>
                </g>

                {/* End marker */}
                <g>
                    <circle cx={endPoint.x} cy={endPoint.y} r={14} fill="#0f3d22" stroke="#ffffff" strokeWidth="2" />
                    <text
                        x={endLabelX}
                        y={endLabelY}
                        textAnchor="end"
                        fontSize="17"
                        fill="#0f3d22"
                        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
                        fontWeight="900"
                    >
                        {pesos(endPrice)} / m²
                    </text>
                </g>

                {/* Tooltip */}
                {tooltip ? (
                    <g filter="url(#pvShadow)" onClick={(e) => e.stopPropagation()}>
                        <rect x={tooltip.x} y={tooltip.y} width={tooltip.w} height={tooltip.h} rx="18" fill="#ffffff" stroke="rgba(15,23,42,0.10)" />
                        <text
                            x={tooltip.x + 16}
                            y={tooltip.y + 24}
                            fontSize="11"
                            fill="rgba(15,23,42,0.60)"
                            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
                            fontWeight="900"
                        >
                            {tooltip.label}
                        </text>
                        <text x={tooltip.x + 16} y={tooltip.y + 46} fontSize="12" fill="#111827" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
                            {tooltip.lines.map((line, i) => (
                                <tspan key={`t-${i}`} x={tooltip.x + 16} y={tooltip.y + 46 + i * 16}>{line}</tspan>
                            ))}
                        </text>
                    </g>
                ) : null}

                {/* X-axis ticks (Inicio / Hoy / Final) */}
                {tickIndices.map((idx) => {
                    const p = points[idx];
                    if (!p) return null;
                    const label = idx === 0 ? 'Inicio' : (idx === points.length - 1 ? 'Final' : 'Hoy');
                    return (
                        <g key={`x-${idx}`}>
                            <line x1={p.x} y1={pad.t + chartH} x2={p.x} y2={pad.t + chartH + 12} stroke="rgba(15,23,42,0.30)" strokeWidth="2" />
                            <text
                                x={p.x}
                                y={pad.t + chartH + 36}
                                textAnchor="middle"
                                fontSize="12"
                                fill="rgba(15,23,42,0.72)"
                                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
                                fontWeight="900"
                            >
                                {label}
                            </text>
                            <text
                                x={p.x}
                                y={pad.t + chartH + 58}
                                textAnchor="middle"
                                fontSize="11"
                                fill="rgba(15,23,42,0.45)"
                                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
                            >
                                {tickLabel(p.label)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
