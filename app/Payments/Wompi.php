<?php

namespace App\Payments;

use App\Models\PaymentLink;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Integración con Wompi (Bancolombia) por Web Checkout.
 *
 * - El pago se firma en el servidor con el secreto de integridad (nunca llega al navegador).
 * - Un pago solo se da por recibido si Wompi lo confirma: por evento firmado (webhook)
 *   o consultando la transacción en su API. El regreso del cliente no es prueba de pago.
 *
 * Documentación: docs.wompi.co (Widget & Checkout Web, Eventos, Ambientes y llaves).
 */
class Wompi
{
    public const CHECKOUT_URL = 'https://checkout.wompi.co/p/';

    public static function configured(): bool
    {
        return filled(config('services.wompi.public_key')) && filled(config('services.wompi.integrity_secret'));
    }

    public static function sandbox(): bool
    {
        return str_starts_with((string) config('services.wompi.public_key'), 'pub_test_');
    }

    public static function apiUrl(): string
    {
        return self::sandbox() ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';
    }

    /**
     * SHA-256 de «<referencia><monto en centavos><moneda><secreto de integridad>».
     */
    public static function integritySignature(string $reference, int $amountInCents, string $currency): string
    {
        return hash('sha256', $reference.$amountInCents.$currency.config('services.wompi.integrity_secret'));
    }

    /**
     * Campos del formulario de Web Checkout (se envía por GET a CHECKOUT_URL).
     *
     * @return array<string, string|int>
     */
    public static function checkoutFields(PaymentLink $link, string $redirectUrl): array
    {
        $reference = $link->newReference();
        $cents = $link->amountInCents();

        return [
            'public-key' => (string) config('services.wompi.public_key'),
            'currency' => $link->currency,
            'amount-in-cents' => $cents,
            'reference' => $reference,
            'signature:integrity' => self::integritySignature($reference, $cents, $link->currency),
            'redirect-url' => $redirectUrl,
        ];
    }

    /**
     * Valida la firma de un evento: SHA-256 de los valores de signature.properties (en su orden)
     * + timestamp + secreto de eventos, comparado con signature.checksum o el encabezado.
     *
     * @param  array<string, mixed>  $event
     */
    public static function validEvent(array $event, ?string $headerChecksum = null): bool
    {
        $secret = (string) config('services.wompi.events_secret');
        $properties = Arr::get($event, 'signature.properties');
        $checksum = $headerChecksum ?: Arr::get($event, 'signature.checksum');

        if ($secret === '' || ! is_array($properties) || $properties === [] || ! is_string($checksum) || ! isset($event['timestamp'])) {
            return false;
        }

        $values = '';
        foreach ($properties as $path) {
            $value = Arr::get($event['data'] ?? [], (string) $path);

            if (! is_scalar($value)) {
                return false;
            }

            $values .= $value;
        }

        return hash_equals(strtolower(hash('sha256', $values.$event['timestamp'].$secret)), strtolower($checksum));
    }

    /**
     * Consulta una transacción en la API de Wompi. Null si no se pudo consultar.
     *
     * @return array<string, mixed>|null
     */
    public static function transaction(string $id): ?array
    {
        if (! preg_match('/^[A-Za-z0-9_-]{4,60}$/', $id)) {
            return null;
        }

        try {
            $response = Http::timeout(10)->acceptJson()
                ->withToken((string) config('services.wompi.public_key'))
                ->get(self::apiUrl().'/transactions/'.$id);
        } catch (Throwable $e) {
            report($e);

            return null;
        }

        $data = $response->successful() ? $response->json('data') : null;

        return is_array($data) ? $data : null;
    }
}
