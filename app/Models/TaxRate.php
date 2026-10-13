<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Impuesto configurable (ej.: IVA 19 %). El negocio define cuáles aplican.
 *
 * @property int $id
 * @property string $name
 * @property string $rate
 * @property bool $is_default
 */
#[Fillable(['name', 'rate', 'is_default'])]
class TaxRate extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['rate' => 'decimal:2', 'is_default' => 'boolean'];
    }
}
