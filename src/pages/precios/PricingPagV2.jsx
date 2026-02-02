
import React, { useState, useEffect, useCallback } from 'react';
import './PricingPagV2.css';
import PriceEvolutionCard from '../../components/PriceEvolutionCard.jsx';
import LotTypeCards from '../../components/LotTypeCards.jsx';
import InteractiveMapV2 from '../../components/InteractiveMapV2.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faCalendarCheck, faFileSignature, faHandHoldingUsd, faArrowUp } from '@fortawesome/free-solid-svg-icons';

const WHATSAPP_BASE = 'https://wa.me/528123852034?text=';
const RESERVED_STATUSES = ['reservado', 'separado', 'apartado', 'bloqueado', 'estacionamiento'];
const INITIAL_LOT_INFO = { titulo: '', superficie_m2: '', estado: 'DISPONIBLE', tipo: 'A', costo_m2: '', nota: '' };

const PricingPagV2 = () => {
    const [isNoteCollapsed, setIsNoteCollapsed] = useState(false);
    const [selectedLot, setSelectedLot] = useState(INITIAL_LOT_INFO);
    const [availability, setAvailability] = useState({
        A: { count: 0, minPrice: 800, lastLot: null },
        AA: { count: 0, minPrice: 990, lastLot: null },
        AAA: { count: 0, minPrice: 1100, lastLot: null },
        m14: null,
        l14: null,
        loading: true
    });
    const [triggeredLoteId, setTriggeredLoteId] = useState(null);
    const [activeModalType, setActiveModalType] = useState(null); // 'A', 'AA', 'AAA' or null
    const [tutorialStep, setTutorialStep] = useState(0); // 0 = inactive, 1=A, 2=AA, 3=AAA, 4=Fin
    const [highlightType, setHighlightType] = useState(null); // 'A', 'AA', 'AAA' o null


    const handleMapSelection = useCallback((info) => {
        setSelectedLot(info);
    }, []);

    const norm = (val) => val?.toString().trim().toUpperCase() || '';

    const formatCurrency = (value) => {
        if (!value) return 'Consultar';
        const num = Number(String(value).replace(/[, ]/g, ''));
        return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
    };

    const formatCurrencyNoSymbol = (value) => {
        if (!value) return '0';
        const num = Number(String(value).replace(/[, ]/g, ''));
        return num.toLocaleString('es-MX', { maximumFractionDigits: 0 });
    };
    useEffect(() => {
        window.scrollTo(0, 0);
        document.body.style.overflow = 'auto';

        const fetchAvailability = async () => {
            try {
                const response = await fetch('https://n8n.srv894483.hstgr.cloud/webhook/dc83e669-fc96-4384-9a3a-f463a9df64c1');
                if (!response.ok) throw new Error('Network response was not ok');
                const responseData = await response.json();

                // n8n a veces devuelve [{ json: {...} }] o [{ summary, lotes }]
                const root = (Array.isArray(responseData) && responseData[0]) ? (responseData[0].json || responseData[0]) : responseData;

                const summary = root.summary || {};
                const rows = root.lotes || (Array.isArray(root) ? root : []);

                const stats = {
                    A: { count: 0, prices: [], lastLot: null },
                    AA: { count: 0, prices: [], lastLot: null },
                    AAA: { count: 0, prices: [], lastLot: null }
                };

                rows.forEach(r => {
                    const type = norm(r.tipo || r.Tipo);
                    const status = norm(r.estado || r.Estado).toLowerCase();
                    const stage = norm(r.etapa || r.Etapa);

                    // Filtramos estrictamente por Etapa 1 para el conteo de disponibilidad
                    if (stage === '1' || stage.includes('1')) {
                        if (stats[type]) {
                            if (status === 'disponible') {
                                stats[type].count++;
                                stats[type].lastLot = r;
                                const pVal = r['Precio'] || r.Precio || r['Precio m2'] || r.precio || r['Costo'] || r.Costo || r['Costo m2'] || r.costo_m2 || r.costo || 0;
                                const price = typeof pVal === 'number' ? pVal : parseFloat(String(pVal).replace(/[^0-9.]/g, ''));
                                if (price > 0) stats[type].prices.push(price);
                            }
                        }
                    }
                });

                setAvailability({
                    A: {
                        count: stats.A.count,
                        minPrice: (stats.A.prices.length > 0 ? Math.max(...stats.A.prices) : (summary.A?.precio || 800)),
                        lastLot: stats.A.count === 1 ? stats.A.lastLot : null,
                        hikeScarcity: summary.A?.quedanHike || 0
                    },
                    AA: {
                        count: stats.AA.count,
                        minPrice: (stats.AA.prices.length > 0 ? Math.max(...stats.AA.prices) : (summary.AA?.precio || 990)),
                        lastLot: stats.AA.count === 1 ? stats.AA.lastLot : null,
                        hikeScarcity: summary.AA?.quedanHike || 0
                    },
                    AAA: {
                        count: stats.AAA.count,
                        minPrice: (stats.AAA.prices.length > 0 ? Math.max(...stats.AAA.prices) : (summary.AAA?.precio || 1100)),
                        lastLot: stats.AAA.count === 1 ? stats.AAA.lastLot : null,
                        hikeScarcity: summary.AAA?.quedanHike || 0
                    },
                    loading: false
                });
            } catch (error) {
                console.error("Error fetching availability:", error);
                setAvailability(prev => ({ ...prev, loading: false }));
            }
        };

        fetchAvailability();
    }, []);

    useEffect(() => {
        // Show tutorial on mobile after 4.5 seconds
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            const timer = setTimeout(() => {
                setTutorialStep(1);
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, []);

    const skipTutorial = () => {
        setTutorialStep(0);
    };

    const TUTORIAL_CONTENT = {
        1: { title: "TIPO A", text: "Lotes con superficies optimizadas y precios competitivos en Etapa 1.", align: "left" },
        2: { title: "TIPO AA", text: "El balance perfecto entre metros cuadrados y ubicación privilegiada.", align: "center" },
        3: { title: "TIPO AAA", text: "La máxima exclusividad y mayor tamaño de todo el proyecto.", align: "center" },
        4: { title: "PLANES", text: "Explora nuestras opciones de MSI, anualidades y pagos flexibles.", align: "right" }
    };

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const resetSelection = () => {
        setSelectedLot(INITIAL_LOT_INFO);
    };

    const { titulo, superficie_m2, superficie, estado, tipo, costo_m2, costo, nota } = selectedLot;
    const isInitial = !titulo && !selectedLot.id && !selectedLot.Id && !selectedLot.numero && !selectedLot.Numero && !selectedLot.titulo && !selectedLot.Titulo;

    const rawVal = titulo || selectedLot.titulo || selectedLot.Titulo || selectedLot.id || selectedLot.Id || selectedLot.numero || selectedLot.Numero || '';
    let numero = norm(rawVal);
    if (!numero || numero === 'UNDEFINED') numero = 'Lote Seleccionado';
    else if (!numero.includes('LOTE')) numero = `LOTE ${numero}`;

    const currentStatus = norm(estado).toUpperCase() || 'DISPONIBLE';

    // --- MAPEO ROBUSTO DE DATOS ---
    const rawSup = selectedLot.superficie_m2 || selectedLot.superficie || selectedLot.area || selectedLot.m2 || selectedLot.metros || '';
    let rawCosto = selectedLot.costo_m2 || selectedLot.costo || selectedLot.precio || selectedLot.valor || '';

    // Fallback por tipo
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
    const isReservado = RESERVED_STATUSES.includes(estadoLower);
    const isVendido = estadoLower === 'vendido';
    const isDisabled = ['vendido', 'bloqueado'].includes(estadoLower);
    const cotizarText = isReservado ? 'ME INTERESA SI SE LIBERA' : (isCommonArea ? 'CONSULTAR COTIZACIÓN' : 'COTIZAR AHORA');

    const linkSimilares = `${WHATSAPP_BASE}${encodeURIComponent(`Hola, me interesó el ${numero}, pero veo que está separado. Quisiera conocer los lotes disponibles similares.`)}`;
    const linkLiberacion = `${WHATSAPP_BASE}${encodeURIComponent(`Hola, me interesó el ${numero}, pero veo que está separado. Me interesaría si se libera.`)}`;

    let finalLink = '#';
    if (!isVendido) {
        if (isReservado) {
            finalLink = linkLiberacion;
        } else {
            const waMsg = `Hola, me interesa el ${numero}, con superficie de ${sup} y costo de ${formattedCosto}. Estado: ${currentStatus}.`;
            finalLink = `${WHATSAPP_BASE}${encodeURIComponent(waMsg)}`;
        }
    }

    return (
        <div className="pricing-v2">
            {/* 1. DISCREET NOTE */}
            <div className={`v2-top-note ${isNoteCollapsed ? 'collapsed' : 'expanded'} reveal-fade`}>
                <div className="v2-note-inner" style={{ opacity: isNoteCollapsed ? 0 : 1, pointerEvents: isNoteCollapsed ? 'none' : 'auto' }}>
                    <p>
                        <strong>Nota importante:</strong> Los precios por m² aquí mostrados son precios base y están expresados en pesos mexicanos. La disponibilidad de lotes, así como los precios y condiciones de venta, están sujetos a cambios sin previo aviso. Para recibir un plan de financiamiento personalizado y confirmar existencias, por favor, contacta a un asesor.
                    </p>
                </div>
                <button
                    className="v2-note-toggle-btn"
                    onClick={() => setIsNoteCollapsed(!isNoteCollapsed)}
                    aria-label={isNoteCollapsed ? "Ver nota legal" : "Ocultar nota"}
                >
                    {isNoteCollapsed ? "ⓘ" : "×"}
                </button>
            </div>

            {/* 2. HERO SECTION */}
            <header className="v2-hero reveal-fade">
                <div className="v2-hero-content">
                    <div className="v2-hero-text reveal-left">
                        <h1 className="v2-title">Masterplan y <br />disponibilidad</h1>
                        <p className="v2-subtitle">
                            Explora cada lote, consulta precios actualizados y planes de financiamiento personalizados.
                        </p>
                        <div className="v2-hero-actions">
                            <button className="v2-btn-terracotta" onClick={() => scrollToSection('launch-prices')}>
                                CONOCER PRECIOS POR M² <span className="v2-btn-icon">↘</span>
                            </button>
                            <button className="v2-btn-white" onClick={() => scrollToSection('v2-interactive-map')}>
                                VER MAPA INTERACTIVO <span className="v2-btn-icon">↗</span>
                            </button>
                        </div>
                    </div>
                    <div className="v2-hero-image reveal-right">
                        <div className="v2-map-card">
                            <img src="/img/masterplan-3d.png" alt="Masterplan 3D" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="v2-separator" />

            {/* 3. PRICE EVOLUTION & LOT TYPES ROW 
            <section id="launch-prices" className="v2-launch-prices reveal-fade">
                <div className="v2-prices-row">
                    <div className="v2-price-evolution-col reveal-left">
                        <PriceEvolutionCard />
                    </div>

                    <div className="v2-arrow-col">
                        <div className="v2-big-arrow">
                            <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 20H80M80 20L65 5M80 20L65 35" stroke="#43a047" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="v2-lot-types-col reveal-right">
                        <LotTypeCards />
                        <div className="v2-launch-text-block">
                            <h2 className="v2-launch-title">Precios de lanzamiento: Su oportunidad exclusiva</h2>
                            <p className="v2-launch-subtitle">Asegure su inversión con las tarifas vigentes por metro cuadrado. ¡Cupo limitado!</p>

                        </div>
                    </div>
                </div>
            </section>
*/}
            <div className="v2-separator" />

            {/* 4. MAIN MAP SECTION */}
            <section id="v2-interactive-map" className="v2-map-section reveal-fade">
                {/* 
                    Note: To replicate the exact layout of the image (Legend on Left, Map on Right), 
                    we might need a modified version of InteractiveMap.
                    For now, I'll structure the Pricing Page to handle the Layout, 
                    and InteractiveMapV2 might need a 'headless' mode.
                */}
                <div className="v2-map-layout">
                    <aside className="v2-map-sidebar reveal-left">
                        <div className={`v2-sidebar-card ${isInitial ? 'v2-initial' : 'v2-active'}`}>
                            {isInitial ? (
                                <>
                                    <div className="v2-sidebar-header">
                                        <h3 className="v2-sidebar-lot-id">SELECCIONA TU LOTE</h3>
                                    </div>
                                    <div className="v2-sidebar-instructions">
                                        <p className="subtitulo2">Dando click en el mapa para ver detalles y cotizar</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="v2-sidebar-header">
                                        <h3 className="v2-sidebar-lot-id">{numero}</h3>
                                        <h4 className="v2-sidebar-subtitle">DETALLES TÉCNICOS</h4>
                                    </div>

                                    <div className="v2-sidebar-divider" />

                                    <div className="v2-sidebar-details">
                                        <div className="v2-detail-row">
                                            <span>SUPERFICIE:</span>
                                            <strong>{sup}</strong>
                                        </div>
                                        <div className="v2-detail-row">
                                            <span>TIPO:</span>
                                            <strong>{norm(tipo)}</strong>
                                        </div>
                                        <div className="v2-detail-row">
                                            <span>PRECIO POR M2:</span>
                                            <strong>{formattedCosto}</strong>
                                        </div>
                                    </div>

                                    <div className="v2-sidebar-divider" />

                                    <div className="v2-sidebar-status-area">
                                        <p className="v2-status-text" style={{
                                            color: isVendido ? '#c62828' : (isReservado ? '#d39e00' : '#4caf50')
                                        }}>
                                            {currentStatus}
                                        </p>
                                        {!isVendido && <p className="v2-contact-prompt">CONTACTA A UN ASESOR</p>}
                                    </div>

                                    <div className="v2-sidebar-actions">
                                        {isReservado ? (
                                            <div className="v2-dual-actions">
                                                <a href={linkSimilares} target="_blank" rel="noopener noreferrer" className="v2-btn-black v2-btn-full">VER SIMILARES</a>
                                                <a href={linkLiberacion} target="_blank" rel="noopener noreferrer" className="v2-btn-outline v2-btn-full">AVISARME SI SE LIBERA</a>
                                            </div>
                                        ) : (
                                            <div className="v2-dual-actions">
                                                <a
                                                    href={finalLink}
                                                    target={isVendido ? '_self' : '_blank'}
                                                    rel="noopener noreferrer"
                                                    className={`v2-btn-black v2-btn-full ${isVendido ? 'disabled' : ''}`}
                                                    onClick={(e) => isVendido && e.preventDefault()}
                                                >
                                                    {isVendido ? 'LOTE VENDIDO' : 'COTIZAR AHORA'}
                                                </a>
                                                <button onClick={resetSelection} className="v2-btn-outline v2-btn-full">
                                                    VER OTRO LOTE
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="v2-sidebar-legend">
                                <span className="v2-legend-title">DISPONIBILIDAD DE TERRENOS</span>
                                <div className="v2-legend-grid">
                                    <div className="v2-legend-item"><span className="v2-dot red"></span> VENDIDO</div>
                                    <div className="v2-legend-item"><span className="v2-dot yellow"></span> SEPARADO</div>
                                    <div className="v2-legend-item"><span className="v2-dot gray"></span> PRÓXIMAMENTE</div>
                                </div>

                            </div>

                            <div className="v2-sidebar-mini-cards">
                                {['A', 'AA', 'AAA'].map(type => (
                                    <div
                                        key={type}
                                        className={`v2-neumo-card type-${type.toLowerCase()} ${highlightType === type ? 'is-active' : ''}`}
                                    >
                                        <div className="v2-neumo-spine"></div>
                                        <div className="v2-neumo-content">
                                            {/* Inner 'Inset/Framed' Top Box */}
                                            <div className="v2-neumo-box">
                                                <div className="v2-neumo-title">TIPO {type}</div>

                                                <div className="v2-neumo-main-info">
                                                    <span className="v2-neumo-text">Quedan </span>
                                                    <span className={`v2-neumo-count ${availability[type].hikeScarcity === 1 ? 'urgent-red' : availability[type].hikeScarcity > 1 ? 'urgent-yellow' : ''}`}>
                                                        {availability[type].hikeScarcity} {availability[type].hikeScarcity === 1 ? 'lote' : 'lotes'}
                                                    </span>
                                                    <span className="v2-neumo-text"> a </span>
                                                    <span className="v2-neumo-price">
                                                        ${formatCurrencyNoSymbol(availability[type].minPrice)}/m²
                                                    </span>
                                                </div>

                                                <div className="v2-neumo-subtitle">
                                                    ¡Separa tu lote <span className="highlight">HOY</span> y asegura tu precio!
                                                </div>
                                            </div>

                                            {/* Metallic/Raised Button */}
                                            <button
                                                className="v2-neumo-btn"
                                                onClick={() => {
                                                    setHighlightType(highlightType === type ? null : type);
                                                    scrollToSection('v2-interactive-map');
                                                }}
                                            >
                                                {highlightType === type ? 'QUITAR FILTRO' : 'VER LOTES DISPONIBLES'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="v2-sidebar-financing highlight-box">
                                <h4 className="v2-fin-title">Planes de Financiamiento Especiales</h4>
                                <div className="v2-fin-grid">
                                    <div className="v2-fin-item">
                                        <div className="v2-fin-icon"><FontAwesomeIcon icon={faClockRotateLeft} /></div>
                                        <div className="v2-fin-text">40 MESES SIN INTERESES</div>
                                    </div>
                                    <div className="v2-fin-item">
                                        <div className="v2-fin-icon"><FontAwesomeIcon icon={faCalendarCheck} /></div>
                                        <div className="v2-fin-text">3 ANUALIDADES</div>
                                    </div>
                                    <div className="v2-fin-item">
                                        <div className="v2-fin-icon"><FontAwesomeIcon icon={faFileSignature} /></div>
                                        <div className="v2-fin-text">PAGO CONTRA ESCRITURA</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="v2-map-main reveal-right">
                        <InteractiveMapV2
                            layoutV2={true}
                            onSelectionChange={handleMapSelection}
                            externalSelectionId={triggeredLoteId}
                            highlightType={highlightType}
                        />
                    </main>
                </div>
            </section>

            {/* 5. MOBILE GLASS BAR (Floating) */}
            <div className={`v2-mobile-glass-bar ${tutorialStep > 0 ? 'in-tutorial' : ''}`}>
                <h3 className="v2-glass-bar-title">DISPONIBILIDAD DE LOTES EN ETAPA 1</h3>

                {tutorialStep > 0 && TUTORIAL_CONTENT[tutorialStep] && (
                    <div className={`v2-tutorial-bubble step-${tutorialStep} align-${TUTORIAL_CONTENT[tutorialStep].align}`}>
                        <div className="v2-tutorial-header">
                            <span className="v2-tutorial-badge">{TUTORIAL_CONTENT[tutorialStep].title}</span>
                            <div className="v2-tutorial-progress">{tutorialStep}/4</div>
                        </div>
                        <p>{TUTORIAL_CONTENT[tutorialStep].text}</p>
                        <div className="v2-tutorial-actions">
                            <button className="v2-tut-skip" onClick={skipTutorial}>OMITIR</button>
                            <button className="v2-tut-next" onClick={() => {
                                if (tutorialStep < 4) setTutorialStep(prev => prev + 1);
                                else setTutorialStep(0);
                            }}>
                                {tutorialStep < 4 ? 'SIGUIENTE' : 'ENTENDIDO'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="v2-glass-inner">
                    {tutorialStep > 0 && (
                        <div className="v2-tutorial-overlay" />
                    )}
                    <div className="v2-glass-items">
                        <button
                            className={`v2-glass-pill pill-a ${tutorialStep === 1 ? 'is-focused' : ''}`}
                            onClick={() => {
                                if (tutorialStep > 0) return; // Block during tutorial
                                setActiveModalType('A');
                            }}
                        >
                            <span className="v2-pill-type">A</span>
                            {availability.loading ? <div className="v2-pill-dot pulse" /> : <span className="v2-pill-count">{availability.A.count}</span>}
                        </button>
                        <button
                            className={`v2-glass-pill pill-aa ${tutorialStep === 2 ? 'is-focused' : ''}`}
                            onClick={() => {
                                if (tutorialStep > 0) return;
                                setActiveModalType('AA');
                            }}
                        >
                            <span className="v2-pill-type">AA</span>
                            {availability.loading ? <div className="v2-pill-dot pulse" /> : <span className="v2-pill-count">{availability.AA.count}</span>}
                        </button>
                        <button
                            className={`v2-glass-pill pill-aaa ${tutorialStep === 3 ? 'is-focused' : ''}`}
                            onClick={() => {
                                if (tutorialStep > 0) return;
                                setActiveModalType('AAA');
                            }}
                        >
                            <span className="v2-pill-type">AAA</span>
                            {availability.loading ? <div className="v2-pill-dot pulse" /> : <span className="v2-pill-count">{availability.AAA.count}</span>}
                        </button>
                    </div>
                    <div className="v2-glass-divider" />
                    <button
                        className={`v2-glass-fin-btn ${tutorialStep === 4 ? 'is-focused' : ''}`}
                        onClick={() => {
                            if (tutorialStep > 0) return;
                            setActiveModalType('fin');
                        }}
                    >
                        <FontAwesomeIcon icon={faHandHoldingUsd} />
                        <span>PLANES</span>
                    </button>
                </div>
            </div>

            {/* 6. MOBILE DETAIL MODAL */}
            {activeModalType && (
                <div className="v2-modal-overlay" onClick={() => setActiveModalType(null)}>
                    <div className="v2-glass-modal" onClick={e => e.stopPropagation()}>
                        <button className="v2-modal-close" onClick={() => setActiveModalType(null)}>×</button>

                        {activeModalType === 'fin' ? (
                            <div className="v2-modal-content">
                                <h3 className="v2-modal-title">FINANCIAMIENTO</h3>
                                <div className="v2-modal-fin-grid">
                                    <div className="v2-modal-fin-item">
                                        <FontAwesomeIcon icon={faClockRotateLeft} />
                                        <p>40 MESES SIN INTERESES</p>
                                    </div>
                                    <div className="v2-modal-fin-item">
                                        <FontAwesomeIcon icon={faCalendarCheck} />
                                        <p>3 ANUALIDADES</p>
                                    </div>
                                    <div className="v2-modal-fin-item">
                                        <FontAwesomeIcon icon={faFileSignature} />
                                        <p>CONTRA ESCRITURA</p>
                                    </div>
                                </div>
                            </div>
                        ) : (() => {
                            const type = activeModalType;
                            return (
                                <div className="v2-modal-content">
                                    <div className="v2-neumo-box" style={{ width: '100%', marginBottom: '20px' }}>
                                        <div className="v2-neumo-title" style={{ textAlign: 'center' }}>TIPO {type}</div>

                                        <div className="v2-neumo-main-info" style={{ justifyContent: 'center', margin: '15px 0' }}>
                                            <span className="v2-neumo-text">Quedan </span>
                                            <span className={`v2-neumo-count ${availability[type].hikeScarcity === 1 ? 'urgent-red' : availability[type].hikeScarcity > 1 ? 'urgent-yellow' : ''}`}>
                                                {availability[type].hikeScarcity} {availability[type].hikeScarcity === 1 ? 'lote' : 'lotes'}
                                            </span>
                                            <span className="v2-neumo-text"> a </span>
                                            <span className="v2-neumo-price">
                                                ${formatCurrencyNoSymbol(availability[type].minPrice)}/m²
                                            </span>
                                        </div>

                                        <div className="v2-neumo-subtitle" style={{ textAlign: 'center' }}>
                                            ¡Separa tu lote <span className="highlight">HOY</span> y asegura tu precio!
                                        </div>
                                    </div>

                                    {/* Financing Section */}
                                    <div className="v2-modal-financing-section">
                                        <h4 className="v2-modal-fin-title">FINANCIAMIENTO DISPONIBLE</h4>
                                        <div className="v2-modal-fin-options">
                                            <div className="v2-modal-fin-option">
                                                <FontAwesomeIcon icon={faClockRotateLeft} className="v2-fin-icon" />
                                                <div className="v2-fin-number">40</div>
                                                <div className="v2-fin-label">MSI</div>
                                            </div>
                                            <div className="v2-modal-fin-option">
                                                <FontAwesomeIcon icon={faCalendarCheck} className="v2-fin-icon" />
                                                <div className="v2-fin-number">3</div>
                                                <div className="v2-fin-label">ANUALIDADES</div>
                                            </div>
                                            <div className="v2-modal-fin-option">
                                                <FontAwesomeIcon icon={faFileSignature} className="v2-fin-icon" />
                                                <div className="v2-fin-label-single">PAGO CONTRA ESCRITURA</div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="v2-neumo-btn"
                                        style={{ width: '100%', padding: '15px 0' }}
                                        onClick={() => {
                                            setHighlightType(type);
                                            setActiveModalType(null);
                                            scrollToSection('v2-interactive-map');
                                        }}
                                    >
                                        VER LOTES DISPONIBLES
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

        </div>
    );
};

export default PricingPagV2;
