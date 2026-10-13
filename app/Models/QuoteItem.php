<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $quote_id
 * @property string $description
 * @property string|null $details
 * @property string $quantity
 * @property string $unit_price
 * @property string $discount_percent
 * @property int|null $tax_rate_id
 * @property int $sort_order
 */
#[Fillable(['description', 'details', 'quantity', 'unit_price', 'discount_percent', 'tax_rate_id', 'sort_order'])]
class QuoteItem extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'discount_percent' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<TaxRate, $this>
     */
    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class);
    }
}
