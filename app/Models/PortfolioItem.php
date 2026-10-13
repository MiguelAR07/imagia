<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Proyecto del portafolio. Solo es público si está publicado y no es confidencial.
 *
 * @property int $id
 * @property int|null $client_id
 * @property string $title
 * @property string $slug
 * @property string|null $client_display_name
 * @property bool $client_name_authorized
 * @property string $category
 * @property string|null $cover_path
 * @property string $summary
 * @property string|null $problem
 * @property string|null $solution
 * @property list<string>|null $highlights
 * @property Carbon|null $completed_on
 * @property string|null $public_url
 * @property string $status
 * @property bool $is_confidential
 * @property bool $is_featured
 * @property int $sort_order
 */
#[Fillable([
    'client_id', 'title', 'slug', 'client_display_name', 'client_name_authorized', 'category', 'cover_path', 'summary',
    'problem', 'solution', 'highlights', 'completed_on', 'public_url', 'status', 'is_confidential',
    'is_featured', 'sort_order',
])]
class PortfolioItem extends Model
{
    use HasUniqueSlug, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'client_name_authorized' => 'boolean',
            'highlights' => 'array',
            'completed_on' => 'date',
            'is_confidential' => 'boolean',
            'is_featured' => 'boolean',
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
     * @return HasMany<PortfolioImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(PortfolioImage::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * @return BelongsToMany<Technology, $this>
     */
    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class)->orderBy('name');
    }

    /**
     * @return HasMany<Testimonial, $this>
     */
    public function testimonials(): HasMany
    {
        return $this->hasMany(Testimonial::class);
    }

    /** ¿Lo puede ver cualquier visitante? */
    public function isPublic(): bool
    {
        return $this->status === 'published' && ! $this->is_confidential && ! $this->trashed();
    }

    /**
     * Lo que se puede mostrar en el sitio público.
     *
     * @param  Builder<PortfolioItem>  $query
     */
    public function scopePubliclyVisible(Builder $query): void
    {
        $query->where('status', 'published')->where('is_confidential', false);
    }

    /** Nombre del cliente solo si autorizó mostrarlo. */
    public function publicClientName(): ?string
    {
        return $this->client_name_authorized ? ($this->client_display_name ?: $this->client?->name) : null;
    }
}
