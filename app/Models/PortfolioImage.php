<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $portfolio_item_id
 * @property string $path
 * @property string|null $caption
 * @property int $sort_order
 */
#[Fillable(['path', 'caption', 'part', 'sort_order'])]
class PortfolioImage extends Model
{
    protected static function booted(): void
    {
        static::deleted(fn (PortfolioImage $image) => Storage::disk(config('filesystems.media'))->delete($image->path));
    }

    /**
     * @return BelongsTo<PortfolioItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(PortfolioItem::class, 'portfolio_item_id')->withTrashed();
    }
}
