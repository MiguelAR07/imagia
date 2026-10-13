<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Testimonio real de un cliente. Solo se publica si tiene fecha de autorización.
 *
 * @property int $id
 * @property int|null $portfolio_item_id
 * @property int|null $client_id
 * @property string $author_name
 * @property string|null $author_role
 * @property string $quote
 * @property Carbon|null $authorized_at
 * @property string|null $authorization_note
 * @property bool $is_published
 */
#[Fillable(['client_id', 'author_name', 'author_role', 'quote', 'authorized_at', 'authorization_note', 'is_published'])]
class Testimonial extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['authorized_at' => 'datetime', 'is_published' => 'boolean'];
    }

    /**
     * @return BelongsTo<PortfolioItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(PortfolioItem::class, 'portfolio_item_id');
    }
}
