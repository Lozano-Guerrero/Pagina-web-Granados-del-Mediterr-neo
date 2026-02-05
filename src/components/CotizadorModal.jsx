import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import './CotizadorModal.css';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext.jsx';
import { buildQuoteFilename, downloadPdfBytes, generateQuotePdfBytes } from '../lib/quotePdf.js';

const MIN_PCT = {
    enganche: 10,
    anualidad: 4,
    contra: 10
};

const PLAN_40 = 'plan40';
const PLAN_44 = 'plan44';
const FALLBACK_LIMITS = {
    plan40: {
        enganche: { min: MIN_PCT.enganche / 100, max: 1 },
        anualidad: { min: MIN_PCT.anualidad / 100, max: 1 },
        contra: { min: MIN_PCT.contra / 100, max: 1 }
    },
    plan44: {
        enganche: { min: MIN_PCT.enganche / 100, max: 1 }
    }
};

const currencyFmt = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const numberFmt = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? 0 : num;
};

const sanitizeDigits = (value) => String(value ?? '').replace(/\\D/g, '');

const isProbablyIPad = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    // iPadOS 13+ sometimes reports as Macintosh but with touch points.
    const isIpadUA = /iPad/i.test(ua);
    const isMacTouch = /Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1;
    return isIpadUA || isMacTouch;
};

const toIntValue = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseInt(String(value), 10);
    return Number.isNaN(num) ? 0 : num;
};

const clampMin = (value, min) => Math.max(value, min);
const clampRange = (value, min, max) => Math.min(max, Math.max(min, value));

