<?php

namespace App\Http\Controllers\Site;

use App\Models\PaymentLink;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Payments\Wompi;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;

/**
 * Cotización vista por el cliente (con su enlace privado). Desde aquí la acepta
 * pagando el anticipo; el saldo se cobra al entregar.
 */
class QuoteViewController extends SiteController
{
    public function show(string $token): Response
    {
        $quote = $this->find($token);
        $deposit = $quote->paymentLinks()->where('kind', 'deposit')->latest()->first();

        return $this->page('site/quote-view', [
            'token' => $token,
            'quote' => [
                ...$quote->only(['number', 'title', 'scope', 'status', 'currency', 'subtotal', 'discount_amount', 'tax_amount', 'total', 'payment_terms', 'exclusions', 'notes']),
                'recipient' => $quote->recipientName(),
                'valid_until' => $quote->valid_until?->toDateString(),
                'expired' => $quote->status === 'expired' || $quote->isPastValidity(),
                'items' => $quote->items->map(fn (QuoteItem $i) => [
                    'description' => $i->description,
                    'details' => $i->details,
                    'quantity' => $i->quantity,
                    'unit_price' => $i->unit_price,
                    'discount_percent' => $i->discount_percent,
                    'line_total' => round((float) $i->quantity * (float) $i->unit_price * (1 - (float) $i->discount_percent / 100), 2),
                ]),
            ],
            'deposit' => [
                'percent' => Quote::DEPOSIT_PERCENT,
                'amount' => $quote->depositAmount(),
                'paid' => $deposit?->status === 'paid',
                'payable' => $this->payable($quote),
            ],
        ], "Cotización {$quote->number}", "Propuesta {$quote->number}.", noindex: true);
    }

    /**
     * «Aceptar y pagar el anticipo»: crea (o reutiliza) el link del anticipo y lleva al pago.
     */
    public function accept(string $token): RedirectResponse
    {
        $quote = $this->find($token);

        abort_unless($this->payable($quote), 422, 'Esta cotización no se puede pagar en línea.');

        $link = $quote->paymentLinks()->where('kind', 'deposit')->where('status', 'pending')->latest()->first();

        if ($link === null) {
            $link = new PaymentLink([
                'amount' => $quote->depositAmount(),
                'description' => 'Anticipo del '.Quote::DEPOSIT_PERCENT." % · {$quote->number}",
            ]);
            $link->forceFill(['quote_id' => $quote->id, 'kind' => 'deposit', 'currency' => $quote->currency])->save();
        }

        return to_route('site.pay', $link);
    }

    private function find(string $token): Quote
    {
        abort_unless(preg_match('/^[A-Za-z0-9]{32}$/', $token) === 1, 404);

        // Un borrador nunca es visible para el cliente.
        return Quote::query()->where('public_token', $token)->where('status', '!=', 'draft')
            ->with(['items', 'client:id,name', 'lead:id,name,company'])->firstOrFail();
    }

    private function payable(Quote $quote): bool
    {
        return $quote->status === 'sent'
            && ! $quote->isPastValidity()
            && $quote->currency === 'COP'
            && $quote->depositAmount() >= 1500
            && Wompi::configured()
            && ! $quote->paymentLinks()->where('kind', 'deposit')->where('status', 'paid')->exists();
    }
}
