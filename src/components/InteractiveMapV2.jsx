import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCalendarCheck, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import './InteractiveMapV2.css';

// --- Constantes y Configuración ---
const DATA_URL = 'https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1';
const WHATSAPP_BASE = 'https://wa.me/528123852034?text=';
const CONTACTO_URL = '/Contacto';
const SVG_PATH = '/SVGmapados.svg';

const COLOR_BY_STATUS = {
    disponible: '#66bb6a',
    reservado: '#fde68a',
    separado: '#fde68a',
    apartado: '#fde68a',
    vendido: '#ef5350',
    bloqueado: '#c2c1ba',
    'n/a': '#e5e7eb'
};

const RESERVED_STATUSES = ['reservado', 'separado', 'apartado', 'bloqueado'];

const COLOR_BY_TYPE = {
    A: '#9ed9b5',
    AA: '#3fae6a',
    AAA: '#1f6f43',
};

const COLOR_PRESETS = {
    verde: '#66bb6a',
    amarillo: '#fde68a',
    rojo: '#ef5350',
    gris: '#e5e7eb',
};

const NON_SELECTABLE_STATUSES = new Set(['vendido', 'reservado', 'separado', 'apartado', 'bloqueado']);
const SELECTED_COLOR = '#1d4ed8';
const HIGHLIGHT_COLOR = '#9c27b0'; // Morado para "Ver lotes"
const FALLBACK_COLOR = '#a8a8a8ff';
const SHAPE_SEL = 'path,polygon,rect,ellipse';
const LOT_STROKE_COLOR = '#000000';

const INITIAL_LOT_INFO = { titulo: '', superficie_m2: '', estado: 'DISPONIBLE', tipo: 'A', costo_m2: '', nota: '' };

const norm = (val) => val?.toString().trim().toUpperCase() || '';

function keyify(s) {
    return norm(s).toLowerCase().replace(/lote[\s_:-]*/g, 'lote').replace(/[^a-z0-9]/g, '');
}

function pickColor(info, isHighlighted = false) {
    if (!info) return FALLBACK_COLOR;
    if (isHighlighted) return HIGHLIGHT_COLOR;

    // Soporta tanto minúsculas como Mayúsculas del nuevo JSON
    const estado = norm(info.estado || info.Estado).toLowerCase();
    const tipo = norm(info.tipo || info.Tipo).toUpperCase();

    // Priorizamos los colores por tipo (A, AA, AAA) si el lote está disponible
    if (estado === 'disponible' && COLOR_BY_TYPE[tipo]) {
        return COLOR_BY_TYPE[tipo];
    }

    const c = norm(info.color || info.Color);
    if (c) {
        if (c.startsWith('#') || /^rgb|^hsl/i.test(c)) return c;
        if (COLOR_PRESETS[c.toLowerCase()]) return COLOR_PRESETS[c.toLowerCase()];
    }

    if (estado === 'disponible') {
        return COLOR_BY_STATUS.disponible;
    }

    return COLOR_BY_STATUS[estado] || FALLBACK_COLOR;
}

function normalizeRows(j) {
    if (Array.isArray(j)) return j[0]?.json ? j.map(x => x.json) : j;
    if (j?.data) return j.data;
    if (j?.items) return j.items.map(x => x.json ?? x);
    if (j?.rows) return j.rows;
    return Array.isArray(j) ? j : [];
}

function isPaintable(el) {
    const tag = el.tagName.toLowerCase();
    if (!/^(path|polygon|rect|ellipse)$/i.test(tag)) return false;
    try {
        const cs = el.ownerDocument.defaultView.getComputedStyle(el);
        return cs.fill && cs.fill !== 'none';
    } catch (e) { return true; }
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === '') return 'Consultar';
    const num = Number(String(value).replace(/[, ]/g, ''));
    if (Number.isNaN(num)) return String(value);

    return num.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0
    });
}

function getPaintables(node) {
    return node.matches(SHAPE_SEL)
        ? [node]
        : [...node.querySelectorAll(SHAPE_SEL)].filter(isPaintable);
}

function getStatusKey(info) {
    return norm(info?.estado || info?.Estado).toLowerCase();
}

function isSelectableStatus(info) {
    return !NON_SELECTABLE_STATUSES.has(getStatusKey(info));
}

