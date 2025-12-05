import React, { useEffect, useRef, useCallback, useState } from 'react';
import './InteractiveMap.css';

// --- Constantes y Configuración (Basado en tu script Vanilla) ---
const DATA_URL = 'https://n8n.srv894483.hstgr.cloud/webhook/lotes-json';
const WHATSAPP_BASE = 'https://wa.me/528123852034?text=';
const CONTACTO_URL = '/Contacto'; // Fallback si no hay link
const SVG_PATH = '/SVGmapa.svg';

// Colores actualizados según tu script Vanilla
const COLOR_BY_STATUS = {
    disponible: '#66bb6a', // Verde
    reservado: '#fde68a',  // Amarillo
    vendido: '#ef5350',    // Rojo
    bloqueado: '#e5e7eb',  // Gris
    'n/a': '#e5e7eb'
};

const COLOR_PRESETS = {
    verde: '#66bb6a',
    amarillo: '#fde68a',
    rojo: '#ef5350',
    gris: '#e5e7eb'
};

const FALLBACK_COLOR = '#d1e7dd';
const SHAPE_SEL = 'path,polygon,rect,ellipse';

const INITIAL_LOT_INFO = {
    titulo: 'PASA EL CURSOR POR EL MAPA',
    superficie_m2: null,
    estado: 'n/a',
    tipo: 'Tipo',
    costo_m2: null,
    nota: 'Da click en el lote para seleccionar'
};

// --- Funciones Utilitarias (Lógica Vanilla portada) ---
function norm(s) { return String(s ?? '').trim(); }

function keyify(s) {
    return norm(s).toLowerCase().replace(/lote[\s_:-]*/g, 'lote').replace(/[^a-z0-9]/g, '');
}

function pickColor(info) {
    if (!info) return FALLBACK_COLOR;
    const estado = norm(info.estado).toLowerCase();
    const c = norm(info.color);
    
    if (c) {
        if (c.startsWith('#') || /^rgb|^hsl/i.test(c)) return c;
        if (COLOR_PRESETS[c.toLowerCase()]) return COLOR_PRESETS[c.toLowerCase()];
    }
    return COLOR_BY_STATUS[estado] || FALLBACK_COLOR;
}

// Esta función es crucial para leer la respuesta de N8N correctamente
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

