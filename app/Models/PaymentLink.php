<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Link de pago en línea para un proyecto (Wompi).
 *
 * @property int $id
 * @property string $token
 * @property int $project_id
 * @property string $amount
 * @property string $currency
 * @property string $description
 * @property string $status
 * @property string|null $last_transaction_status
 * @property string|null $transaction_id
 * @property string|null $payment_method_type
 * @property int|null $payment_id
 * @property Carbon|null $paid_at
 */
#[Fillable(['amount', 'description'])]
class PaymentLink extends Model
{
    public const STATUSES = ['pending' => 'Pendiente', 'paid' => 'Pagado', 'cancelled' => 'Anulado'];

    protected static function booted(): void
    {
        static::creating(function (PaymentLink $link) {
            $link->token ??= Str::random(32);
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'paid_at' => 'datetime'];
    }

    public function getRouteKeyName(): string
    {
        return 'token';
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class)->withTrashed();
    }

    /**
     * @return BelongsTo<Payment, $this>
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function amountInCents(): int
    {
        return (int) round((float) $this->amount * 100);
    }

    /**
     * Referencia para Wompi. Cambia en cada intento (Wompi no reutiliza referencias),
     * pero siempre empieza por el id del link para encontrarlo al confirmar.
     */
    public function newReference(): string
    {
        return "IMG{$this->id}-".now()->format('YmdHis').Str::upper(Str::random(4));
    }

    public static function idFromReference(string $reference): ?int
    {
        return preg_match('/^IMG(\d+)-/', $reference, $m) === 1 ? (int) $m[1] : null;
    }
}