function isHighlightedLot(info, highlightType) {
    if (!highlightType) return false;
    const typeMatch = norm(info?.tipo || info?.Tipo) === norm(highlightType);
    const isAvailable = getStatusKey(info) === 'disponible';
    return typeMatch && isAvailable;
}

function isSelectableLot(info, highlightType) {
    if (!isSelectableStatus(info)) return false;
    if (!highlightType) return true;
    return isHighlightedLot(info, highlightType);
}

function applyLotStroke(el) {
    el.style.setProperty('stroke', LOT_STROKE_COLOR, 'important');
}

export default function InteractiveMapV2({
    layoutV2 = false,
    onSelectionChange = null,
    onLotSelect = null,
    externalSelectionId = null,
    highlightType = null, // Novedad: 'A', 'AA', 'AAA' o null
    clearSelectionSignal = 0
}) {
    const svgContainerRef = useRef(null);
    const cleanupRef = useRef(null);
    const activeRef = useRef(null);

    const [data, setData] = useState([]);
    const [svgContent, setSvgContent] = useState('');
    const [activeEl, setActiveEl] = useState(null);
    const [currentInfo, setCurrentInfo] = useState(INITIAL_LOT_INFO);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [availability, setAvailability] = useState({
        A: { count: 0, minPrice: 0 },
        AA: { count: 0, minPrice: 0 },
        AAA: { count: 0, minPrice: 0 }
    });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 992);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        activeRef.current = activeEl;
    }, [activeEl]);

    const byId = useMemo(() => {
        const map = new Map();
        data.forEach(r => {
            const k = keyify(r.id ?? r.Id ?? '');
            if (k) map.set(k, r);
        });
        return map;
    }, [data]);

    useEffect(() => {
        fetch(SVG_PATH)
            .then(res => {
                if (!res.ok) throw new Error('Error HTTP SVG');
                return res.text();
            })
            .then(text => setSvgContent(text))
            .catch(err => console.error('Error cargando SVG:', err));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(DATA_URL, { cache: 'no-store' });
                if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
                const responseData = await response.json();

                // El webhook devuelve [{ summary, lotes }]
                const root = (Array.isArray(responseData) && responseData[0]) ? (responseData[0].json || responseData[0]) : responseData;
                const rawRows = root.lotes || (Array.isArray(root) ? root : []);
                const summary = root.summary || {};
                const rows = rawRows.map(r => ({
                    ...r,
                    id: r.id || r.Id,
                    titulo: r.titulo || r.Título,
                    tipo: r.tipo || r.Tipo,
                    estado: r.estado || r.Estado,
                    color: r.color || r.Color,
                    superficie_m2: r.superficie_m2 || r.Superficie,
                    costo_m2: r['Precio'] || r.Precio || r.precio || r['Precio m2'] || r.precio_m2 || r.costo_m2 || r.costo || r['Costo'] || r['Costo m2'],
                    nota: r.nota || r.Nota
                }));
                setData(rows);

                // Calculate availability stats
                const stats = {
                    A: { count: 0, prices: [] },
                    AA: { count: 0, prices: [] },
                    AAA: { count: 0, prices: [] }
                };

                rows.forEach(r => {
                    const type = norm(r.tipo || r.Tipo);
                    const status = norm(r.estado || r.Estado).toLowerCase();
                    const stage = norm(r.etapa || r.Etapa);

                    if ((stage === '1' || stage.includes('1')) && status === 'disponible' && stats[type]) {
                        stats[type].count++;
                        const pVal = r['Precio'] || r.Precio || r['Precio m2'] || r.precio || r['Costo'] || r.Costo || r['Costo m2'] || r.costo_m2 || r.costo || 0;
                        const price = typeof pVal === 'number' ? pVal : parseFloat(String(pVal).replace(/[^0-9.]/g, ''));
                        if (price > 0) stats[type].prices.push(price);
                    }
                });

                setAvailability({
                    A: {
                        count: stats.A.count,
                        minPrice: stats.A.prices.length > 0 ? Math.max(...stats.A.prices) : (summary.A?.precio || 800),
                        hikeScarcity: summary.A?.quedanHike || 0
                    },
                    AA: {
                        count: stats.AA.count,
                        minPrice: stats.AA.prices.length > 0 ? Math.max(...stats.AA.prices) : (summary.AA?.precio || 990),
                        hikeScarcity: summary.AA?.quedanHike || 0
                    },
                    AAA: {
                        count: stats.AAA.count,
                        minPrice: stats.AAA.prices.length > 0 ? Math.max(...stats.AAA.prices) : (summary.AAA?.precio || 1100),
                        hikeScarcity: summary.AAA?.quedanHike || 0
                    }
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);


    const updateStickyPanel = useCallback((info, lotId, showDetails) => {
        const panel = document.getElementById('lot-info-sticky-panel-v2');
        const infoToUse = info && Object.keys(info).length > 0 ? info : INITIAL_LOT_INFO;

        // If there's an active selection, don't update from hover
        if (activeRef.current && !showDetails) return;

        setCurrentInfo(infoToUse);
        if (onSelectionChange) onSelectionChange(infoToUse);

        if (!panel) return;
        panel.classList.remove('initial-state');
        if (showDetails) panel.classList.add('active');
        else panel.classList.remove('active');
    }, [onSelectionChange]);

    const resetSelection = useCallback((byId) => {
        const active = activeRef.current;
        if (active) {
            const info = byId.get(keyify(active.id));
            const filterActive = Boolean(highlightType);
            const isHighlighted = isHighlightedLot(info, highlightType);
            const color = pickColor(info, isHighlighted);
            const paintables = getPaintables(active);
            paintables.forEach(s => {
                s.style.fill = color;
                if (filterActive) {
                    s.style.fillOpacity = isHighlighted ? '1' : '0.22';
                    if (isHighlighted) {
                        s.style.strokeWidth = '1px';
                    } else {
                        s.style.removeProperty('stroke-width');
                    }
                } else {
                    s.style.fillOpacity = '0.7';
                    s.style.removeProperty('stroke-width');
                }
                s.style.removeProperty('animation');
                applyLotStroke(s);
            });
            active.style.filter = 'none';
        }
        activeRef.current = null;
        setActiveEl(null);
        setCurrentInfo(INITIAL_LOT_INFO);
        if (onSelectionChange) onSelectionChange(INITIAL_LOT_INFO);
        setShowPopup(false);
        const panel = document.getElementById('lot-info-sticky-panel-v2');
        if (panel) {
            panel.classList.remove('active');
            panel.classList.add('initial-state');
        }
    }, [highlightType, onSelectionChange]);

    useEffect(() => {
        if (!clearSelectionSignal) return;
        resetSelection(byId);
    }, [clearSelectionSignal, byId, resetSelection]);

    // --- EXTERNAL SELECTION TRIGGER ---
    useEffect(() => {
        if (!externalSelectionId || !svgContainerRef.current || !data.length) return;

        const k = keyify(externalSelectionId);
        const node = [...svgContainerRef.current.querySelectorAll('[id]')].find(n => keyify(n.id) === k);

        if (node) {
            const info = byId.get(k);
            if (!info) return;
            if (!isSelectableLot(info, highlightType)) return;

            const prevActive = activeRef.current;
            if (prevActive) {
                const prevInfo = byId.get(keyify(prevActive.id));
                const prevColor = pickColor(prevInfo);
                const paintablesPrev = getPaintables(prevActive);
                paintablesPrev.forEach(s => {
                    s.style.fill = prevColor;
                    s.style.fillOpacity = '0.7';
                    s.style.removeProperty('stroke-width');
                    s.style.removeProperty('animation');
                    applyLotStroke(s);
                });
                prevActive.style.filter = 'none';
            }

            activeRef.current = node;
            setActiveEl(node);
            const paintables = getPaintables(node);
            paintables.forEach(s => {
                s.style.fill = SELECTED_COLOR;
                s.style.fillOpacity = '1';
                applyLotStroke(s);
                s.style.strokeWidth = '2px';
                s.style.animation = 'pulse-v2 2s infinite';
            });
            node.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))';

            const bbox = node.getBBox();
            const svg = svgContainerRef.current.querySelector('svg');
            if (svg) {
                const vb = svg.viewBox?.baseVal || { width: svg.clientWidth || 1000, height: svg.clientHeight || 1000 };
                const pctX = ((bbox.x + bbox.width / 2) / vb.width) * 100;
                const pctY = (bbox.y / vb.height) * 100;
                setPopupPos({ pctX, pctY, translateX: -50, isPercent: true });
                setShowPopup(true);
            }

            updateStickyPanel(info, externalSelectionId, true);
            if (onLotSelect) onLotSelect(info);
        }
    }, [externalSelectionId, data, byId, updateStickyPanel, highlightType, onLotSelect]);

    // --- HIGHLIGHT TYPE LOGIC ---
    useEffect(() => {
        if (!svgContainerRef.current || !data.length) return;

        const allIdElements = [...svgContainerRef.current.querySelectorAll('[id]')];
        const filterActive = Boolean(highlightType);

        allIdElements.forEach(node => {
            const info = byId.get(keyify(node.id));
            if (!info) return;

            const isTargetType = highlightType && norm(info.tipo) === norm(highlightType);
            const isAvailable = norm(info.estado).toLowerCase() === 'disponible';
            const paintables = getPaintables(node);
            const isHighlighted = filterActive && isTargetType && isAvailable;

            // Si el lote es el seleccionado activo, mantenemos su color de selección
            if (activeRef.current === node) return;

            const color = pickColor(info, isHighlighted);
            paintables.forEach(s => {
                s.style.fill = color;
                if (isHighlighted) {
                    s.style.fillOpacity = '1';
                    applyLotStroke(s);
                    s.style.strokeWidth = '1px';
                } else if (filterActive) {
                    s.style.fillOpacity = '0.22';
                    s.style.removeProperty('stroke-width');
                    applyLotStroke(s);
                } else {
                    s.style.fillOpacity = '0.7';
                    applyLotStroke(s);
                    s.style.removeProperty('stroke-width');
                }
            });
        });
    }, [highlightType, data, byId]);

    const initSvgLogic = useCallback((svgRoot, lotesData, byId) => {
        if (!svgRoot || !lotesData.length) return (() => { });

        const allIdElements = [...svgRoot.querySelectorAll('[id]')];
        const lotNodes = allIdElements.filter(n => {
            const info = byId.get(keyify(n.id));
            if (!info) return false;
            return true;
        });
        const lotShapeSet = new Set();
        lotNodes.forEach(node => {
            getPaintables(node).forEach(shape => lotShapeSet.add(shape));
        });

        [...svgRoot.querySelectorAll(SHAPE_SEL)].forEach(shape => {
            if (lotShapeSet.has(shape)) {
                shape.style.pointerEvents = 'auto';
                applyLotStroke(shape);
            } else {
                shape.style.pointerEvents = 'none';
            }
        });
        const cleanupHandlers = [];

        lotNodes.forEach(node => {
            const lotIdRaw = node.id;
            const info = byId.get(keyify(lotIdRaw));
            const isSelectable = isSelectableLot(info, highlightType);
            const isHighlighted = isHighlightedLot(info, highlightType);
            const filterActive = Boolean(highlightType);
            const color = pickColor(info, isHighlighted);
            const isActive = activeRef.current === node;
            const paintables = getPaintables(node);

            paintables.forEach(s => {
                if (!isActive) {
                    s.style.fill = color;
                    s.style.transition = 'fill 0.3s ease, fill-opacity 0.3s ease';
                    if (filterActive) {
                        s.style.fillOpacity = isHighlighted ? '1' : '0.22';
                        if (isHighlighted) {
                            s.style.strokeWidth = '1px';
                        } else {
                            s.style.removeProperty('stroke-width');
                        }
                    } else {
                        s.style.fillOpacity = '0.7';
                        s.style.removeProperty('stroke-width');
                    }
                    applyLotStroke(s);
                }
                s.style.cursor = isSelectable ? 'pointer' : 'not-allowed';
            });
            node.style.pointerEvents = 'auto';

            const onEnter = () => {
                if (!isSelectable) return;
                if (!activeRef.current) updateStickyPanel(info, lotIdRaw, false);
                if (activeRef.current !== node) {
                    paintables.forEach(s => {
                        s.style.fillOpacity = isHighlighted ? '1' : '0.9';
                        s.style.filter = 'brightness(1.1)';
                    });
                }
            };

            const onLeave = () => {
                if (!isSelectable) return;
                if (!activeRef.current) updateStickyPanel(INITIAL_LOT_INFO, null, false);
                if (activeRef.current !== node) {
                    paintables.forEach(s => {
                        s.style.fillOpacity = isHighlighted ? '1' : '0.7';
                        s.style.filter = 'none';
                    });
                }
            };

            const onClick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (!isSelectable) return;

                if (activeRef.current === node) {
                    setShowPopup(true);
                    return;
                }

                setShowPopup(true);

                const prevActive = activeRef.current;
                if (prevActive) {
                    const prevInfo = byId.get(keyify(prevActive.id));
                    const prevColor = pickColor(prevInfo);
                    getPaintables(prevActive).forEach(s => {
                        s.style.fill = prevColor;
                        s.style.fillOpacity = '0.7';
                        s.style.removeProperty('stroke-width');
                        s.style.removeProperty('animation');
                        applyLotStroke(s);
                    });
                    prevActive.style.filter = 'none';
                }

                activeRef.current = node;
                setActiveEl(node);
                paintables.forEach(s => {
                    s.style.fill = SELECTED_COLOR;
                    s.style.fillOpacity = '1';
                    applyLotStroke(s);
                    s.style.strokeWidth = '2px';
                    s.style.animation = 'pulse-v2 2s infinite';
                });
                node.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))';

                const bbox = node.getBBox();
                const svg = svgContainerRef.current.querySelector('svg');
                if (svg) {
                    // Try to get viewBox, fallback to width/height if necessary
                    const vb = svg.viewBox?.baseVal || { width: svg.clientWidth || 1000, height: svg.clientHeight || 1000 };

                    const pctX = ((bbox.x + bbox.width / 2) / vb.width) * 100;
                    const pctY = (bbox.y / vb.height) * 100;

                    setPopupPos({ pctX, pctY, translateX: -50, isPercent: true });
                    setShowPopup(true);
                }

                updateStickyPanel(info, lotIdRaw, true);
                if (onLotSelect) onLotSelect(info);
            };

            node.addEventListener('mouseenter', onEnter);
            node.addEventListener('mouseleave', onLeave);
            node.addEventListener('click', onClick);

            cleanupHandlers.push(() => {
                node.removeEventListener('mouseenter', onEnter);
                node.removeEventListener('mouseleave', onLeave);
                node.removeEventListener('click', onClick);
                node.style.filter = 'none';
            });
        });

        const onDocClick = (e) => {
            if (!activeRef.current) return;
            const clickedInPanel = document.getElementById('lot-info-sticky-panel-v2')?.contains(e.target);
            const clickedInSVG = svgContainerRef.current?.contains(e.target);
            const clickedInPopup = e.target.closest('.lot-info-popup-v2');
            const clickedInSheet = e.target.closest('.mobile-bottom-sheet-v2');
            const clickedInBackdrop = e.target.classList.contains('mobile-backdrop-v2');

            if (!clickedInSVG && !clickedInPanel && !clickedInPopup && !clickedInSheet && !clickedInBackdrop) {
                resetSelection(byId);
            }
        };

        document.addEventListener('click', onDocClick);
        cleanupHandlers.push(() => document.removeEventListener('click', onDocClick));

        return () => cleanupHandlers.forEach(fn => fn());
    }, [byId, updateStickyPanel, resetSelection, highlightType, onLotSelect]);

    useEffect(() => {
        if (!data.length || !svgContent || !svgContainerRef.current) return;

        cleanupRef.current?.();

        // Brief delay to ensure SVG is in DOM before attaching logic
        const timer = setTimeout(() => {
            cleanupRef.current = initSvgLogic(svgContainerRef.current, data, byId);
            updateStickyPanel(INITIAL_LOT_INFO, null, false);
        }, 100);

        return () => {
            clearTimeout(timer);
            cleanupRef.current?.();
        };
    }, [data, svgContent, byId, initSvgLogic, updateStickyPanel]);

    const { titulo, estado, tipo, nota } = currentInfo;
    const isInitial = !currentInfo.titulo && !currentInfo.id && !currentInfo.numero;
    const isPanelActive = activeEl !== null;

    const rawVal = titulo || currentInfo.id || currentInfo.numero || '';
    let numero = norm(rawVal);
    if (!numero || numero === 'UNDEFINED') numero = 'Lote Seleccionado';
    else if (!numero.includes('LOTE')) numero = `LOTE ${numero}`;

    const currentStatus = norm(estado).toUpperCase() || 'ESTADO DESCONOCIDO';

    // --- MAPEO ROBUSTO DE DATOS DESDE EXCEL/WEBHOOK ---
    // Buscamos superficie en varias llaves comunes (Excel a veces exporta con variaciones)
    const rawSup = currentInfo.superficie_m2 || currentInfo.superficie || currentInfo.area || currentInfo.m2 || currentInfo.metros || '';
    // Buscamos costo en varias llaves comunes (precio, costo, costo_m2)
    let rawCosto = currentInfo.costo_m2 || currentInfo.costo || currentInfo.precio || currentInfo.valor || '';

    // --- FALLBACK POR TIPO SI NO HAY COSTO EN EXCEL ---
    if (!rawCosto && norm(estado).toLowerCase() === 'disponible') {
        const t = norm(tipo).toUpperCase();
        if (t === 'A') rawCosto = 800;
        else if (t === 'AA') rawCosto = 990;
        else if (t === 'AAA') rawCosto = 1100;
    }

    const formattedCosto = formatCurrency(rawCosto);
    const sup = rawSup ? `${Number(String(rawSup).replace(/[, ]/g, '')).toLocaleString('es-MX')} m²` : 'Consultar m²';

    const estadoLower = norm(estado).toLowerCase();
    const isCommonArea = !rawCosto || rawCosto === null || (String(rawCosto).toLowerCase() === 'consultar');
    const cotizarText = RESERVED_STATUSES.includes(estadoLower) ? 'ME INTERESA SI SE LIBERA' : (isCommonArea ? 'CONSULTAR COTIZACIÓN' : 'COTIZAR AHORA');

    const isReservado = RESERVED_STATUSES.includes(estadoLower);
    const isVendido = estadoLower === 'vendido';
    const linkSimilares = `${WHATSAPP_BASE}${encodeURIComponent(`Hola, me interesó el ${numero}, pero veo que está separado. Quisiera conocer los lotes disponibles similares.`)}`;
    const linkLiberacion = `${WHATSAPP_BASE}${encodeURIComponent(`Hola, me interesó el ${numero}, pero veo que está separado. Me interesaría si se libera.`)}`;

    let finalLink = '#';
    let target = '_self';
    if (isVendido) finalLink = '#';
    else if (isReservado) { finalLink = linkLiberacion; target = '_blank'; }
    else {
        const waMsg = `Hola, me interesa el ${numero}, con superficie de ${sup} y costo de ${formattedCosto}. Estado: ${currentStatus}.`;
        finalLink = `${WHATSAPP_BASE}${encodeURIComponent(waMsg)}`;
        target = '_blank';
    }

    return (
        <div id="mapa-wrapper-v2" className={`mapa-wrapper-v2 ${layoutV2 ? 'layout-v2-active' : ''}`}>
            <div id="mapa-main-container-v2" className="mapa-main-container-v2">
                <section id="mapa-section-v2" className="mapa-section-v2">
                    {!layoutV2 && (
                        <aside className="info-sticky-wrapper-v2">
                            <div id="lot-info-sticky-panel-v2" className={`lot-info-sticky-panel-v2 ${isPanelActive ? 'active' : ''} ${isInitial ? 'initial-state' : ''}`}>
                                <div className="panel-title-v2">{!isInitial ? numero : 'INFORMACIÓN'}</div>
                                <div className="lot-number-v2">{loading ? 'Cargando...' : (!isInitial ? 'DETALLES TÉCNICOS' : numero)}</div>
                                {!isInitial && (
                                    <div className="lot-details-v2">
                                        <p><strong>Superficie:</strong> {sup}</p>
                                        <p><strong>Tipo:</strong> {norm(tipo)}</p>
                                        <p><strong>Precio por m2:</strong> {formattedCosto}</p>
                                    </div>
                                )}
                                <div className="lot-status-v2" style={{ color: pickColor({ estado }) }}>{currentStatus}</div>
                                {!isInitial && (
                                    <div className="lot-actions-v2">
                                        <a className={`btn-v2 cotizar-btn-v2 ${isVendido ? 'disabled-btn-v2' : ''}`} href={finalLink} target={target} rel="noopener noreferrer">
                                            {cotizarText}
                                        </a>
                                        <button className="btn-v2 change-lot-btn-v2" onClick={() => resetSelection(byId)}>Ver otro lote</button>
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}

                    <div className="map-column-v2">
                        <div className="map-relative-wrapper-v2">
                            {showPopup && !isMobile && (
                                <div className="lot-info-popup-v2 desktop-only-v2" style={{ left: `${popupPos.pctX}%`, top: `${popupPos.pctY}%` }}>
                                    <button className="popup-close-v2" onClick={() => setShowPopup(false)}>×</button>
                                    <div className="popup-content-v2">
                                        <h3>{numero}</h3>
                                        <p className="popup-status-v2" style={{ color: pickColor({ estado }) }}>{currentStatus}</p>
                                        <div className="popup-details-v2">
                                            <div className="popup-detail-row-v2"><strong>Superficie:</strong> <span>{sup}</span></div>
                                            <div className="popup-detail-row-v2"><strong>Tipo:</strong> <span>{norm(tipo)}</span></div>
                                            <div className="popup-detail-row-v2"><strong>Precio m²:</strong> <span>{formattedCosto}</span></div>
                                        </div>
                                        <a href={finalLink} target={target} className={`popup-cta-v2 ${isVendido ? 'disabled' : ''}`}>
                                            {isVendido ? 'LOTE VENDIDO' : cotizarText}
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div id="svgmap-v2" className="svgmap-v2" ref={svgContainerRef} dangerouslySetInnerHTML={{ __html: svgContent }} />
                        </div>
                    </div>
                </section>
            </div>

            {isMobile && createPortal(
                <>
                    <div className={`mobile-backdrop-v2 ${showPopup ? 'active' : ''}`} onClick={() => setShowPopup(false)}></div>
                    <div className={`mobile-bottom-sheet-v2 ${showPopup ? 'active' : ''}`}>
                        <div className="sheet-handle-v2" onClick={() => setShowPopup(false)}></div>
                        <div className="sheet-content-v2">
                            <div className="sheet-header-v2">
                                <h3>{numero}</h3>
                                <button className="sheet-close-v2" onClick={() => setShowPopup(false)}>×</button>
                            </div>
                            <p className="popup-status-v2" style={{ color: pickColor({ estado }) }}>{currentStatus}</p>
                            <div className="popup-details-v2">
                                <div className="popup-detail-row-v2"><strong>Superficie:</strong> <span>{sup}</span></div>
                                <div className="popup-detail-row-v2"><strong>Tipo:</strong> <span>{norm(tipo)}</span></div>
                                <div className="popup-detail-row-v2"><strong>Precio m²:</strong> <span>{formattedCosto}</span></div>
                            </div>

                            {/* Availability Info Section */}
                            <div className="sheet-availability-v2">
                                <div className="avail-label">Quedan <strong className={availability[norm(tipo)]?.hikeScarcity === 1 ? 'urgent-red' : availability[norm(tipo)]?.hikeScarcity > 1 ? 'urgent-yellow' : ''}>{availability[norm(tipo)]?.hikeScarcity || 0} lotes tipo {norm(tipo)}</strong> a</div>
                                <div className="avail-price">${formatCurrency(availability[norm(tipo)]?.minPrice || 0).replace('$', '')}/m²</div>
                            </div>

                            {/* FINANCING RECTANGLE (Mobile Specific) */}
                            <div className="sheet-financing-v2">
                                <span className="fin-tag">FINANCIAMIENTO DISPONIBLE</span>
                                <div className="fin-grid-v2">
                                    <div className="fin-item-v2">
                                        <FontAwesomeIcon icon={faCreditCard} className="fin-icon-small" />
                                        <strong>40</strong> MSI
                                    </div>
                                    <div className="fin-item-v2">
                                        <FontAwesomeIcon icon={faCalendarCheck} className="fin-icon-small" />
                                        <strong>3</strong> ANUALIDADES
                                    </div>
                                    <div className="fin-item-v2">
                                        <FontAwesomeIcon icon={faFileSignature} className="fin-icon-small" />
                                        PAGO CONTRA ESCRITURA
                                    </div>
                                </div>
                            </div>

                            {isReservado ? (
                                <div className="sheet-dual-actions-v2">
                                    <a href={linkSimilares} target="_blank" rel="noopener noreferrer" className="popup-cta-v2 simil-btn-v2">Ver Lotes Similares</a>
                                    <a href={linkLiberacion} target="_blank" rel="noopener noreferrer" className="popup-cta-v2 release-btn-v2">Avisarme si se libera</a>
                                </div>
                            ) : (
                                <a href={finalLink} target={target} className={`popup-cta-v2 ${isVendido ? 'disabled' : ''}`}>
                                    {isVendido ? 'LOTE NO DISPONIBLE' : cotizarText}
                                </a>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
