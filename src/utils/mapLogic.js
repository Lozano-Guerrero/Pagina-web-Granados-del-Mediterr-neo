// src/utils/mapLogic.js (Lógica Completa)

export function initializeMapLogic(refs) {
    // Referencias DOM pasadas como argumento
    const { svgObject, delimiter: delimiterEl, tooltip, welcomeBanner, containerMapEl } = refs;
    
    // Si el SVG aún no tiene su contenido cargado, salimos.
    if (!svgObject || !svgObject.contentDocument) {
        return () => {}; // Retorna una función vacía de limpieza
    }

    console.log('Mapa Interactivo: Inicializando lógica de eventos.');

    // -------------------------------------------------------------
    // CONFIGURACIÓN Y ESTADO
    // -------------------------------------------------------------

    const svgDoc = svgObject.contentDocument;

    // Config
    const DATA_URL = 'https://n8n.srv894483.hstgr.cloud/webhook/lotes-json'; // URL de ejemplo
    const WHATSAPP_BASE = 'https://wa.me/528123852034?text=';
    const COLOR_BY_STATUS = { disponible: '#66bb6a', reservado: '#fde68a', vendido: '#ef5350', bloqueado: '#e5e7eb', 'n/a': '#e5e7eb' };
    const FALLBACK_COLOR = '#d1e7dd';
    const HIDE_DELAY = 300;
    // Selector más general (como en tu app.js original)
    const SHAPE_SEL = 'path,polygon,rect,ellipse'; 
    const TOOLTIP_FIXED_CLASS = 'is-fixed'; 
    const WELCOME_BANNER_HTML = '<div class="title">Bienvenido</div><div class="minor">Mueve el cursor sobre los lotes para ver su estado y precios.</div>';
    
    // Variables de Estado (necesarias para la lógica del mapa)
    let lotesData = {};
    let hideTimer = null;
    let isTooltipFixed = false;
    let lastHoveredElement = null;
    let lotNodesMapRef = new Map();
    let rafPending = null;

    // -------------------------------------------------------------
    // FUNCIONES AUXILIARES (Tooltips y Banner)
    // -------------------------------------------------------------
    
    // Asegúrate de que las funciones auxiliares (showTooltip, hideTooltip, etc.) 
    // están definidas completamente aquí, usando las variables de estado declaradas arriba.
    
    const showTooltip = (evt, data, targetEl) => {
        // Lógica de showTooltip (implementación de tu código original)
        const statusClass = data.estado || 'n/a';
        
        const price = data.precio ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(data.precio) : 'Precio no disponible';
        const area = data.area ? `${data.area} m²` : 'Área no disponible';
        
        const whatsappMsg = encodeURIComponent(`Hola, me interesa el Lote ${data.id} (${data.manzana}) de Granados del Mediterráneo. ¿Me pueden dar más información?`);
        const whatsappLink = `${WHATSAPP_BASE}${whatsappMsg}`;

        tooltip.innerHTML = `
            <div id="tt-content" class="tt-content">
                <p class="tt-title">Lote: ${data.id} (${data.manzana || 'N/A'})</p>
                <p class="tt-area">${area}</p>
                <p class="tt-price tt-status-${statusClass}">${price}</p>
                <p class="tt-status">Estado: ${data.estado}</p>
                <p class="tt-concept">${data.concepto || ''}</p>
            </div>
            ${data.estado !== 'vendido' ? `<a href="${whatsappLink}" target="_blank" class="tt-cta tt-cta-whatsapp">Preguntar por este lote</a>` : '<div class="tt-sold">Lote Vendido</div>'}
            <button id="tt-close" class="tt-close" title="Cerrar y desanclar">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        `;

        moveTooltip(evt);
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        
        if (targetEl) {
            lastHoveredElement = targetEl;
        }
    };

    const hideTooltip = (force) => {
        clearTimeout(hideTimer);
        hideTimer = null;
        if (force || !isTooltipFixed) {
            tooltip.classList.remove(TOOLTIP_FIXED_CLASS);
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            isTooltipFixed = false;
            lastHoveredElement = null;
        }
    };

    const scheduleHide = () => {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            hideTooltip(false);
        }, HIDE_DELAY);
    };

    const moveTooltip = (evt) => {
        if (rafPending) {
            cancelAnimationFrame(rafPending);
        }
        rafPending = requestAnimationFrame(() => {
            const boundary = delimiterEl.getBoundingClientRect();
            
            // Usar coordenadas relativas al documento
            let x = evt.clientX;
            let y = evt.clientY;
            
            // Reposicionamiento para evitar que el tooltip se salga de la pantalla
            const ttWidth = tooltip.offsetWidth;
            const ttHeight = tooltip.offsetHeight;

            // X Position: Si el tooltip se sale del borde derecho, lo posiciona a la izquierda del cursor
            if (x + ttWidth + 20 > boundary.right) {
                 tooltip.style.left = (x - ttWidth - 20) + 'px'; 
            } else {
                 tooltip.style.left = (x + 20) + 'px';
            }

            // Y Position: Si el tooltip se sale del borde inferior, lo posiciona arriba del cursor
            if (y + ttHeight + 20 > boundary.bottom) {
                 tooltip.style.top = (y - ttHeight - 20) + 'px'; 
            } else {
                 tooltip.style.top = (y + 20) + 'px';
            }
            rafPending = null;
        });
    };
    
    const showBanner = () => { welcomeBanner.classList.add('show'); };
    const hideBanner = () => { welcomeBanner.classList.remove('show'); };
    const moveBanner = (evt) => {
        if (!welcomeBanner.classList.contains('show')) return;
        
        if (rafPending) {
            cancelAnimationFrame(rafPending);
        }
        
        rafPending = requestAnimationFrame(() => {
            // Posición relativa al contenedor principal (.delimiter)
            const x = evt.clientX - delimiterEl.getBoundingClientRect().left + window.scrollX + 20;
            const y = evt.clientY - delimiterEl.getBoundingClientRect().top + window.scrollY + 20;

            welcomeBanner.style.transform = `translate(${x}px, ${y}px)`;
            rafPending = null;
        });
    };


    // -------------------------------------------------------------
    // LISTENERS INDIVIDUALES DE LOTES (Funciones de manejo)
    // -------------------------------------------------------------

    // Usamos funciones con nombre para poder desvincularlas correctamente en el cleanup
    const lot_onMouseEnter = (evt) => {
        const targetEl = evt.target;
        // Asume que el ID es algo como L_01 o solo 01, y el SVG usa el ID completo.
        const loteId = targetEl.id.replace('L_', '');
        
        clearTimeout(hideTimer);
        hideBanner();

        if (!isTooltipFixed) {
            const data = lotesData[loteId];
            if (data) {
                showTooltip(evt, data, targetEl);
            }
        }
        targetEl.classList.add('is-hovered');
    };

    const lot_onMouseLeave = (evt) => {
        const targetEl = evt.target;
        if (!isTooltipFixed) {
            scheduleHide();
        }
        targetEl.classList.remove('is-hovered');
    };

    const lot_onClick = (evt) => {
        const targetEl = evt.target;
        const loteId = targetEl.id.replace('L_', '');
        const data = lotesData[loteId];

        if (isTooltipFixed && lastHoveredElement === targetEl) {
            // Clic en el mismo lote, desanclar
            hideTooltip(true);
            showBanner();
        } else if (data) {
            // Anclar el tooltip al nuevo lote
            isTooltipFixed = true;
            tooltip.classList.add(TOOLTIP_FIXED_CLASS);
            showTooltip(evt, data, targetEl);
            hideBanner();
        }
    };
    
    // -------------------------------------------------------------
    // FUNCIÓN PRINCIPAL DE RENDERIZADO (Fetch y Pintura)
    // -------------------------------------------------------------
    
    async function renderMap() {
        try {
            const response = await fetch(DATA_URL);
            const rawData = await response.json();
            
            // Formatear datos para fácil acceso por ID
            rawData.forEach(lote => {
                lotesData[lote.id] = lote;
            });

            // PINTAR Y ADJUNTAR LISTENERS
            const lotes = svgDoc.querySelectorAll(SHAPE_SEL);
            lotes.forEach(loteEl => {
                const loteId = loteEl.id.replace('L_', '');
                
                // Ignorar elementos sin ID válido de lote (ej: texto, fondo)
                if (!loteId || loteId.length < 1) return; 

                const data = lotesData[loteId] || { estado: 'n/a', id: loteId, manzana: loteId.slice(0, 1), area: 'N/A', concepto: 'No registrado' };
                
                // Aplicar color de estado
                const statusColor = COLOR_BY_STATUS[data.estado] || FALLBACK_COLOR;
                
                // 🛑 CORRECCIÓN CRÍTICA: Uso de setProperty con !important para anular estilos SVG
                loteEl.style.setProperty('fill', statusColor, 'important'); 
                loteEl.style.setProperty('cursor', 'pointer', 'important'); 
                
                loteEl.classList.add(`lote-status-${data.estado}`);
                
                // Adjuntar listeners individuales usando las funciones nombradas
                loteEl.addEventListener('mouseenter', lot_onMouseEnter);
                loteEl.addEventListener('mouseleave', lot_onMouseLeave);
                loteEl.addEventListener('click', lot_onClick);

                // Guardar la referencia y la función de limpieza para lotes individuales
                lotNodesMapRef.set(loteId, {
                    el: loteEl,
                    cleanup: () => {
                        loteEl.removeEventListener('mouseenter', lot_onMouseEnter);
                        loteEl.removeEventListener('mouseleave', lot_onMouseLeave);
                        loteEl.removeEventListener('click', lot_onClick);
                    }
                });
            });
            console.log(`Mapa pintado y ${lotes.length} lotes listos.`);
        } catch (error) {
            console.error('Error al cargar datos del mapa o pintar:', error);
            svgDoc.querySelectorAll(SHAPE_SEL).forEach(loteEl => {
                loteEl.style.setProperty('fill', FALLBACK_COLOR, 'important');
                loteEl.style.setProperty('cursor', 'default', 'important');
            });
        }
    }

    // -------------------------------------------------------------
    // INICIALIZACIÓN Y LISTENERS GLOBALES
    // -------------------------------------------------------------
    
    function init() {
        // Inicializar el Welcome Banner
        welcomeBanner.innerHTML = WELCOME_BANNER_HTML;
        showBanner();
        
        renderMap();

        // 2. Definición y Registro de Listeners de Eventos Nombrados (para limpieza)

        const svgDoc_onMouseMove = moveTooltip;
        const svgDoc_onClick = (e) => {
            const isShape = e.target.matches(SHAPE_SEL);
            if (!isShape && isTooltipFixed) {
                hideTooltip(true);
                showBanner();
            }
        };

        const delimiter_onMouseMove = moveBanner;
        const delimiter_onMouseLeave = hideBanner;

        const document_onClick = (e) => {
            // Verificar si el clic fue en el tooltip, el SVG o el CTA de WhatsApp
            const inTooltip = tooltip.contains(e.target);
            const inSvg = svgDoc.contains(e.target);
            const isCta = e.target.classList.contains('tt-cta'); 

            if (!inTooltip && !inSvg && !isCta) {
                hideTooltip(true);
                showBanner();
            }
        };

        const tooltip_onClick = (ev) => {
            const t = ev.target;
            if (t.id === 'tt-close' || (t.closest && t.closest('#tt-close'))) {
                hideTooltip(true);
                showBanner();
            }
        };
        
        // Adjuntar Listeners Globales
        svgDoc.addEventListener('mousemove', svgDoc_onMouseMove);
        svgDoc.addEventListener('click', svgDoc_onClick);
        delimiterEl.addEventListener('mousemove', delimiter_onMouseMove);
        delimiterEl.addEventListener('mouseleave', delimiter_onMouseLeave);
        document.addEventListener('click', document_onClick);
        tooltip.addEventListener('click', tooltip_onClick);
        
        // Retornar la función de limpieza
        return () => {
            // Limpieza de Listeners del SVG Document
            svgDoc.removeEventListener('mousemove', svgDoc_onMouseMove);
            svgDoc.removeEventListener('click', svgDoc_onClick);

            // Limpieza de Listeners del Delimitador
            delimiterEl.removeEventListener('mousemove', delimiter_onMouseMove);
            delimiterEl.removeEventListener('mouseleave', delimiter_onMouseLeave);

            // Limpieza de Listeners del Documento Principal
            document.removeEventListener('click', document_onClick);

            // Limpieza de Listeners del Tooltip
            tooltip.removeEventListener('click', tooltip_onClick);
            
            // Limpieza de Listeners de Lotes individuales
            lotNodesMapRef.forEach(item => {
                if (item.cleanup) item.cleanup();
            });
            
            // Limpiar timers y estado
            clearTimeout(hideTimer);
            cancelAnimationFrame(rafPending);
            hideBanner();
            hideTooltip(true);
        };
    }

    return init();
}