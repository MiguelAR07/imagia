<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Cotización. Es una propuesta: nunca registra pagos.
 *
 * @property int $id
 * @property string $number
 * @property int|null $client_id
 * @property int|null $lead_id
 * @property int|null $plan_id
 * @property string $title
 * @property string|null $scope
 * @property string $status
 * @property string $currency
 * @property string $subtotal
 * @property string $discount_amount
 * @property string $tax_amount
 * @property string $total
 * @property string|null $payment_terms
 * @property Carbon|null $valid_until
 * @property string|null $exclusions
 * @property string|null $notes
 * @property Carbon|null $sent_at
 * @property Carbon|null $accepted_at
 * @property int|null $created_by
 */
#[Fillable([
    'client_id', 'lead_id', 'plan_id', 'title', 'scope', 'currency', 'payment_terms',
    'valid_until', 'exclusions', 'notes',
])]
class Quote extends Model
{
    use SoftDeletes;

    public const STATUSES = [
        'draft' => 'Borrador',
        'sent' => 'Enviada',
        'accepted' => 'Aceptada',
        'rejected' => 'Rechazada',
        'expired' => 'Vencida',
    ];

    /** Estados en los que todavía se puede editar el contenido. */
    public const EDITABLE_STATUSES = ['draft', 'sent'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'valid_until' => 'date',
            'sent_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<QuoteItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class)->withTrashed();
    }

    /**
     * @return BelongsTo<Lead, $this>
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class)->withTrashed();
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return HasOne<Project, $this>
     */
    public function project(): HasOne
    {
        return $this->hasOne(Project::class)->withTrashed();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isEditable(): bool
    {
        return in_array($this->status, self::EDITABLE_STATUSES, true);
    }

    /** Vencida si pasó su validez y nadie la aceptó ni la rechazó. */
    public function isPastValidity(): bool
    {
        return $this->valid_until !== null
            && $this->valid_until->isBefore(today())
            && in_array($this->status, self::EDITABLE_STATUSES, true);
    }

    /**
     * @return HasMany<PaymentLink, $this>
     */
    public function paymentLinks(): HasMany
    {
        return $this->hasMany(PaymentLink::class);
    }

    /** Porcentaje del total que se paga al aceptar (el resto, al entregar). */
    public const DEPOSIT_PERCENT = 50;

    public function depositAmount(): float
    {
        return round((float) $this->total * self::DEPOSIT_PERCENT / 100);
    }

    /**
     * Crea (una sola vez) el enlace para que el cliente vea y acepte la cotización.
     */
    public function ensurePublicToken(): string
    {
        if ($this->public_token === null) {
            $this->forceFill(['public_token' => Str::random(32)])->save();
        }

        return $this->public_token;
    }

    /** A quién va dirigida: el cliente o, si aún no lo es, el prospecto. */
    public function recipientName(): ?string
    {
        return $this->client?->name ?? ($this->lead ? ($this->lead->company ?: $this->lead->name) : null);
    }

    public function recipientEmail(): ?string
    {
        return $this->client?->email ?: $this->lead?->email ?: null;
    }

    /**
     * Siguiente consecutivo del año: COT-2026-001, COT-2026-002…
     * Se llama dentro de una transacción para evitar números repetidos.
     */
    public static function nextNumber(): string
    {
        $prefix = 'COT-'.now()->year.'-';

        $last = static::query()->withTrashed()
            ->where('number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc(DB::raw('length(number)'))
            ->orderByDesc('number')
            ->value('number');

        $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }

    /**
     * @param  Builder<Quote>  $query
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
        $query->where(fn (Builder $q) => $q
            ->where('number', 'like', $like)
            ->orWhere('title', 'like', $like)
            ->orWhereHas('client', fn (Builder $c) => $c->where('name', 'like', $like))
            ->orWhereHas('lead', fn (Builder $l) => $l->where('name', 'like', $like)->orWhere('company', 'like', $like)));
    }
}
