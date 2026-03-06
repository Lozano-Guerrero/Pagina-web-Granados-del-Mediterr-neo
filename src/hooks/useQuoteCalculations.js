import { useMemo } from 'react';

const PLAN_40 = 'plan40';
const PLAN_44 = 'plan44';

const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? 0 : num;
};

const roundOneDecimal = (value) => Math.round((value + Number.EPSILON) * 10) / 10;

export function useQuoteCalculations({ activePlan, activeFields, lotData, discountConfig, getLimits }) {
    const sizeM2 = toNumber(lotData?.sizeM2);
    const pricePerM2Base = toNumber(lotData?.pricePerM2Base);
    const totalBase = useMemo(() => sizeM2 * pricePerM2Base, [sizeM2, pricePerM2Base]);

    const discountSettings = useMemo(() => ({
        rate: Number.isFinite(discountConfig?.rate) ? discountConfig.rate : 1.5,
        stepPct: Number.isFinite(discountConfig?.stepPct) ? discountConfig.stepPct : 5,
        fromPct: Number.isFinite(discountConfig?.fromPct) ? discountConfig.fromPct : 10,
        maxPct: Number.isFinite(discountConfig?.maxPct) ? discountConfig.maxPct : 10
    }), [discountConfig]);

    return useMemo(() => {
        const getValue = (field) => {
            const num = parseInt(String(field?.value || 0), 10);
            return Number.isNaN(num) ? 0 : num;
        };

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
            const maxPct = discountSettings.maxPct;
            const discountPct = Math.min(maxPct, roundOneDecimal(discountRaw));
            const pricePerM2Current = pricePerM2Base * (1 - discountPct / 100);
            const totalCurrent = sizeM2 * pricePerM2Current;
            return { enganchePctEquivalent, discountPct, pricePerM2Current, totalCurrent };
        };

        const clonedFields = JSON.parse(JSON.stringify(activeFields));
        let adjustedFields = clonedFields;
        let ajusteCampos = new Set();

        const discount = calcDiscount(adjustedFields);
        let { enganchePctEquivalent, discountPct, pricePerM2Current, totalCurrent } = discount;

        let engancheAmount = amountFromField(adjustedFields.enganche, totalCurrent);
        let anualidadAmount = 0;
        let contraAmount = 0;
        let anualidadesTotal = 0;
        let monthly = 0;
        let remaining = 0;

        if (activePlan === PLAN_44) {
            if (engancheAmount > totalCurrent) {
                engancheAmount = totalCurrent;
                ajusteCampos.add('Enganche');
            }
            adjustedFields.enganche.value = valueFromAmount(adjustedFields.enganche, engancheAmount, totalCurrent);
            remaining = Math.max(0, totalCurrent - engancheAmount);
            monthly = totalCurrent ? remaining / 44 : 0;
        } else {
            anualidadAmount = adjustedFields.anualidad ? amountFromField(adjustedFields.anualidad, totalCurrent) : 0;
            contraAmount = adjustedFields.contra ? amountFromField(adjustedFields.contra, totalCurrent) : 0;
            anualidadesTotal = anualidadAmount * 3;

            let over = engancheAmount + anualidadesTotal + contraAmount - totalCurrent;
            if (over > 0) {
                // Lógica de ajuste simplificada para el hook
                const reduceContra = Math.min(contraAmount, over);
                contraAmount -= reduceContra;
                over -= reduceContra;
                if (reduceContra > 0) ajusteCampos.add('Contra escritura');

                if (over > 0) {
                    const totalAnual = anualidadAmount * 3;
                    const reduceAnual = Math.min(totalAnual, over);
                    anualidadAmount = (totalAnual - reduceAnual) / 3;
                    over -= reduceAnual;
                    if (reduceAnual > 0) ajusteCampos.add('Anualidad');
                }
            }

            adjustedFields.enganche.value = valueFromAmount(adjustedFields.enganche, engancheAmount, totalCurrent);
            if (adjustedFields.anualidad) adjustedFields.anualidad.value = valueFromAmount(adjustedFields.anualidad, anualidadAmount, totalCurrent);
            if (adjustedFields.contra) adjustedFields.contra.value = valueFromAmount(adjustedFields.contra, contraAmount, totalCurrent);

            remaining = Math.max(0, totalCurrent - engancheAmount - (anualidadAmount * 3) - contraAmount);
            monthly = totalCurrent ? remaining / 40 : 0;
        }

        const engancheInOtherMode = activeFields.enganche.mode === 'pct' ? engancheAmount : (totalCurrent ? (engancheAmount / totalCurrent) * 100 : 0);

        return {
            engancheAmount,
            anualidadAmount,
            contraAmount,
            anualidadesTotal: anualidadAmount * 3,
            enganchePctEquivalent,
            discountPct,
            pricePerM2Current,
            totalCurrent,
            monthly,
            remaining,
            adjustedFields,
            engancheInOtherMode,
            ajusteMensaje: ajusteCampos.size > 0 ? `Ajustado: ${Array.from(ajusteCampos).join(', ')}` : '',
            sinSaldo: remaining <= 0,
            pagoTotalEnganche: engancheAmount >= totalCurrent
        };
    }, [activeFields, activePlan, discountSettings, pricePerM2Base, sizeM2, totalBase]);
}
