<?php

namespace App\Http\Controllers\Site;

use App\Models\PaymentLink;
use App\Payments\PaymentLinkSettler;
use App\Payments\Wompi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

/**
 * Página pública donde el cliente paga un link de pago con Wompi.
 */
class PayController extends SiteController
{
    public function show(PaymentLink $paymentLink): Response
    {
        $paymentLink->load('project.client:id,name');
        $payable = $paymentLink->status === 'pending' && Wompi::configured();

        return $this->page('site/pay', [
            'link' => [
                'description' => $paymentLink->description,
                'amount' => $paymentLink->amount,
                'currency' => $paymentLink->currency,
                'status' => $paymentLink->status,
                'last_transaction_status' => $paymentLink->last_transaction_status,
                'project' => $paymentLink->project?->name,
                'client' => $paymentLink->project?->client?->name,
                'paid_at' => $paymentLink->paid_at?->toIso8601String(),
            ],
            'checkout' => $payable ? [
                'url' => Wompi::CHECKOUT_URL,
                'fields' => Wompi::checkoutFields($paymentLink, route('site.pay.result', $paymentLink)),
                'sandbox' => Wompi::sandbox(),
            ] : null,
        ], 'Pago en línea', 'Pago seguro en línea.', noindex: true);
    }

    /**
     * Regreso desde Wompi. No se confía en la URL: se consulta la transacción a Wompi.
     */
    public function result(Request $request, PaymentLink $paymentLink): RedirectResponse
    {
        $transaction = Wompi::transaction($request->string('id')->toString());

        if ($transaction !== null && PaymentLink::idFromReference((string) ($transaction['reference'] ?? '')) === $paymentLink->id) {
            PaymentLinkSettler::apply($transaction);
        }

        return to_route('site.pay', $paymentLink);
    }
}
