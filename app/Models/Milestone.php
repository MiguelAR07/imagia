<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Hito del cronograma de un proyecto.
 *
 * @property int $id
 * @property int $project_id
 * @property string $name
 * @property Carbon|null $due_date
 * @property Carbon|null $completed_at
 * @property int $sort_order
 */
#[Fillable(['name', 'due_date', 'completed_at', 'sort_order'])]
class Milestone extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['due_date' => 'date', 'completed_at' => 'datetime'];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return HasMany<Task, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
