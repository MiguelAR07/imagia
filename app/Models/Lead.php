<?php

namespace App\Models;

use App\Models\Concerns\HasActivities;
use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Persona o empresa interesada en contratar.
 *
 * @property int $id
 * @property string $name
 * @property string|null $company
 * @property string|null $email
 * @property string|null $phone
 * @property string $source
 * @property string|null $need
 * @property string|null $budget_range
 * @property string|null $urgency
 * @property int|null $recommended_plan_id
 * @property int $pipeline_stage_id
 * @property int|null $client_id
 * @property int|null $assigned_to
 * @property Carbon|null $consent_at
 * @property string|null $lost_reason
 * @property Carbon|null $last_contacted_at
 * @property Carbon|null $next_follow_up_at
 * @property Carbon|null $created_at
 */
#[Fillable([
    'name', 'company', 'email', 'phone', 'source', 'need', 'budget_range', 'urgency',
    'pipeline_stage_id', 'assigned_to', 'lost_reason', 'next_follow_up_at',
])]
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use HasActivities, HasFactory, SoftDeletes;

    public const SOURCES = [
        'chatbot' => 'Asistente del sitio',
        'form' => 'Formulario web',
        'whatsapp' => 'WhatsApp',
        'referral' => 'Referido',
        'social' => 'Redes sociales',
        'manual' => 'Registro manual',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'consent_at' => 'datetime',
            'last_contacted_at' => 'datetime',
            'next_follow_up_at' => 'date',
        ];
    }

    /**
     * @return BelongsTo<PipelineStage, $this>
     */
    public function stage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'pipeline_stage_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class)->withTrashed();
    }

    /**
     * @param  Builder<Lead>  $query
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
            ->orWhere('company', 'like', $like)
            ->orWhere('email', 'like', $like)
            ->orWhere('phone', 'like', $like));
    }

    public function isFollowUpOverdue(): bool
    {
        return $this->next_follow_up_at !== null && $this->next_follow_up_at->isBefore(today());
    }
}
