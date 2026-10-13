<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $subject_type
 * @property int $subject_id
 * @property int|null $user_id
 * @property string $type
 * @property string $description
 * @property array<string, mixed>|null $properties
 * @property Carbon $happened_at
 */
#[Fillable(['type', 'description', 'user_id', 'properties', 'happened_at'])]
class Activity extends Model
{
    /** Tipos que una persona puede registrar a mano. */
    public const MANUAL_TYPES = [
        'note' => 'Nota',
        'call' => 'Llamada',
        'email' => 'Correo',
        'meeting' => 'Reunión',
        'whatsapp' => 'WhatsApp',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'happened_at' => 'datetime',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toTimelineArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'description' => $this->description,
            'happened_at' => $this->happened_at->toIso8601String(),
            'user' => $this->user?->only(['id', 'name']),
            'is_manual' => array_key_exists($this->type, self::MANUAL_TYPES),
        ];
    }
}
