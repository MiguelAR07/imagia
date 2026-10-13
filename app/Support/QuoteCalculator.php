<?php

namespace App\Support;

use App\Models\TaxRate;

/**
 * Calcula los totales de una cotización en el servidor (la interfaz solo muestra una vista previa).
 *
 * Por cada concepto:
 *   bruto = cantidad × precio unitario
 *   descuento = bruto × % de descuento
 *   base = bruto − descuento
 *   impuesto = base × tarifa del impuesto
 * Totales: subtotal = Σ bruto · descuentos = Σ descuento · impuestos = Σ impuesto
 *          total = subtotal − descuentos + impuestos
 * Los valores se redondean a 2 decimales por concepto.
 */
class QuoteCalculator
{
    /**
     * @param  list<array{quantity: numeric, unit_price: numeric, discount_percent?: numeric|null, tax_rate_id?: int|null}>  $items
     * @return array{subtotal: float, discount_amount: float, tax_amount: float, total: float}
     */
    public static function totals(array $items): array
    {
        $rates = TaxRate::query()
            ->whereIn('id', array_filter(array_column($items, 'tax_rate_id')))
            ->pluck('rate', 'id');

        $subtotal = $discount = $tax = 0.0;

        foreach ($items as $item) {
            $gross = round((float) $item['quantity'] * (float) $item['unit_price'], 2);
            $lineDiscount = round($gross * (float) ($item['discount_percent'] ?? 0) / 100, 2);
            $rate = isset($item['tax_rate_id']) ? (float) ($rates[$item['tax_rate_id']] ?? 0) : 0.0;
            $lineTax = round(($gross - $lineDiscount) * $rate / 100, 2);

            $subtotal += $gross;
            $discount += $lineDiscount;
            $tax += $lineTax;
        }

        return [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => round($discount, 2),
            'tax_amount' => round($tax, 2),
            'total' => round($subtotal - $discount + $tax, 2),
        ];
    }
}