// --- COMPONENTE PRINCIPAL ---
export default function InteractiveMap() {
    const svgContainerRef = useRef(null);
    const cleanupRef = useRef(null);

    const [data, setData] = useState([]);
    const [svgContent, setSvgContent] = useState('');
    const [activeEl, setActiveEl] = useState(null);
    const [currentInfo, setCurrentInfo] = useState(INITIAL_LOT_INFO);
    const [loading, setLoading] = useState(true);

    // 1. Cargar SVG
    useEffect(() => {
        fetch(SVG_PATH)
            .then(res => {
                if (!res.ok) throw new Error('Error HTTP SVG');
                return res.text();
            })
            .then(text => setSvgContent(text))
            .catch(err => console.error('Error cargando SVG:', err));
    }, []);

    // 2. Cargar Datos desde API N8N (Reemplaza localStorage)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(DATA_URL, { cache: 'no-store' });
                if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
                
                const jsonData = await response.json();
                const processedData = normalizeRows(jsonData);
                
                console.log('Datos cargados de N8N:', processedData.length, 'lotes.');
                setData(processedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 3. Lógica de UI: Sticky Panel
    const updateStickyPanel = useCallback((info, lotId, isClick = false) => {
        const panel = document.getElementById('lot-info-sticky-panel');
        const infoToUse = info && Object.keys(info).length > 0 ? info : INITIAL_LOT_INFO;

        if (activeEl && !isClick) return; // Si hay selección activa, ignorar hover

        setCurrentInfo(infoToUse);

        if (panel) {
            if (isClick) {
                panel.classList.add('active');
                panel.classList.remove('initial-state');
            } else {
                panel.classList.remove('active');
                panel.classList.add('initial-state');
            }
        }
    }, [activeEl]);

    const resetSelection = useCallback(() => {
        if (activeEl) { activeEl.style.filter = 'none'; }
        setActiveEl(null);
        setCurrentInfo(INITIAL_LOT_INFO);
        document.getElementById('lot-info-sticky-panel')?.classList.remove('active');
        document.getElementById('lot-info-sticky-panel')?.classList.add('initial-state');
    }, [activeEl]);

    // 4. Inicializar Lógica del SVG (Pintado y Eventos)
    const initSvgLogic = useCallback((svgRoot, lotesData) => {
        if (!svgRoot || !lotesData.length) return (() => {});

        const allIdElements = [...svgRoot.querySelectorAll('[id]')];
        
        // Mapeo rápido por ID normalizado
        const byId = new Map();
        lotesData.forEach(r => {
            const k = keyify(r.id ?? r.Id ?? '');
            if (k) byId.set(k, r);
        });

        const lotNodes = allIdElements.filter(n => byId.has(keyify(n.id)));
        const cleanupHandlers = [];

        lotNodes.forEach(node => {
            const lotIdRaw = node.id;
            const info = byId.get(keyify(lotIdRaw));
            const color = pickColor(info);

            // Pintar las formas internas
            const paintables = node.matches(SHAPE_SEL) 
                ? [node] 
                : [...node.querySelectorAll(SHAPE_SEL)].filter(isPaintable);

            paintables.forEach(s => {
                s.style.fill = color;
                s.style.fillOpacity = '0.7'; // Un poco más sólido para ver mejor el color
                s.style.transition = 'fill 0.3s ease';
                s.style.cursor = 'pointer';
            });
            node.style.pointerEvents = 'auto';

            // Event Handlers
            const onEnter = () => {
                if (!activeEl) updateStickyPanel(info, lotIdRaw, false);
                if (activeEl !== node) node.style.filter = 'brightness(0.85)'; // Efecto hover
            };

            const onLeave = () => {
                if (!activeEl) updateStickyPanel(INITIAL_LOT_INFO, null, false);
                if (activeEl !== node) node.style.filter = 'none';
            };

            const onClick = (ev) => {
                ev.stopPropagation();
                if (activeEl === node) return;
                
                // Limpiar anterior
                if (activeEl) activeEl.style.filter = 'none';

                // Activar nuevo
                setActiveEl(node);
                // Efecto de selección (Glow + Brillo)
                node.style.filter = 'drop-shadow(0 0 5px rgba(0,0,0,0.5)) brightness(1.1)';
                
                updateStickyPanel(info, lotIdRaw, true);
            };

            node.addEventListener('mouseenter', onEnter);
            node.addEventListener('mouseleave', onLeave);
            node.addEventListener('click', onClick);
            node.addEventListener('touchend', onClick, { passive: true });

            cleanupHandlers.push(() => {
                node.removeEventListener('mouseenter', onEnter);
                node.removeEventListener('mouseleave', onLeave);
                node.removeEventListener('click', onClick);
                node.removeEventListener('touchend', onClick);
                node.style.filter = 'none';
            });
        });

        // Click fuera para resetear
        const onDocClick = (e) => {
            if (!activeEl) return;
            const clickedInPanel = document.getElementById('lot-info-sticky-panel')?.contains(e.target);
            const clickedInSVG = svgContainerRef.current?.contains(e.target);

            if (!clickedInSVG && !clickedInPanel) {
                resetSelection();
            }
        };

        document.addEventListener('click', onDocClick);
        cleanupHandlers.push(() => document.removeEventListener('click', onDocClick));

        return () => cleanupHandlers.forEach(fn => fn());

    }, [activeEl, updateStickyPanel, resetSelection]);

    // 5. Sincronización final: Data + SVG
    useEffect(() => {
        if (!data.length || !svgContent || !svgContainerRef.current) return;

        cleanupRef.current?.();

        // Pequeño delay para asegurar renderizado del DOM SVG
        const t = setTimeout(() => {
            cleanupRef.current = initSvgLogic(svgContainerRef.current, data);
            
            // Inicializar panel
            document.getElementById('lot-info-sticky-panel')?.classList.add('initial-state');
            updateStickyPanel(INITIAL_LOT_INFO, null, false);
        }, 100);

        return () => {
            clearTimeout(t);
            cleanupRef.current?.();
        };
    }, [data, svgContent, initSvgLogic, updateStickyPanel]);


    // --- RENDER HELPERS ---
    const { titulo, superficie_m2, estado, tipo, costo_m2, nota, link } = currentInfo;
    const isInitial = currentInfo === INITIAL_LOT_INFO;
    const isPanelActive = activeEl !== null;

    const numero = norm(titulo) || 'Lote Seleccionado';
    const currentStatus = norm(estado).toUpperCase() || 'ESTADO DESCONOCIDO';
    const formattedCosto = formatCurrency(costo_m2);
    const sup = superficie_m2 ? `${Number(String(superficie_m2).replace(/[, ]/g, '')).toLocaleString('es-MX')} m²` : 'm² no disponible';

    // Lógica Botones (WhatsApp)
    const estadoLower = norm(estado).toLowerCase();
    
    // 🛑 CORRECCIÓN CRUCIAL: Si no tiene costo o el costo es 'Consultar', se asume que es área común y se deshabilita.
    const isCommonArea = !costo_m2 || costo_m2 === null || (String(costo_m2).toLowerCase() === 'consultar');
    
    const isDisabled = ['vendido', 'bloqueado'].includes(estadoLower) || isCommonArea;
    
    const cotizarText = estadoLower === 'reservado' ? 'Contactarme si se libera' : 'COTIZAR';

    let finalLink = '#';
    let target = '_self';

    if (!isDisabled) {
        if (estadoLower === 'reservado') {
            finalLink = norm(link) || CONTACTO_URL;
        } else {
            // Mensaje de WhatsApp personalizado
            const waMsg = `Hola, me interesa el ${numero}, con superficie de ${sup} y costo de ${formattedCosto}. Estado: ${currentStatus}.`;
            finalLink = `${WHATSAPP_BASE}${encodeURIComponent(waMsg)}`;
            target = '_blank';
        }
    }

    return (
        <div id="mapa-wrapper" className="mapa-wrapper">
            <div id="mapa-main-container" className="mapa-main-container">

                {/* Header / Leyenda */}
                <header className="map-header">
                    <div className="map-legend-panel">
                        <h2 className="legend-title">Disponibilidad de Terrenos</h2>
                        <div className="status-legend">
                            {/* Usamos los mismos colores definidos en las constantes */}
                            <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_STATUS.vendido}}></span>VENDIDO</div>
                            <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_STATUS.reservado}}></span>SEPARADO</div>
                            <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_STATUS.disponible}}></span>DISPONIBLE</div>
                            <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_STATUS.bloqueado}}></span>PRÓXIMAMENTE</div>
                        </div>
                    </div>
                </header>

                <section id="mapa-section" className="mapa-section">
                    
                    {/* Panel Izquierdo (Sticky) */}
                    <aside className="info-sticky-wrapper">
                        <div 
                            id="lot-info-sticky-panel" 
                            className={`lot-info-sticky-panel ${isPanelActive ? 'active' : ''} ${isInitial ? 'initial-state' : ''}`}
                        >
                            <div className="panel-title">{!isInitial ? 'TU LOTE SELECCIONADO' : 'INFORMACIÓN'}</div>

                            <div id="lot-number" className="lot-number">
                                {loading ? 'Cargando...' : numero}
                            </div>

                            {!isInitial && (
                                <div className="lot-details">
                                    <p><strong>Superficie:</strong> {sup}</p>
                                    <p><strong>Tipo:</strong> {norm(tipo)}</p>
                                    <p><strong>Precio Total:</strong> {formattedCosto}</p>
                                </div>
                            )}

                            {isInitial && !loading && (
                                <div className="initial-instructions">
                                    <p className="large-text">PASA EL CURSOR POR EL MAPA</p>
                                    <p className="small-text">Da click en el lote para ver detalles y cotizar</p>
                                </div>
                            )}

                            <div 
                                id="lot-status" 
                                className="lot-status" 
                                style={{ color: pickColor({ estado }) }}
                            >
                                {currentStatus}
                            </div>
                            
                            <div className="lot-note">{norm(nota)}</div>

                            {!isInitial && (
                                <div className="lot-actions">
                                    <a 
                                        id="cotizar-btn" 
                                        className={`btn cotizar-btn ${isDisabled ? 'disabled-btn' : ''}`} 
                                        href={finalLink} 
                                        target={target} 
                                        rel="noopener noreferrer"
                                        onClick={(e) => isDisabled && e.preventDefault()}
                                    >
                                        {cotizarText}
                                    </a>
                                    
                                    <button 
                                        className="btn change-lot-btn"
                                        onClick={resetSelection}
                                    >
                                        Ver otro lote
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Mapa SVG */}
                    <div className="map-column">
                        <div
                            id="svgmap"
                            className="svgmap"
                            ref={svgContainerRef}
                            // Inyección segura del SVG string
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}