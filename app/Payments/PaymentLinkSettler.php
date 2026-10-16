<?php

namespace App\Payments;

use App\Models\Payment;
use App\Models\PaymentLink;
use App\Notifications\PaymentReceived;
use App\Support\Notify;
use App\Support\QuoteAcceptance;
use Illuminate\Support\Facades\DB;

/**
 * Aplica a un link de pago el resultado de una transacción confirmada por Wompi.
 * Es idempotente: el webhook y la página de regreso pueden llegar los dos sin duplicar pagos.
 */
class PaymentLinkSettler
{
    /**
     * @param  array<string, mixed>  $transaction  Transacción tal como la entrega Wompi
     * @return PaymentLink|null El link afectado, o null si la transacción no corresponde a ninguno
     */
    public static function apply(array $transaction): ?PaymentLink
    {
        $id = PaymentLink::idFromReference((string) ($transaction['reference'] ?? ''));
        $link = $id ? PaymentLink::query()->find($id) : null;

        if ($link === null) {
            return null;
        }

        $status = (string) ($transaction['status'] ?? '');

        // Solo cuenta como dinero recibido si coincide exactamente lo que se cobró.
        $matches = (int) ($transaction['amount_in_cents'] ?? -1) === $link->amountInCents()
            && ($transaction['currency'] ?? null) === $link->currency;

        if ($status !== 'APPROVED' || ! $matches) {
            if ($link->status === 'pending') {
                $link->forceFill(['last_transaction_status' => $matches ? substr($status, 0, 12) : 'MISMATCH'])->save();
            }

            return $link;
        }

        $created = DB::transaction(function () use ($link, $transaction) {
            $link = PaymentLink::query()->lockForUpdate()->findOrFail($link->id);

            if ($link->status === 'paid') {
                return false;
            }

            // Anticipo de una cotización: al pagarse, la cotización queda aceptada y nace el proyecto.
            if ($link->project_id === null && $link->quote) {
                $project = QuoteAcceptance::accept($link->quote, 'anticipo pagado en línea');
                $link->forceFill(['project_id' => $project->id])->save();
                $link->setRelation('project', $project);
            }

            abort_if($link->project_id === null, 422, 'El link de pago no tiene proyecto.');

            $payment = new Payment([
                'amount' => $link->amount,
                'paid_on' => today(),
                'method' => 'payment_link',
                'reference' => mb_substr('Wompi '.$transaction['id'], 0, 100),
                'notes' => trim("Pago en línea: {$link->description}. Medio: ".($transaction['payment_method_type'] ?? 'no informado').'.'),
            ]);
            $payment->forceFill(['project_id' => $link->project_id, 'currency' => $link->currency])->save();

            $link->forceFill([
                'status' => 'paid',
                'last_transaction_status' => 'APPROVED',
                'transaction_id' => (string) $transaction['id'],
                'payment_method_type' => isset($transaction['payment_method_type']) ? substr((string) $transaction['payment_method_type'], 0, 30) : null,
                'payment_id' => $payment->id,
                'paid_at' => now(),
            ])->save();

            $link->project->logActivity('system', 'Pago en línea recibido (Wompi): $'.number_format((float) $link->amount, 0, ',', '.')." {$link->currency} · {$link->description}.");

            return true;
        });

        if ($created) {
            Notify::team('finanzas.ver', new PaymentReceived($link->refresh()));
        }

        return $link;
    }
}
