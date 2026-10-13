import type { Tone } from '@/components/status-badge';

export const QUOTE_STATUS_TONE: Record<string, Tone> = {
    draft: 'neutral',
    sent: 'brand',
    accepted: 'success',
    rejected: 'danger',
    expired: 'warning',
};

/**
 * Vista previa de totales en la interfaz. Replica QuoteCalculator (PHP);
 * el valor que se guarda siempre lo calcula el servidor.
 */
export function previewTotals(
    items: {
        quantity: string;
        unit_price: string;
        discount_percent: string;
        tax_rate_id: string;
    }[],
    rates: Record<string, number>,
) {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    const round = (n: number) => Math.round(n * 100) / 100;

    for (const item of items) {
        const gross = round(
            (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
        );
        const lineDiscount = round(
            (gross * (Number(item.discount_percent) || 0)) / 100,
        );
        const rate = item.tax_rate_id ? (rates[item.tax_rate_id] ?? 0) : 0;
        const lineTax = round(((gross - lineDiscount) * rate) / 100);
        subtotal += gross;
        discount += lineDiscount;
        tax += lineTax;
    }

    return {
        subtotal: round(subtotal),
        discount: round(discount),
        tax: round(tax),
        total: round(subtotal - discount + tax),
    };
}
