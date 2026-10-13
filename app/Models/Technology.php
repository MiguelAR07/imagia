<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $name
 */
#[Fillable(['name'])]
class Technology extends Model
{
    /**
     * @return BelongsToMany<PortfolioItem, $this>
     */
    public function portfolioItems(): BelongsToMany
    {
        return $this->belongsToMany(PortfolioItem::class);
    }
}
