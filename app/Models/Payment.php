<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Dinero recibido de un cliente por un proyecto. Es lo único que cuenta como «recibido».
 *
 * @property int $id
 * @property int $project_id
 * @property string $amount
 * @property string $currency
 * @property Carbon $paid_on
 * @property string $method
 * @property string|null $reference
 * @property string|null $notes
 * @property int|null $recorded_by
 */
#[Fillable(['amount', 'paid_on', 'method', 'reference', 'notes'])]
class Payment extends Model
{
    public const METHODS = [
        'transfer' => 'Transferencia',
        'cash' => 'Efectivo',
        'card' => 'Tarjeta',
        'payment_link' => 'Link de pago',
        'other' => 'Otro',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'paid_on' => 'date'];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class)->withTrashed();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
