<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Pregunta frecuente. Sin dueño es general (la usa también el asistente);
 * con dueño pertenece a un plan o servicio.
 *
 * @property int $id
 * @property string|null $faqable_type
 * @property int|null $faqable_id
 * @property string $question
 * @property string $answer
 * @property bool $is_published
 * @property int $sort_order
 */
#[Fillable(['question', 'answer', 'is_published', 'sort_order'])]
class Faq extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function faqable(): MorphTo
    {
        return $this->morphTo();
    }
}
