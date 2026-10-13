<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Plan comercial. El precio puede ser fijo, «desde» o solo por cotización.
 *
 * @property int $id
 * @property int|null $service_id
 * @property string $name
 * @property string $slug
 * @property string $summary
 * @property string|null $description
 * @property string $price_type
 * @property string|null $price
 * @property string $currency
 * @property string|null $estimated_time
 * @property string|null $limits
 * @property string|null $exclusions
 * @property list<array{name: string, note: string|null}>|null $addons
 * @property string|null $badge
 * @property bool $is_published
 * @property int $sort_order
 */
#[Fillable([
    'service_id', 'name', 'slug', 'summary', 'description', 'price_type', 'price', 'currency',
    'estimated_time', 'limits', 'exclusions', 'addons', 'badge', 'is_published', 'sort_order',
])]
class Plan extends Model
{
    use HasUniqueSlug;

    public const PRICE_TYPES = [
        'fixed' => 'Precio fijo',
        'from' => 'Desde',
        'quote' => 'Solo cotización',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'addons' => 'array',
            'is_published' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Service, $this>
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * @return BelongsToMany<Feature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class)
            ->withPivot(['kind', 'extra_price_note', 'sort_order'])
            ->orderByPivot('sort_order');
    }

    /**
     * @return MorphMany<Faq, $this>
     */
    public function faqs(): MorphMany
    {
        return $this->morphMany(Faq::class, 'faqable')->orderBy('sort_order');
    }

    /** ¿Está listo para publicarse? Un precio fijo o «desde» necesita valor. */
    public function hasValidPrice(): bool
    {
        return $this->price_type === 'quote' || ($this->price !== null && (float) $this->price > 0);
    }
}
