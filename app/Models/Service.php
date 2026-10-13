<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Servicio del catálogo (landing pages, webs, software de gestión…).
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $summary
 * @property string|null $description
 * @property list<string>|null $benefits
 * @property string|null $icon
 * @property bool $is_published
 * @property int $sort_order
 */
#[Fillable(['name', 'slug', 'summary', 'description', 'benefits', 'icon', 'is_published', 'sort_order'])]
class Service extends Model
{
    use HasUniqueSlug;

    /** Íconos disponibles (nombres de lucide-react). */
    public const ICONS = ['Rocket', 'Globe', 'LayoutDashboard', 'Workflow', 'Smartphone', 'Sparkles', 'Database', 'ShoppingCart', 'CalendarCheck', 'Boxes'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['benefits' => 'array', 'is_published' => 'boolean'];
    }

    /**
     * @return BelongsToMany<Feature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class);
    }

    /**
     * @return HasMany<Plan, $this>
     */
    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }
}
