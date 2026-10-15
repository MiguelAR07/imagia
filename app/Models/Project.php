<?php

namespace App\Models;

use App\Models\Concerns\HasActivities;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $client_id
 * @property string $name
 * @property string|null $description
 * @property string|null $category
 * @property string $status
 * @property string $priority
 * @property Carbon|null $start_date
 * @property Carbon|null $due_date
 * @property Carbon|null $completed_at
 * @property string|null $agreed_amount
 * @property string $currency
 * @property string $progress_mode
 * @property int|null $manual_progress
 * @property string|null $observations
 */
#[Fillable([
    'client_id', 'quote_id', 'name', 'description', 'category', 'status', 'priority', 'start_date', 'due_date',
    'agreed_amount', 'currency', 'progress_mode', 'manual_progress', 'observations',
])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasActivities, HasFactory, SoftDeletes;

    public const STATUSES = [
        'planning' => 'Planeación',
        'in_progress' => 'En desarrollo',
        'review' => 'En revisión',
        'delivered' => 'Entregado',
        'paused' => 'En pausa',
        'cancelled' => 'Cancelado',
    ];

    /** Estados en los que el proyecto ya no avanza (no cuentan como vencidos). */
    public const CLOSED_STATUSES = ['delivered', 'cancelled'];

    public const PRIORITIES = [
        'low' => 'Baja',
        'medium' => 'Media',
        'high' => 'Alta',
        'urgent' => 'Urgente',
    ];

    public const CATEGORIES = [
        'landing' => 'Landing page',
        'website' => 'Página web',
        'management' => 'Software de gestión',
        'admin_panel' => 'Panel administrativo',
        'automation' => 'Automatización',
        'mobile_app' => 'App móvil',
        'ai' => 'Integración con IA',
        'other' => 'Otro',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'agreed_amount' => 'decimal:2',
            'manual_progress' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class)->withTrashed();
    }

    /**
     * @return BelongsTo<Quote, $this>
     */
    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class)->withTrashed();
    }

    /**
     * @return HasMany<Task, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * @return HasMany<Milestone, $this>
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class)->orderBy('sort_order')->orderBy('due_date');
    }

    /**
     * @return HasMany<Deliverable, $this>
     */
    public function deliverables(): HasMany
    {
        return $this->hasMany(Deliverable::class)->orderBy('due_date');
    }

    /**
     * @return MorphMany<File, $this>
     */
    public function files(): MorphMany
    {
        return $this->morphMany(File::class, 'fileable')->latest();
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest('paid_on')->latest('id');
    }

    /**
     * @return HasMany<PaymentLink, $this>
     */
    public function paymentLinks(): HasMany
    {
        return $this->hasMany(PaymentLink::class);
    }

    /**
     * @return HasMany<Expense, $this>
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class)->latest('spent_on')->latest('id');
    }

    /**
     * Cuentas del proyecto en su moneda: contratado, recibido, por cobrar, gastos y utilidad.
     * Los gastos en otra moneda no se suman (no se convierten tasas de cambio).
     *
     * @return array{agreed: float|null, received: float, pending: float|null, expenses: float, profit: float}
     */
    public function finance(): array
    {
        $received = (float) $this->payments()->sum('amount');
        $expenses = (float) $this->expenses()->where('currency', $this->currency)->sum('amount');
        $agreed = $this->agreed_amount !== null ? (float) $this->agreed_amount : null;

        return [
            'agreed' => $agreed,
            'received' => $received,
            'pending' => $agreed !== null ? max(0.0, $agreed - $received) : null,
            'expenses' => $expenses,
            'profit' => $received - $expenses,
        ];
    }

    /**
     * Avance en porcentaje (0–100).
     * - tasks: peso de las tareas terminadas ÷ peso total de las tareas.
     * - manual: el valor que se fijó a mano.
     */
    public function progress(): int
    {
        if ($this->progress_mode === 'manual') {
            return (int) ($this->manual_progress ?? 0);
        }

        $totals = $this->relationLoaded('tasks')
            ? ['total' => $this->tasks->sum('weight'), 'done' => $this->tasks->where('status', 'done')->sum('weight')]
            : [
                'total' => (int) $this->tasks()->sum('weight'),
                'done' => (int) $this->tasks()->where('status', 'done')->sum('weight'),
            ];

        return $totals['total'] > 0 ? (int) round($totals['done'] * 100 / $totals['total']) : 0;
    }

    public function isOverdue(): bool
    {
        return $this->due_date !== null
            && $this->due_date->isBefore(today())
            && ! in_array($this->status, self::CLOSED_STATUSES, true);
    }

    /**
     * @param  Builder<Project>  $query
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
        $query->where(fn (Builder $q) => $q
            ->where('name', 'like', $like)
            ->orWhereHas('client', fn (Builder $c) => $c->where('name', 'like', $like)));
    }
}
