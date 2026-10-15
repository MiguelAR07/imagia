<?php

namespace App\Http\Controllers;

use App\Payments\PaymentLinkSettler;
use App\Payments\Wompi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Eventos de Wompi. Solo se aceptan si la firma es válida (secreto de eventos).
 * Wompi reintenta mientras no reciba 200.
 */
class WompiWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $event = $request->json()->all();

        if (! Wompi::validEvent($event, $request->header('X-Event-Checksum'))) {
            return response()->json(['message' => 'Firma inválida'], 401);
        }

        $transaction = $event['data']['transaction'] ?? null;

        if (($event['event'] ?? null) === 'transaction.updated' && is_array($transaction)) {
            PaymentLinkSettler::apply($transaction);
        }

        return response()->json(['ok' => true]);
    }
}