const roundOneDecimal = (value) => Math.round((value + Number.EPSILON) * 10) / 10;

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const generateQuoteId = () => {
    try {
        const bytes = new Uint8Array(10);
        crypto.getRandomValues(bytes);
        const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
        return `QT-${body}`;
    } catch {
        return `QT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    }
};

const createDefaults = () => ({
    enganche: { mode: 'pct', value: String(MIN_PCT.enganche) },
    anualidad: { mode: 'pct', value: String(MIN_PCT.anualidad) },
    contra: { mode: 'pct', value: String(MIN_PCT.contra) }
});

const createDefaults44 = () => ({
    enganche: { mode: 'pct', value: String(MIN_PCT.enganche) }
});

export default function CotizadorModal({ open, onClose, lotData, discountConfig, paymentLimits, paymentLimitsError }) {
    const { user, profile } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [plan40Fields, setPlan40Fields] = useState(createDefaults());
    const [plan44Fields, setPlan44Fields] = useState(createDefaults44());
    const [ajusteNota, setAjusteNota] = useState('');
    const lastEditedRef = useRef({ plan: null, field: null });
    const [limitErrors, setLimitErrors] = useState({});

    const [isMobile, setIsMobile] = useState(false);
    const [isIpadLandscape, setIsIpadLandscape] = useState(false);
    const [leadPickerOpen, setLeadPickerOpen] = useState(false);

    const [leads, setLeads] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [leadsError, setLeadsError] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [leadFieldError, setLeadFieldError] = useState('');

    const [quoteSaving, setQuoteSaving] = useState(false);
    const [quoteError, setQuoteError] = useState('');

    const lotNumber = lotData?.lotNumber || '';
    const tipo = lotData?.tipo || '';
    const sizeM2 = toNumber(lotData?.sizeM2);
    const pricePerM2Base = toNumber(lotData?.pricePerM2Base);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mqlMobile = window.matchMedia?.('(max-width: 768px)');
        const mqlTouchLandscape = window.matchMedia?.('(hover: none) and (pointer: coarse) and (orientation: landscape)');
        if (!mqlMobile && !mqlTouchLandscape) return undefined;
        const isIpad = isProbablyIPad();
        const onChange = () => {
            const mobile = Boolean(mqlMobile?.matches);
            setIsMobile(mobile);
            // iPad horizontal: tratamos como layout táctil intermedio (no desktop).
            setIsIpadLandscape(Boolean(!mobile && isIpad && mqlTouchLandscape?.matches));
        };
        onChange();
        try {
            mqlMobile?.addEventListener?.('change', onChange);
            mqlTouchLandscape?.addEventListener?.('change', onChange);
            return () => {
                mqlMobile?.removeEventListener?.('change', onChange);
                mqlTouchLandscape?.removeEventListener?.('change', onChange);
            };
        } catch {
            // Safari fallback
            mqlMobile?.addListener?.(onChange);
            mqlTouchLandscape?.addListener?.(onChange);
            return () => {
                mqlMobile?.removeListener?.(onChange);
                mqlTouchLandscape?.removeListener?.(onChange);
            };
        }
    }, []);

    // Bloquear scroll del fondo mientras el modal está abierto (desktop + iPad horizontal).
    useEffect(() => {
        if (!open) return undefined;
        if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

        const body = document.body;
        const html = document.documentElement;
        const scrollY = window.scrollY || html.scrollTop || 0;

        const prev = {
            overflow: body.style.overflow,
            position: body.style.position,
            top: body.style.top,
            left: body.style.left,
            right: body.style.right,
            width: body.style.width,
            paddingRight: body.style.paddingRight
        };

        const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            body.style.overflow = prev.overflow;
            body.style.position = prev.position;
            body.style.top = prev.top;
            body.style.left = prev.left;
            body.style.right = prev.right;
            body.style.width = prev.width;
            body.style.paddingRight = prev.paddingRight;
            window.scrollTo(0, scrollY);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const plan40 = paymentLimits?.plan40 || FALLBACK_LIMITS.plan40;
        const plan44 = paymentLimits?.plan44 || FALLBACK_LIMITS.plan44;
        const pctCeil = (dec) => {
            const n = Number(dec);
            if (!Number.isFinite(n)) return 0;
            return Math.ceil(n * 100);
        };
        setSelectedPlan(null);
        setPlan40Fields({
            enganche: { mode: 'pct', value: String(pctCeil(plan40?.enganche?.min ?? FALLBACK_LIMITS.plan40.enganche.min)) },
            anualidad: { mode: 'pct', value: String(pctCeil(plan40?.anualidad?.min ?? FALLBACK_LIMITS.plan40.anualidad.min)) },
            contra: { mode: 'pct', value: String(pctCeil(plan40?.contra?.min ?? FALLBACK_LIMITS.plan40.contra.min)) }
        });
        setPlan44Fields({
            enganche: { mode: 'pct', value: String(pctCeil(plan44?.enganche?.min ?? FALLBACK_LIMITS.plan44.enganche.min)) }
        });
        lastEditedRef.current = { plan: null, field: null };
        setAjusteNota('');
        setLimitErrors({});
        setSelectedLeadId('');
        setLeadPickerOpen(false);
        setLeadFieldError('');
        setQuoteError('');
    }, [open, lotNumber, paymentLimits, pricePerM2Base, sizeM2]);

    const totalBase = useMemo(() => sizeM2 * pricePerM2Base, [sizeM2, pricePerM2Base]);
    const discountSettings = useMemo(() => ({
        rate: Number.isFinite(discountConfig?.rate) ? discountConfig.rate : 1.5,
        stepPct: Number.isFinite(discountConfig?.stepPct) ? discountConfig.stepPct : 5,
        fromPct: Number.isFinite(discountConfig?.fromPct) ? discountConfig.fromPct : 10,
        maxPct: Number.isFinite(discountConfig?.maxPct) ? discountConfig.maxPct : 10
    }), [discountConfig]);

    const effectiveLimits = useMemo(() => {
        const src = paymentLimits || {};
        const normalize = (range, fallback) => {
            const inMin = Number(range?.min);
            const inMax = Number(range?.max);
            let min = Number.isFinite(inMin) ? inMin : fallback.min;
            let max = Number.isFinite(inMax) ? inMax : fallback.max;
            min = clampRange(min, 0, 1);
            max = clampRange(max, 0, 1);
            if (max < min) [min, max] = [max, min];
            return { min, max };
        };

        return {
            plan40: {
                enganche: normalize(src?.plan40?.enganche, FALLBACK_LIMITS.plan40.enganche),
                anualidad: normalize(src?.plan40?.anualidad, FALLBACK_LIMITS.plan40.anualidad),
                contra: normalize(src?.plan40?.contra, FALLBACK_LIMITS.plan40.contra)
            },
            plan44: {
                enganche: normalize(src?.plan44?.enganche, FALLBACK_LIMITS.plan44.enganche)
            }
        };
    }, [paymentLimits]);

    const getLimits = useCallback((plan, key) => {
        if (plan === PLAN_44) return effectiveLimits.plan44.enganche;
        return effectiveLimits.plan40[key] || FALLBACK_LIMITS.plan40[key];
    }, [effectiveLimits]);

    const updateField = useCallback((plan, key, updater) => {
        const setter = plan === PLAN_44 ? setPlan44Fields : setPlan40Fields;
        setter(prev => ({
            ...prev,
            [key]: typeof updater === 'function' ? updater(prev[key]) : updater
        }));
    }, []);

    const switchMode = useCallback((plan, key, mode, totalCurrentValue) => {
        updateField(plan, key, current => {
            if (current.mode === mode) return current;
            let nextValue = current.value;
            const limits = getLimits(plan, key);
            const minPctInt = Math.ceil(limits.min * 100);
            const maxPctInt = Math.floor(limits.max * 100);
            const minAmt = totalCurrentValue > 0 ? Math.ceil(limits.min * totalCurrentValue) : 0;
            const maxAmt = totalCurrentValue > 0 ? Math.floor(limits.max * totalCurrentValue) : Number.MAX_SAFE_INTEGER;
            if (mode === 'amount') {
                const pct = toIntValue(current.value || 0);
                nextValue = Math.round((totalCurrentValue || 0) * (pct / 100));
                nextValue = clampRange(nextValue, minAmt, maxAmt);
            } else {
                const amount = toIntValue(current.value || 0);
                const pctValue = totalCurrentValue > 0 ? Math.round((amount / totalCurrentValue) * 100) : 0;
                nextValue = clampRange(pctValue, minPctInt, maxPctInt);
            }
            return { mode, value: String(nextValue) };
        });
        lastEditedRef.current = { plan, field: key };
        setAjusteNota('');
        setLimitErrors((prev) => {
            if (!prev || !prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, [getLimits, updateField]);

    const handleValueChange = useCallback((plan, key, value) => {
        updateField(plan, key, current => {
            return { ...current, value };
        });
        lastEditedRef.current = { plan, field: key };
        setAjusteNota('');
        setLimitErrors((prev) => {
            if (!prev || !prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, [updateField]);

    const clampOnBlur = useCallback((plan, key, totalCurrentValue) => {
        updateField(plan, key, current => {
            const limits = getLimits(plan, key);
            const minPctInt = Math.ceil(limits.min * 100);
            const maxPctInt = Math.floor(limits.max * 100);
            const minAmt = totalCurrentValue > 0 ? Math.ceil(limits.min * totalCurrentValue) : 0;
            const maxAmt = totalCurrentValue > 0 ? Math.floor(limits.max * totalCurrentValue) : Number.MAX_SAFE_INTEGER;

            if (current.mode === 'pct') {
                const raw = current.value === '' ? minPctInt : toIntValue(current.value);
                const nextValue = clampRange(raw, minPctInt, maxPctInt);
                if (nextValue !== raw) {
                    setLimitErrors((prev) => ({
                        ...(prev || {}),
                        [key]: `El mínimo permitido es ${minPctInt}% y el máximo ${maxPctInt}%.`
                    }));
                }
                return { ...current, value: String(nextValue) };
            }

            const rawAmt = current.value === '' ? minAmt : toIntValue(current.value);
            const nextAmt = clampRange(rawAmt, minAmt, maxAmt);
            if (nextAmt !== rawAmt) {
                const minLabel = currencyFmt.format(minAmt);
                const maxLabel = currencyFmt.format(maxAmt);
                setLimitErrors((prev) => ({
                    ...(prev || {}),
                    [key]: `El mínimo permitido equivale a ${minLabel} y el máximo a ${maxLabel}.`
                }));
            }
            return { ...current, value: String(nextAmt) };
        });
    }, [getLimits, updateField]);

    const stepPct = useCallback((plan, key, delta) => {
        updateField(plan, key, current => {
            if (current.mode !== 'pct') return current;
            const limits = getLimits(plan, key);
            const minPctInt = Math.ceil(limits.min * 100);
            const maxPctInt = Math.floor(limits.max * 100);
            const currentValue = toIntValue(current.value);
            const raw = currentValue + delta;
            const nextValue = clampRange(raw, minPctInt, maxPctInt);
            if (nextValue !== raw) {
                setLimitErrors((prev) => ({
                    ...(prev || {}),
                    [key]: `El mínimo permitido es ${minPctInt}% y el máximo ${maxPctInt}%.`
                }));
            }
            return { ...current, value: String(nextValue) };
        });
        lastEditedRef.current = { plan, field: key };
        setAjusteNota('');
    }, [getLimits, updateField]);

    const activePlan = selectedPlan === PLAN_44 ? PLAN_44 : PLAN_40;
    const activeFields = activePlan === PLAN_44 ? plan44Fields : plan40Fields;

    const selectedLead = useMemo(() => {
        return leads.find((l) => String(l.id) === String(selectedLeadId)) || null;
    }, [leads, selectedLeadId]);

    const selectedLeadLabel = useMemo(() => {
        if (leadsLoading) return 'Cargando…';
        if (!selectedLead) return 'Selecciona…';
        const name = `${selectedLead?.lead_first_name || ''} ${selectedLead?.lead_last_name || ''}`.trim() || '—';
        const extra = selectedLead?.lead_phone
            ? selectedLead.lead_phone
            : (selectedLead?.lead_email ? selectedLead.lead_email : '');
        return extra ? `${name} — ${extra}` : name;
    }, [leadsLoading, selectedLead]);

    const brokerName = useMemo(() => {
        const first = profile?.first_name?.trim() || '';
        const last = profile?.last_name?.trim() || '';
        const full = `${first} ${last}`.trim();
        return full || profile?.email || user?.email || '—';
    }, [profile?.email, profile?.first_name, profile?.last_name, user?.email]);

    const leadName = useMemo(() => {
        const first = selectedLead?.lead_first_name?.trim() || '';
        const last = selectedLead?.lead_last_name?.trim() || '';
        const full = `${first} ${last}`.trim();
        return full || selectedLead?.lead_email || selectedLead?.lead_phone || '—';
    }, [selectedLead?.lead_email, selectedLead?.lead_first_name, selectedLead?.lead_last_name, selectedLead?.lead_phone]);

    useEffect(() => {
        if (!leadPickerOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setLeadPickerOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [leadPickerOpen]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            // Si el picker táctil está abierto, ESC solo debe cerrar el picker.
            if (leadPickerOpen) return;
            onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [leadPickerOpen, onClose, open]);

    useEffect(() => {
        if (!open) return;
        if (!isSupabaseConfigured || !supabase) return;
        if (!user?.id) return;

        let cancelled = false;
        setLeadsLoading(true);
        setLeadsError('');

        (async () => {
            const baseQuery = () => supabase
                .from('leads')
                .select('id, created_at, lead_first_name, lead_last_name, lead_email, lead_phone, regimen, hl_status')
                .eq('hl_status', 'CREATED')
                .order('created_at', { ascending: false })
                .limit(500);

            try {
                const { data, error } = await baseQuery().eq('is_deleted', false);
                if (error) throw error;
                if (!cancelled) setLeads(Array.isArray(data) ? data : []);
            } catch (e) {
                const msg = String(e?.message ?? '');
                if (/is_deleted/i.test(msg)) {
                    const { data, error } = await baseQuery();
                    if (error) {
                        if (!cancelled) setLeadsError(`No se pudieron cargar clientes. ${error.message ?? ''}`.trim());
                    } else if (!cancelled) {
                        setLeads(Array.isArray(data) ? data : []);
                    }
                } else if (!cancelled) {
                    setLeadsError(`No se pudieron cargar clientes. ${msg}`.trim());
                }
            } finally {
                if (!cancelled) setLeadsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, user?.id]);

    const calculations = useMemo(() => {
        const editedField = lastEditedRef.current?.plan === activePlan ? lastEditedRef.current.field : null;

        const cloneFields = (fields) => ({
            ...fields,
            enganche: { ...fields.enganche },
            ...(fields.anualidad ? { anualidad: { ...fields.anualidad } } : {}),
            ...(fields.contra ? { contra: { ...fields.contra } } : {})
        });

        const getValue = (field) => toIntValue(field?.value);
        const amountFromField = (field, totalCurrentValue) => {
            const value = getValue(field);
            if (field.mode === 'amount') return value;
            return totalCurrentValue * (value / 100);
        };

        const valueFromAmount = (field, amount, totalCurrentValue) => {
            if (field.mode === 'amount') return String(Math.max(0, Math.round(amount)));
            if (!totalCurrentValue) return '0';
            return String(Math.max(0, Math.round((amount / totalCurrentValue) * 100)));
        };

        const calcDiscount = (fields) => {
            const engancheField = fields.enganche;
            const engancheVal = getValue(engancheField);
            const enganchePctEquivalent = engancheField.mode === 'pct'
                ? engancheVal
                : (totalBase ? (engancheVal / totalBase) * 100 : 0);
            const extra = Math.max(0, enganchePctEquivalent - discountSettings.fromPct);
            const discountRaw = discountSettings.stepPct > 0
                ? extra * (discountSettings.rate / discountSettings.stepPct)
                : 0;
            const maxPct = Number.isFinite(discountSettings.maxPct) ? discountSettings.maxPct : 10;
            const discountPct = Math.min(maxPct, roundOneDecimal(discountRaw));
            const pricePerM2Current = pricePerM2Base * (1 - discountPct / 100);
            const totalCurrent = sizeM2 * pricePerM2Current;
            return { enganchePctEquivalent, discountPct, pricePerM2Current, totalCurrent };
        };

        let adjustedFields = cloneFields(activeFields);
        let ajusteCampos = new Set();
        let sinSaldo = false;
        let disableAnualidad = false;
        let disableContra = false;
        let pagoTotalEnganche = false;

        let pricePerM2Current = pricePerM2Base;
        let totalCurrent = totalBase;
        let engancheAmount = 0;
        let anualidadAmount = 0;
        let contraAmount = 0;
        let anualidadesTotal = 0;
        let monthly = 0;
        let remaining = 0;
        let discountPct = 0;
        let enganchePctEquivalent = 0;

        const applyAdjust = (fieldKey) => {
            ajusteCampos.add(fieldKey);
        };

        for (let pass = 0; pass < 2; pass += 1) {
            const discount = calcDiscount(adjustedFields);
            enganchePctEquivalent = discount.enganchePctEquivalent;
            discountPct = discount.discountPct;
            pricePerM2Current = discount.pricePerM2Current;
            totalCurrent = discount.totalCurrent;

            engancheAmount = amountFromField(adjustedFields.enganche, totalCurrent);

            if (activePlan === PLAN_44) {
                if (engancheAmount > totalCurrent) {
                    engancheAmount = totalCurrent;
                    applyAdjust('Enganche');
                }
                adjustedFields.enganche.value = valueFromAmount(adjustedFields.enganche, engancheAmount, totalCurrent);
                remaining = Math.max(0, totalCurrent - engancheAmount);
                monthly = totalCurrent ? remaining / 44 : 0;
                sinSaldo = remaining <= 0;
                break;
            }

            anualidadAmount = adjustedFields.anualidad ? amountFromField(adjustedFields.anualidad, totalCurrent) : 0;
            contraAmount = adjustedFields.contra ? amountFromField(adjustedFields.contra, totalCurrent) : 0;
            anualidadesTotal = anualidadAmount * 3;

            let over = engancheAmount + anualidadesTotal + contraAmount - totalCurrent;

            if (over > 0) {
                const engLimits = getLimits(PLAN_40, 'enganche');
                const engancheMinAmount = totalCurrent * engLimits.min;

                if (editedField === 'enganche') {
                    if (over > 0) {
                        const reduce = Math.min(contraAmount, over);
                        if (reduce > 0) applyAdjust('Contra escritura');
                        contraAmount -= reduce;
                        over -= reduce;
                    }
                    if (over > 0) {
                        const totalAnual = anualidadAmount * 3;
                        const reduce = Math.min(totalAnual, over);
                        if (reduce > 0) applyAdjust('Anualidad');
                        const newTotalAnual = totalAnual - reduce;
                        anualidadAmount = newTotalAnual / 3;
                        over -= reduce;
                    }
                    if (over > 0) {
                        if (engancheAmount > totalCurrent) {
                            applyAdjust('Enganche');
                        }
                        engancheAmount = totalCurrent;
                        over = 0;
                    }
                } else if (editedField === 'contra') {
                    if (over > 0) {
                        const totalAnual = anualidadAmount * 3;
                        const reduce = Math.min(totalAnual, over);
                        if (reduce > 0) applyAdjust('Anualidad');
                        const newTotalAnual = totalAnual - reduce;
                        anualidadAmount = newTotalAnual / 3;
                        over -= reduce;
                    }
                    if (over > 0) {
                        const reducible = Math.max(engancheAmount - engancheMinAmount, 0);
                        const reduce = Math.min(reducible, over);
                        if (reduce > 0) applyAdjust('Enganche');
                        engancheAmount -= reduce;
                        over -= reduce;
                    }
                    if (over > 0) {
                        const maxContra = Math.max(0, totalCurrent - engancheAmount - anualidadAmount * 3);
                        if (contraAmount > maxContra) {
                            applyAdjust('Contra escritura');
                            contraAmount = maxContra;
                        }
                    }
                } else if (editedField === 'anualidad') {
                    if (over > 0) {
                        const reduce = Math.min(contraAmount, over);
                        if (reduce > 0) applyAdjust('Contra escritura');
                        contraAmount -= reduce;
                        over -= reduce;
                    }
                    if (over > 0) {
                        const reducible = Math.max(engancheAmount - engancheMinAmount, 0);
                        const reduce = Math.min(reducible, over);
                        if (reduce > 0) applyAdjust('Enganche');
                        engancheAmount -= reduce;
                        over -= reduce;
                    }
                    if (over > 0) {
                        const maxAnualTotal = Math.max(0, totalCurrent - engancheAmount - contraAmount);
                        const newTotalAnual = Math.min(anualidadAmount * 3, maxAnualTotal);
                        if (newTotalAnual !== anualidadAmount * 3) applyAdjust('Anualidad');
                        anualidadAmount = newTotalAnual / 3;
                    }
                } else {
                    if (over > 0) {
                        const reduce = Math.min(contraAmount, over);
                        if (reduce > 0) applyAdjust('Contra escritura');
                        contraAmount -= reduce;
                        over -= reduce;
                    }
                    if (over > 0) {
                        const totalAnual = anualidadAmount * 3;
                        const reduce = Math.min(totalAnual, over);
                        if (reduce > 0) applyAdjust('Anualidad');
                        const newTotalAnual = totalAnual - reduce;
                        anualidadAmount = newTotalAnual / 3;
                        over -= reduce;
                    }
                    if (over > 0) {
                        const reduce = Math.min(engancheAmount, over);
                        if (reduce > 0) applyAdjust('Enganche');
                        engancheAmount -= reduce;
                        over -= reduce;
                    }
                }
            }

            if (engancheAmount >= totalCurrent) {
                if (anualidadAmount !== 0) applyAdjust('Anualidad');
                if (contraAmount !== 0) applyAdjust('Contra escritura');
                anualidadAmount = 0;
                contraAmount = 0;
            }

            const newEngancheValue = valueFromAmount(adjustedFields.enganche, engancheAmount, totalCurrent);
            const engancheChanged = newEngancheValue !== adjustedFields.enganche.value;
            adjustedFields.enganche.value = newEngancheValue;
            if (adjustedFields.anualidad) {
                adjustedFields.anualidad.value = valueFromAmount(adjustedFields.anualidad, anualidadAmount, totalCurrent);
            }
            if (adjustedFields.contra) {
                adjustedFields.contra.value = valueFromAmount(adjustedFields.contra, contraAmount, totalCurrent);
            }

            anualidadesTotal = anualidadAmount * 3;
            remaining = Math.max(0, totalCurrent - engancheAmount - anualidadesTotal - contraAmount);
            monthly = totalCurrent ? remaining / 40 : 0;
            sinSaldo = remaining <= 0;
            pagoTotalEnganche = engancheAmount >= totalCurrent;

            if (!engancheChanged || pass === 1) {
                break;
            }
        }

        disableAnualidad = activePlan === PLAN_40 && pagoTotalEnganche;
        disableContra = activePlan === PLAN_40 && pagoTotalEnganche;

        const ajusteMensaje = ajusteCampos.size > 0
            ? `Ajustamos ${Array.from(ajusteCampos).join(' y ')} para no exceder el total.`
            : '';

        return {
            engancheAmount,
            anualidadAmount,
            contraAmount,
            anualidadesTotal,
            enganchePctEquivalent,
            discountPct,
            pricePerM2Current,
            totalCurrent,
            monthly,
            remaining,
            adjustedFields,
            ajusteMensaje,
            sinSaldo,
            disableAnualidad,
            disableContra,
            pagoTotalEnganche
        };
    }, [activeFields, activePlan, discountSettings, getLimits, pricePerM2Base, sizeM2, totalBase]);

    const fieldsEqual = useCallback((a, b) => {
        if (!a || !b) return false;
        const keys = Object.keys(a);
        for (const key of keys) {
            if (!b[key]) return false;
            if (a[key].mode !== b[key].mode) return false;
            if (a[key].value !== b[key].value) return false;
        }
        return true;
    }, []);

    useEffect(() => {
        if (!selectedPlan) {
            setAjusteNota('');
            return;
        }
        if (activePlan === PLAN_44) {
            if (!fieldsEqual(plan44Fields, calculations.adjustedFields)) {
                setPlan44Fields(calculations.adjustedFields);
            }
        } else if (!fieldsEqual(plan40Fields, calculations.adjustedFields)) {
            setPlan40Fields(calculations.adjustedFields);
        }
        setAjusteNota(calculations.ajusteMensaje || '');
    }, [activePlan, calculations.adjustedFields, calculations.ajusteMensaje, fieldsEqual, plan40Fields, plan44Fields, selectedPlan]);

    if (!open) return null;

    const showPlanInputs = selectedPlan === PLAN_40 || selectedPlan === PLAN_44;
    const showValues = showPlanInputs;
    const discountLabel = showValues && calculations.discountPct >= discountSettings.maxPct
        ? 'Alcanzaste el descuento máximo'
        : 'Ligado al enganche';
    const displayAmount = (value) => (showValues ? currencyFmt.format(value) : '—');

    const onDownloadQuote = async () => {
        setQuoteError('');
        setLeadFieldError('');

        if (!showPlanInputs) {
            setQuoteError('Seleccione forma de pago.');
            return;
        }
        if (!selectedLeadId) {
            setLeadFieldError('Selecciona un cliente.');
            return;
        }
        if (!isSupabaseConfigured || !supabase) {
            setQuoteError('Supabase no está configurado.');
            return;
        }
        if (!user?.id) {
            setQuoteError('No se encontró sesión activa.');
            return;
        }
        if (!lotNumber || !tipo || !sizeM2 || !pricePerM2Base || !totalBase) {
            setQuoteError('No hay un lote válido seleccionado para cotizar.');
            return;
        }

        setQuoteSaving(true);
        try {
            // Genera ID y guarda snapshot en DB antes de generar el PDF.
            let quoteId = generateQuoteId();
            const method = selectedPlan === PLAN_44 ? 'MSI_44' : 'ANUALIDADES_40';
            const mensualidadesNum = selectedPlan === PLAN_44 ? 44 : 40;

            const money = (n) => Math.round((toNumber(n) + Number.EPSILON) * 100) / 100;

            const payload = {
                id: quoteId,
                broker_id: user.id,
                broker_name_snapshot: brokerName,
                lead_id: selectedLeadId,
                lead_name_snapshot: leadName,
                lot_number: String(lotNumber),
                lot_typology: String(tipo),
                payment_method: method,
                mensualidades_num: mensualidadesNum,
                mensualidad_monto: money(calculations.monthly),
                enganche_monto: money(calculations.engancheAmount),
                anualidad_monto: selectedPlan === PLAN_44 ? null : money(calculations.anualidadAmount),
                pago_escritura_monto: selectedPlan === PLAN_44 ? null : money(calculations.contraAmount),
                precio_m2: money(calculations.pricePerM2Current),
                tamano_m2: money(sizeM2),
                costo_base: money(totalBase),
                descuento: money(calculations.discountPct),
                costo_final: money(calculations.totalCurrent),
                regimen_name_snapshot: selectedLead?.regimen || 'PENDIENTE_DEFINIR'
            };

            // Insert + return inserted row (para usar el snapshot exacto en el PDF).
            let inserted = null;
            for (let attempt = 0; attempt < 2; attempt += 1) {
                const { data, error } = await supabase
                    .from('quotes')
                    .insert({ ...payload, id: quoteId })
                    .select('*')
                    .single();

                if (!error) {
                    inserted = data;
                    break;
                }
                // Colisión improbable: regenerar ID y reintentar 1 vez.
                quoteId = generateQuoteId();
                payload.id = quoteId;
                if (attempt === 1) throw error;
            }

            const pdfBytes = await generateQuotePdfBytes(inserted || payload);
            const filename = buildQuoteFilename(inserted || payload);
            downloadPdfBytes(pdfBytes, filename);
        } catch (e) {
            setQuoteError(String(e?.message || 'No se pudo generar la cotización.'));
        } finally {
            setQuoteSaving(false);
        }
    };

    const useTouchPicker = isMobile || isIpadLandscape;

    return (
        <div className="cotizador-overlay" onClick={onClose}>
            <div className="cotizador-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cotizador-modal-header">
                    <button className="cotizador-close" onClick={onClose} aria-label="Cerrar">×</button>
                    <div className="cotizador-title">COTIZADOR</div>
                    <div className="cotizador-divider" />
                </div>

                <div className="cotizador-body">
                    <div className="cotizador-main">
                        <div className="cotizador-summary-card">
                            <div className="cotizador-summary-row">
                                <span className="cotizador-summary-label">Lote</span>
                                <span className="cotizador-summary-value">{lotNumber}</span>
                            </div>
                            <div className="cotizador-summary-row">
                                <span className="cotizador-summary-label">Tipo</span>
                                <span className="cotizador-summary-value">{tipo}</span>
                            </div>
                            <div className="cotizador-summary-row">
                                <span className="cotizador-summary-label">Tamaño</span>
                                <span className="cotizador-summary-value">{numberFmt.format(sizeM2)} m²</span>
                            </div>
                            <div className="cotizador-summary-row">
                                <span className="cotizador-summary-label">Precio m²</span>
                                <span className="cotizador-summary-value">{currencyFmt.format(showValues ? calculations.pricePerM2Current : pricePerM2Base)}</span>
                            </div>
                            <div className="cotizador-summary-row">
                                <span className="cotizador-summary-label">Costo total</span>
                                <span className="cotizador-summary-value">{currencyFmt.format(showValues ? calculations.totalCurrent : totalBase)}</span>
                            </div>
                            <div className="cotizador-summary-row cotizador-summary-discount">
                                <span className="cotizador-summary-label">Descuento</span>
                                <span className="cotizador-summary-value">
                                    {showValues ? `${calculations.discountPct.toFixed(1)}%` : '—'}
                                    <span className="cotizador-summary-note">{discountLabel}</span>
                                </span>
                            </div>
                            <div className="cotizador-client">
                                <label className="cotizador-client-label">Cliente <span className="cotizador-required">*</span></label>
                                {useTouchPicker ? (
                                    <>
                                        <button
                                            type="button"
                                            className="cotizador-client-picker"
                                            onClick={() => {
                                                if (leadsLoading) return;
                                                setLeadPickerOpen(true);
                                            }}
                                            disabled={leadsLoading}
                                            aria-haspopup="dialog"
                                            aria-expanded={leadPickerOpen ? 'true' : 'false'}
                                        >
                                            <span className={`cotizador-client-picker-text ${selectedLeadId ? '' : 'is-placeholder'}`}>
                                                {selectedLeadLabel}
                                            </span>
                                            <span className="cotizador-client-picker-chevron" aria-hidden="true">▾</span>
                                        </button>

                                        {leadPickerOpen ? (
                                            <div
                                                className="cotizador-picker-overlay"
                                                role="dialog"
                                                aria-modal="true"
                                                onClick={(e) => {
                                                    if (e.target === e.currentTarget) setLeadPickerOpen(false);
                                                }}
                                            >
                                                <div className="cotizador-picker-sheet" onClick={(e) => e.stopPropagation()}>
                                                    <div className="cotizador-picker-head">
                                                        <div className="cotizador-picker-title">Selecciona un cliente</div>
                                                        <button
                                                            type="button"
                                                            className="cotizador-picker-close"
                                                            onClick={() => setLeadPickerOpen(false)}
                                                            aria-label="Cerrar"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                    <div className="cotizador-picker-list" role="listbox" aria-label="Clientes disponibles">
                                                        {leads.length ? (
                                                            leads.map((l) => {
                                                                const name = `${l?.lead_first_name || ''} ${l?.lead_last_name || ''}`.trim() || '—';
                                                                const meta = l?.lead_phone || l?.lead_email || '';
                                                                const isActive = String(l.id) === String(selectedLeadId);
                                                                return (
                                                                    <button
                                                                        key={l.id}
                                                                        type="button"
                                                                        className={`cotizador-picker-option ${isActive ? 'is-active' : ''}`}
                                                                        onClick={() => {
                                                                            setSelectedLeadId(String(l.id));
                                                                            setLeadFieldError('');
                                                                            setLeadPickerOpen(false);
                                                                        }}
                                                                        role="option"
                                                                        aria-selected={isActive ? 'true' : 'false'}
                                                                    >
                                                                        <div className="cotizador-picker-name">{name}</div>
                                                                        {meta ? <div className="cotizador-picker-meta">{meta}</div> : null}
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="cotizador-picker-empty">No hay clientes disponibles.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <select
                                        className="cotizador-client-select"
                                        value={selectedLeadId}
                                        onChange={(e) => { setSelectedLeadId(e.target.value); setLeadFieldError(''); }}
                                        disabled={leadsLoading}
                                    >
                                        <option value="">{leadsLoading ? 'Cargando…' : 'Selecciona…'}</option>
                                        {leads.map((l) => {
                                            const name = `${l?.lead_first_name || ''} ${l?.lead_last_name || ''}`.trim() || '—';
                                            const extra = l?.lead_phone ? ` — ${l.lead_phone}` : '';
                                            return (
                                                <option key={l.id} value={l.id}>{`${name}${extra}`}</option>
                                            );
                                        })}
                                    </select>
                                )}
                                {leadsError ? <div className="cotizador-error">{leadsError}</div> : null}
                                {leadFieldError ? <div className="cotizador-error">{leadFieldError}</div> : null}
                            </div>
                        </div>

                        <div className="cotizador-plan-grid">
                            <button
                                className={`cotizador-plan-card ${selectedPlan === PLAN_40 ? 'active' : ''}`}
                                onClick={() => setSelectedPlan(PLAN_40)}
                            >
                                <div className="cotizador-plan-text">
                                    <span className="cotizador-plan-title">3 anualidades + 40 MSI</span>
                                    <span className="cotizador-plan-subtitle">Pago contra escritura</span>
                                </div>
                                <span className="cotizador-plan-check">✓</span>
                            </button>
                            <button
                                className={`cotizador-plan-card ${selectedPlan === PLAN_44 ? 'active' : ''}`}
                                onClick={() => setSelectedPlan(PLAN_44)}
                            >
                                <div className="cotizador-plan-text">
                                    <span className="cotizador-plan-title">44 MSI</span>
                                    <span className="cotizador-plan-subtitle">Mensualidades fijas</span>
                                </div>
                                <span className="cotizador-plan-check">✓</span>
                            </button>
                        </div>

                        {!selectedPlan && (
                            <div className="cotizador-empty">Seleccione forma de pago</div>
                        )}

                        {showPlanInputs && (
                            <div className="cotizador-inputs is-visible">
                                {paymentLimitsError ? (
                                    <div className="cotizador-warning">{paymentLimitsError}</div>
                                ) : null}
                                {(selectedPlan === PLAN_44 ? ['enganche'] : ['enganche', 'anualidad', 'contra']).map((key) => {
                                    const label = key === 'enganche' ? 'Enganche' : key === 'anualidad' ? 'Anualidad' : 'Contra escritura';
                                    const field = activeFields[key];
                                    const limits = getLimits(selectedPlan, key);
                                    const fmtPct = (dec) => {
                                        const pct = roundOneDecimal(Number(dec) * 100);
                                        if (!Number.isFinite(pct)) return '—';
                                        const asInt = Math.round(pct);
                                        if (Math.abs(pct - asInt) < 1e-9) return `${asInt}%`;
                                        return `${pct.toFixed(1)}%`;
                                    };
                                    const totalRef = calculations.totalCurrent || 0;
                                    const minAmt = totalRef > 0 ? Math.ceil(limits.min * totalRef) : 0;
                                    const maxAmt = totalRef > 0 ? Math.floor(limits.max * totalRef) : 0;
                                    const minText = field.mode === 'pct'
                                        ? `Mínimo ${fmtPct(limits.min)} · Máximo ${fmtPct(limits.max)}`
                                        : `Mínimo ${currencyFmt.format(minAmt)} · Máximo ${currencyFmt.format(maxAmt)}`;
                                    const isPercent = field.mode === 'pct';
                                    const isDisabled = selectedPlan === PLAN_40 && key !== 'enganche' && calculations.pagoTotalEnganche;
                                    const helperText = isDisabled ? 'No aplica (pago total en enganche)' : minText;

                                    return (
                                        <div key={key} className={`cotizador-input-row ${isDisabled ? 'is-disabled' : ''}`}>
                                            <div className="cotizador-input-label">{label}</div>
                                            <div className="cotizador-input-control">
                                                <div className="cotizador-input-line">
                                                    <div className="cotizador-segment">
                                                        <button
                                                            type="button"
                                                            className={isPercent ? 'active' : ''}
                                                            onClick={() => switchMode(selectedPlan, key, 'pct', totalRef)}
                                                            disabled={isDisabled}
                                                        >
                                                            %
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={!isPercent ? 'active' : ''}
                                                            onClick={() => switchMode(selectedPlan, key, 'amount', totalRef)}
                                                            disabled={isDisabled}
                                                        >
                                                            $
                                                        </button>
                                                    </div>
                                                    <div className={`cotizador-input-cluster ${isPercent ? 'has-stepper' : ''}`}>
                                                        <div className={`cotizador-input-wrap ${isPercent ? 'is-percent' : 'is-currency'}`}>
                                                            {!isPercent && <span className="cotizador-prefix">$</span>}
                                                            <input
                                                                inputMode="numeric"
                                                                type="text"
                                                                value={field.value}
                                                                onChange={(e) => handleValueChange(selectedPlan, key, sanitizeDigits(e.target.value))}
                                                                onBlur={() => clampOnBlur(selectedPlan, key, totalRef)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        clampOnBlur(selectedPlan, key, totalRef);
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                                disabled={isDisabled}
                                                            />
                                                            {isPercent && <span className="cotizador-suffix">%</span>}
                                                        </div>
                                                        {isPercent && (
                                                            <div className="cotizador-stepper-inline">
                                                                <button type="button" onClick={() => stepPct(selectedPlan, key, 1)} disabled={isDisabled}>▲</button>
                                                                <button type="button" onClick={() => stepPct(selectedPlan, key, -1)} disabled={isDisabled}>▼</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="cotizador-helper">{helperText}</div>
                                                {limitErrors?.[key] && !isDisabled ? (
                                                    <div className="cotizador-field-error">{limitErrors[key]}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="cotizador-monthly">
                                    {selectedPlan === PLAN_44 ? '44 MSI' : '40 MSI'}:{' '}
                                    <strong>
                                        {calculations.sinSaldo ? 'Sin saldo a financiar' : displayAmount(calculations.monthly)}
                                    </strong>
                                    {!calculations.sinSaldo && ' por mensualidad'}
                                </div>
                                {ajusteNota && (
                                    <div className="cotizador-adjust-note">{ajusteNota}</div>
                                )}
                            </div>
                        )}
                    </div>

                    <aside className={`cotizador-results ${showPlanInputs ? '' : 'disabled'}`}>
                        <div className="cotizador-results-title">Resumen en $</div>
                        <div className="cotizador-results-list">
                        <div className="cotizador-result-item">
                            <span>Enganche</span>
                            <strong>{displayAmount(calculations.engancheAmount)}</strong>
                        </div>
                        {selectedPlan !== PLAN_44 && (
                            <>
                                <div className="cotizador-result-item">
                                    <span>Anualidad</span>
                                    <strong>{displayAmount(calculations.anualidadAmount)}</strong>
                                </div>
                                <div className="cotizador-result-item">
                                    <span>Total 3 anualidades</span>
                                    <strong>{displayAmount(calculations.anualidadesTotal)}</strong>
                                </div>
                                <div className="cotizador-result-item">
                                    <span>Contra escritura</span>
                                    <strong>{displayAmount(calculations.contraAmount)}</strong>
                                </div>
                            </>
                        )}
                        <div className="cotizador-result-item">
                            <span>Mensualidad {selectedPlan === PLAN_44 ? '44 MSI' : '40 MSI'}</span>
                            <strong>{displayAmount(calculations.monthly)}</strong>
                        </div>
                        </div>
                        {quoteError ? <div className="cotizador-error" style={{ marginTop: 10 }}>{quoteError}</div> : null}
                        <button className="cotizador-submit" type="button" onClick={onDownloadQuote} disabled={quoteSaving}>
                            {quoteSaving ? 'Generando…' : 'Descargar cotización'}
                        </button>
                        {selectedPlan && (
                            <div className="cotizador-schedule">
                                <div className="cotizador-schedule-title">Calendario de pagos</div>
                                <ol className="cotizador-schedule-list">
                                    {selectedPlan === PLAN_44 ? (
                                        <>
                                            <li>Separación + Enganche</li>
                                            <li>44 mensualidades sin intereses</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>Separación + Enganche</li>
                                            <li>12 mensualidades</li>
                                            <li>Anualidad</li>
                                            <li>12 mensualidades</li>
                                            <li>Anualidad</li>
                                            <li>12 mensualidades</li>
                                            <li>4 mensualidades</li>
                                            <li>Pago contra escritura</li>
                                        </>
                                    )}
                                </ol>
                            </div>
                        )}
                    </aside>
                </div>
                <div className="cotizador-legend">
                    <p><em>*La cotización puede contener errores.</em></p>
                    <p><strong>**La cotización no asegura el precio, el precio se asegura mediante la separación de $20,000.00.</strong></p>
                </div>
            </div>
        </div>
    );
}
