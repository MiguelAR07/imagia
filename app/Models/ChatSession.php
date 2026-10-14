<?php

namespace App\Models;

use App\Models\Concerns\HasActivities;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Conversación del asistente del sitio. Se identifica por un UUID que guarda el navegador.
 *
 * @property int $id
 * @property string $uuid
 * @property int|null $lead_id
 * @property string|null $ip_hash
 * @property string $engine
 * @property int|null $recommended_plan_id
 * @property array<string, mixed>|null $answers
 * @property string|null $summary
 * @property string $status
 * @property string $attention_status
 * @property Carbon|null $last_message_at
 */
#[Fillable(['uuid', 'ip_hash', 'engine', 'answers', 'summary', 'status', 'attention_status', 'last_message_at'])]
class ChatSession extends Model
{
    use HasActivities;

    public const STATUSES = ['open' => 'Abierta', 'converted' => 'Con datos de contacto', 'closed' => 'Cerrada'];

    public const ATTENTION = ['new' => 'Nueva', 'in_review' => 'En revisión', 'attended' => 'Atendida'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['answers' => 'array', 'last_message_at' => 'datetime'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * @return HasMany<ChatMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class)->orderBy('id');
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
    public function recommendedPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'recommended_plan_id');
    }

    public function answer(string $key, mixed $default = null): mixed
    {
        return ($this->answers ?? [])[$key] ?? $default;
    }

    public function setAnswer(string $key, mixed $value): void
    {
        $this->answers = [...($this->answers ?? []), $key => $value];
    }

    public function userMessageCount(): int
    {
        return $this->messages()->where('role', 'user')->count();
    }
}
