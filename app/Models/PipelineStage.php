<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Etapa del embudo comercial (configurable desde el panel).
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $color
 * @property int $sort_order
 * @property bool $is_won
 * @property bool $is_lost
 */
#[Fillable(['name', 'slug', 'color', 'sort_order', 'is_won', 'is_lost'])]
class PipelineStage extends Model
{
    public const COLORS = ['blue', 'cyan', 'violet', 'amber', 'orange', 'green', 'red', 'slate'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['is_won' => 'boolean', 'is_lost' => 'boolean'];
    }

    /**
     * @return HasMany<Lead, $this>
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    /** Primera etapa del embudo: donde entra todo prospecto nuevo. */
    public static function initial(): ?self
    {
        return static::query()->orderBy('sort_order')->orderBy('id')->first();
    }
}
