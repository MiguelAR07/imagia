<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Entregable acordado con el cliente.
 *
 * @property int $id
 * @property int $project_id
 * @property string $name
 * @property string|null $description
 * @property Carbon|null $due_date
 * @property Carbon|null $delivered_at
 * @property string $status
 * @property bool $is_visible_to_client
 */
#[Fillable(['name', 'description', 'due_date', 'status', 'is_visible_to_client'])]
class Deliverable extends Model
{
    public const STATUSES = [
        'pending' => 'Pendiente',
        'delivered' => 'Entregado',
        'approved' => 'Aprobado',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'delivered_at' => 'datetime',
            'is_visible_to_client' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Deliverable $deliverable) {
            if ($deliverable->isDirty('status')) {
                $deliverable->delivered_at = $deliverable->status === 'pending'
                    ? null
                    : ($deliverable->delivered_at ?? now());
            }
        });
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
