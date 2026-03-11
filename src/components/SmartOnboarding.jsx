import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartOnboarding({ steps, onComplete, onDismiss, storageKey }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [popoverStyle, setPopoverStyle] = useState({});
    const [spotlightStyle, setSpotlightStyle] = useState(null);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const popoverRef = useRef(null);

    useEffect(() => {
        if (storageKey) {
            const seen = localStorage.getItem(storageKey);
            if (seen === 'true') {
                setIsVisible(false);
            }
        }
    }, [storageKey]);

    // Scroll Lock
    useEffect(() => {
        if (!isVisible) return undefined;
        if (typeof window === 'undefined') return undefined;

        const body = document.body;
        const html = document.documentElement;
        
        const scrollY = window.scrollY;
        const scrollbarWidth = window.innerWidth - html.clientWidth;
        
        const prevBodyOverflow = body.style.overflow;
        const prevBodyPadding = body.style.paddingRight;
        const prevHtmlOverflow = html.style.overflow;

        body.style.overflow = 'hidden';
        html.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
             body.style.overflow = prevBodyOverflow;
             body.style.paddingRight = prevBodyPadding;
             html.style.overflow = prevHtmlOverflow;
             window.scrollTo(0, scrollY);
        };
    }, [isVisible]);

    const stepInfo = steps?.[currentStep];

    const updatePosition = () => {
        if (!stepInfo || !stepInfo.target) {
            setSpotlightStyle(null);
            return;
        }
        const el = document.querySelector(stepInfo.target);
        if (!el) {
            // center it on screen if target not found
            setSpotlightStyle(null);
            setPopoverStyle({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10005,
                width: '320px'
            });
            return;
        }

        const rect = el.getBoundingClientRect();
        
        setSpotlightStyle({
            position: 'absolute',
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            pointerEvents: 'none',
            transition: 'all 0.3s ease'
        });
        const placement = stepInfo.placement || 'bottom';
        const OFFSET = 20;

        let popoverTop = 0;
        let popoverLeft = 0;
        const popoverWidth = 320;
        // Estimate height to avoid overflow before first render
        const estimatedHeight = popoverRef.current ? popoverRef.current.offsetHeight : 240;

        if (placement === 'bottom') {
            popoverTop = rect.bottom + OFFSET;
            popoverLeft = rect.left + (rect.width / 2) - (popoverWidth / 2);
        } else if (placement === 'top') {
            popoverTop = rect.top - estimatedHeight - OFFSET;
            popoverLeft = rect.left + (rect.width / 2) - (popoverWidth / 2);
        } else if (placement === 'left') {
            popoverTop = rect.top + (rect.height / 2) - (estimatedHeight / 2);
            popoverLeft = rect.left - popoverWidth - OFFSET;
        } else if (placement === 'right') {
            popoverTop = rect.top + (rect.height / 2) - (estimatedHeight / 2);
            popoverLeft = rect.right + OFFSET;
        } else if (placement === 'center') {
            popoverTop = rect.top + (rect.height / 2) - (estimatedHeight / 2);
            popoverLeft = rect.left + (rect.width / 2) - (popoverWidth / 2);
        } else if (placement === 'modal') {
             setPopoverStyle({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10005,
                width: '320px'
            });
            return;
        }

        // Clamp to viewport boundaries
        const PADDING = 24;
        if (popoverLeft < PADDING) popoverLeft = PADDING;
        if (popoverLeft + popoverWidth > window.innerWidth - PADDING) {
            popoverLeft = window.innerWidth - popoverWidth - PADDING;
        }

        if (popoverTop < PADDING) popoverTop = PADDING;
        if (popoverTop + estimatedHeight > window.innerHeight - PADDING) {
            popoverTop = window.innerHeight - estimatedHeight - PADDING;
        }

        setPopoverStyle({
            position: 'fixed',
            top: `${popoverTop}px`,
            left: `${popoverLeft}px`,
            width: `${popoverWidth}px`,
            zIndex: 10005
        });
    };

    useEffect(() => {
        if (!isVisible || !stepInfo) return;

        const targetEl = stepInfo.target ? document.querySelector(stepInfo.target) : null;
        if (targetEl) {
            // Scroll into view with slight offset
            const offset = 80;
            const elementPosition = targetEl.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                 top: offsetPosition,
                 behavior: "smooth"
            });
        }

        // Give a little time for scroll to settle before positioning
        setTimeout(updatePosition, 50);
        setTimeout(updatePosition, 300);

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [currentStep, stepInfo, isVisible, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            finishTutorial();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const finishTutorial = () => {
        if (dontShowAgain && storageKey) {
            localStorage.setItem(storageKey, 'true');
        }
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    const handleDismiss = () => {
        // If dismissed, act as completed (but don't set dontShowAgain unless checked)
        finishTutorial();
        if (onDismiss) onDismiss();
    };

    if (!isVisible || !steps || steps.length === 0) return null;

    const progress = ((currentStep + 1) / steps.length) * 100;

    return createPortal(
        <div className="smart-onboarding-overlay" style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 10000,
            pointerEvents: 'auto',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s ease-in-out'
        }}>
            {spotlightStyle && stepInfo.target ? (
                <div style={spotlightStyle} />
            ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="smart-onboarding-popover"
                    style={{
                        ...popoverStyle,
                        background: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        pointerEvents: 'auto',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ height: '4px', background: '#e5e7eb', width: '100%' }}>
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                            style={{ height: '100%', background: '#0f172a' }}
                        />
                    </div>
                    
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Paso {currentStep + 1} de {steps.length}
                            </span>
                            <button 
                                onClick={handleDismiss}
                                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', margin: '-4px' }}
                                aria-label="Cerrar tutorial"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '10px', lineHeight: '1.2' }}>
                            {stepInfo.title}
                        </h3>
                        
                        <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                            {stepInfo.content}
                        </p>

                        {currentStep === steps.length - 1 && (
                            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <input 
                                    type="checkbox" 
                                    id="dont-show-again"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0f172a' }}
                                />
                                <label htmlFor="dont-show-again" style={{ fontSize: '0.9rem', color: '#334155', cursor: 'pointer', userSelect: 'none', fontWeight: '500' }}>
                                    No volver a mostrar
                                </label>
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px' }}>
                            <button 
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: currentStep === 0 ? '#cbd5e1' : '#64748b', 
                                    cursor: currentStep === 0 ? 'default' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 0'
                                }}
                            >
                                ‹ Anterior
                            </button>
                            <button 
                                onClick={handleNext}
                                style={{ 
                                    background: '#0f172a', 
                                    color: '#fff', 
                                    border: 'none', 
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
                                    transition: 'background 0.2s, transform 0.1s'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {currentStep === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'} {currentStep !== steps.length - 1 && '›'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>,
        document.body
    );
}
