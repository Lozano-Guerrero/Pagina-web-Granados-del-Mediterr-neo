import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import './InteractiveMap.css';

// --- Constantes y Configuración (Basado en tu script Vanilla) ---
const DATA_URL = 'https://n8n.srv894483.hstgr.cloud/webhook/lotes-json';
const WHATSAPP_BASE = 'https://wa.me/528123852034?text=';
const CONTACTO_URL = '/Contacto'; // Fallback si no hay link
const SVG_PATH = '/SVGmapa.svg';

// Colores por ESTADO (Vendido, Separado, Bloqueado)
const COLOR_BY_STATUS = {
    disponible: '#66bb6a', // Verde genérico (usado como fallback)
    reservado: '#fde68a',  // Separado (Amarillo)
    vendido: '#ef5350',    // Vendido (Rojo)
    bloqueado: '#c2c1ba',  // Bloqueado / Próximamente (Gris)
    'n/a': '#e5e7eb'
};

// ✅ NUEVOS COLORES BASADOS EN EL TIPO (A, AA, AAA)
const COLOR_BY_TYPE = {
    A: '#9ed9b5',  // A - Verde Claro
    AA: '#3fae6a', // AA - Verde Medio
    AAA: '#1f6f43', // AAA - Verde Oscuro
};

const COLOR_PRESETS = {
    verde: '#66bb6a',
    amarillo: '#fde68a',
    rojo: '#ef5350',
    gris: '#e5e7eb',
};

const SELECTED_COLOR = '#E2725B'; // Color de selección (Rosa terracota)

const FALLBACK_COLOR = '#d1e7dd';
const SHAPE_SEL = 'path,polygon,rect,ellipse';

