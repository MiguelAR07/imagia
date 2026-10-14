<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Gasto del negocio. Con proyecto, cuenta para su rentabilidad; sin proyecto, es un gasto general.
 *
 * @property int $id
 * @property int|null $project_id
 * @property int|null $expense_category_id
 * @property string $description
 * @property string|null $vendor
 * @property string $amount
 * @property string $currency
 * @property Carbon $spent_on
 * @property bool $is_recurring
 * @property int|null $recorded_by
 */
#[Fillable(['project_id', 'expense_category_id', 'description', 'vendor', 'amount', 'currency', 'spent_on', 'is_recurring'])]
class Expense extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'spent_on' => 'date', 'is_recurring' => 'boolean'];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class)->withTrashed();
    }

    /**
     * @return BelongsTo<ExpenseCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }
}
