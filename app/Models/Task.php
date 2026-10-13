<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_id
 * @property int|null $milestone_id
 * @property string $title
 * @property string|null $description
 * @property string $status
 * @property string $priority
 * @property int|null $assignee_id
 * @property Carbon|null $due_date
 * @property Carbon|null $completed_at
 * @property int $weight
 * @property int $sort_order
 */
#[Fillable([
    'milestone_id', 'title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'weight', 'sort_order',
])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    public const STATUSES = [
        'todo' => 'Por hacer',
        'in_progress' => 'En curso',
        'review' => 'En revisión',
        'done' => 'Hecha',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'weight' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // La fecha de finalización acompaña siempre al estado «Hecha».
        static::saving(function (Task $task) {
            if ($task->isDirty('status')) {
                $task->completed_at = $task->status === 'done' ? ($task->completed_at ?? now()) : null;
            }
        });
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class)->withTrashed();
    }

    /**
     * @return BelongsTo<Milestone, $this>
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(Milestone::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /**
     * @return HasMany<TaskComment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->oldest();
    }

    public function isOverdue(): bool
    {
        return $this->due_date !== null && $this->status !== 'done' && $this->due_date->isBefore(today());
    }

    /**
     * @return array<string, mixed>
     */
    public function toCardArray(): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'milestone_id' => $this->milestone_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'assignee' => $this->assignee?->only(['id', 'name']),
            'assignee_id' => $this->assignee_id,
            'due_date' => $this->due_date?->toDateString(),
            'weight' => $this->weight,
            'overdue' => $this->isOverdue(),
            'comments_count' => $this->comments_count ?? null,
        ];
    }
}