const INITIAL_LOT_INFO = {
    // Título que se muestra en el panel al inicio
    titulo: 'Selecciona un lote en el mapa', 
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

/**
 * Función crucial: Define el color de relleno basado en el estado y tipo.
 * @param {object} info - Objeto con las propiedades del lote.
 * @returns {string} Código hexadecimal del color.
 */
function pickColor(info) {
    if (!info) return FALLBACK_COLOR;
    const estado = norm(info.estado).toLowerCase();
    const tipo = norm(info.tipo).toUpperCase(); // Leer el tipo
    
    // 1. Verificar si hay una propiedad 'color' forzada (ej. en el CSV/JSON)
    const c = norm(info.color);
    if (c) {
        if (c.startsWith('#') || /^rgb|^hsl/i.test(c)) return c;
        if (COLOR_PRESETS[c.toLowerCase()]) return COLOR_PRESETS[c.toLowerCase()];
    }

    // ✅ 2. Si el estado es "Disponible", usar el color del TIPO (A, AA, AAA)
    if (estado === 'disponible') {
        if (COLOR_BY_TYPE[tipo]) {
            return COLOR_BY_TYPE[tipo]; // Usa el color específico del tipo A/AA/AAA
        }
        // Si está disponible pero no tiene tipo, cae al verde genérico
        return COLOR_BY_STATUS.disponible;
    }

    // 3. Usar el color del ESTADO (Vendido, Reservado, Bloqueado, etc.)
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

function getPaintables(node) {
    return node.matches(SHAPE_SEL) 
        ? [node] 
        : [...node.querySelectorAll(SHAPE_SEL)].filter(isPaintable);
}

// --- COMPONENTE PRINCIPAL ---
export default function InteractiveMap() {
    const svgContainerRef = useRef(null);
    const cleanupRef = useRef(null);
    const activeRef = useRef(null);

    const [data, setData] = useState([]);
    const [svgContent, setSvgContent] = useState('');
    const [activeEl, setActiveEl] = useState(null);
    const [currentInfo, setCurrentInfo] = useState(INITIAL_LOT_INFO);
    const [loading, setLoading] = useState(true);

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

        if (activeRef.current && !isClick) return; // Si hay selección activa, ignorar hover

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
    }, []); 

    const resetSelection = useCallback((byId) => {
        const active = activeRef.current;
        if (active) {
            const info = byId.get(keyify(active.id));
            const color = pickColor(info);
            const paintables = getPaintables(active);
            paintables.forEach(s => {
                s.style.fill = color;
            });
            active.style.filter = 'none';
        }
        setActiveEl(null);
        setCurrentInfo(INITIAL_LOT_INFO);
        document.getElementById('lot-info-sticky-panel')?.classList.remove('active');
        document.getElementById('lot-info-sticky-panel')?.classList.add('initial-state');
    }, []); 

    // 4. Inicializar Lógica del SVG (Pintado y Eventos)
    const initSvgLogic = useCallback((svgRoot, lotesData, byId) => {
        if (!svgRoot || !lotesData.length) return (() => {});

        const allIdElements = [...svgRoot.querySelectorAll('[id]')];
        
        const lotNodes = allIdElements.filter(n => byId.has(keyify(n.id)));
        const cleanupHandlers = [];

        lotNodes.forEach(node => {
            const lotIdRaw = node.id;
            const info = byId.get(keyify(lotIdRaw));
            const color = pickColor(info); // Obtener color (incluye lógica de tipo A/AA/AAA)

            // Pintar las formas internas
            const paintables = getPaintables(node);

            paintables.forEach(s => {
                s.style.fill = color;
                s.style.fillOpacity = '0.7'; 
                s.style.transition = 'fill 0.3s ease';
                s.style.cursor = 'pointer';
            });
            node.style.pointerEvents = 'auto';

            // Event Handlers
            const onEnter = () => {
                if (!activeRef.current) updateStickyPanel(info, lotIdRaw, false);
                if (activeRef.current !== node) node.style.filter = 'brightness(0.85)'; 
            };

            const onLeave = () => {
                if (!activeRef.current) updateStickyPanel(INITIAL_LOT_INFO, null, false);
                if (activeRef.current !== node) node.style.filter = 'none';
            };

            const onClick = (ev) => {
                ev.stopPropagation();
                if (activeRef.current === node) return;
                
                // Limpiar anterior
                const prevActive = activeRef.current;
                if (prevActive) {
                    const prevInfo = byId.get(keyify(prevActive.id));
                    const prevColor = pickColor(prevInfo);
                    const prevPaintables = getPaintables(prevActive);
                    prevPaintables.forEach(s => {
                        s.style.fill = prevColor;
                    });
                    prevActive.style.filter = 'none';
                }

                // Activar nuevo
                setActiveEl(node);
                const selectedPaintables = getPaintables(node);
                selectedPaintables.forEach(s => {
                    s.style.fill = SELECTED_COLOR;
                });
                node.style.filter = 'drop-shadow(0 0 5px rgba(0,0,0,0.5))';
                
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
            if (!activeRef.current) return;
            const clickedInPanel = document.getElementById('lot-info-sticky-panel')?.contains(e.target);
            const clickedInSVG = svgContainerRef.current?.contains(e.target);

            if (!clickedInSVG && !clickedInPanel) {
                resetSelection(byId);
            }
        };

        document.addEventListener('click', onDocClick);
        cleanupHandlers.push(() => document.removeEventListener('click', onDocClick));

        return () => cleanupHandlers.forEach(fn => fn());

    }, [byId, updateStickyPanel, resetSelection]); // Añadir dependencias faltantes

    // 5. Sincronización final: Data + SVG
    useEffect(() => {
        if (!data.length || !svgContent || !svgContainerRef.current) return;

        cleanupRef.current?.();

        // Pequeño delay para asegurar renderizado del DOM SVG
        const t = setTimeout(() => {
            cleanupRef.current = initSvgLogic(svgContainerRef.current, data, byId);
            
            // Inicializar panel
            document.getElementById('lot-info-sticky-panel')?.classList.add('initial-state');
            updateStickyPanel(INITIAL_LOT_INFO, null, false);
        }, 100);

        return () => {
            clearTimeout(t);
            cleanupRef.current?.();
        };
    }, [data, svgContent, byId, initSvgLogic, updateStickyPanel]);


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
    
    // 🛑 Corrección: Si no tiene costo, se asume que es área común y se deshabilita.
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
                            {/* Estados Generales */}
                            <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_STATUS.vendido}}></span>VENDIDO</div>
                            <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_STATUS.reservado}}></span>SEPARADO</div>
                            <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_STATUS.bloqueado}}></span>PRÓXIMAMENTE</div>
                            
                            {/* ✅ NUEVA LÓGICA: Tipos de Lote Disponibles (A, AA, AAA) */}
                            <div className="status-item-group">
                                <strong>DISPONIBLE:</strong>
                                <div className="status-item-inner">
                                    <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_TYPE.A}}></span>Tipo A</div>
                                    <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_TYPE.AA}}></span>Tipo AA</div>
                                    <div className="status-item"><span className="status-color" style={{backgroundColor: COLOR_BY_TYPE.AAA}}></span>Tipo AAA</div>
                                </div>
                            </div>
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
                                    <p><strong>Precio por m2:</strong> {formattedCosto}</p>
                                </div>
                            )}

                            {isInitial && !loading && (
                                <div className="initial-instructions">
                                    {/* TEXTO DE ESCRITORIO */}
                                    <p className="large-text desktop-only">PASA EL CURSOR POR EL MAPA</p>
                                    
                                    {/* NUEVO TEXTO DE MÓVIL */}
                                    <p className="large-text mobile-only">SELECCIONA TU LOTE</p>
                                    
                                    {/* TEXTO DE INSTRUCCIÓN UNIFICADO */}
                                    <p className="small-text">Dando click en el mapa para ver detalles y cotizar</p>
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
                                        onClick={() => resetSelection(byId)}
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