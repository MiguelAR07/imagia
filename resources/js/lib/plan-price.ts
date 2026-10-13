import { formatMoney } from '@/lib/format';

/** Texto del precio de un plan tal como se mostrará al público. */
export function planPriceLabel(
    type: string,
    price: string | number | null,
    currency: string,
): string {
    if (type === 'quote') {
        return 'Precio según cotización';
    }

    if (price === null || price === '' || Number(price) <= 0) {
        return 'Precio por definir';
    }

    return type === 'from'
        ? `Desde ${formatMoney(price, currency)}`
        : formatMoney(price, currency);
}
