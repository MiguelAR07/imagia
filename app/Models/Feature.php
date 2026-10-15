<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Funcionalidad reutilizable («Formulario de contacto», «Gestión de usuarios»…).
 * Se define una vez y se asigna a servicios y planes. Si es módulo, también se vende
 * por separado con su precio (lo usa la calculadora de presupuesto).
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property bool $is_module
 * @property string|null $category
 * @property string|null $size
 * @property string|null $module_price
 * @property list<string>|null $goals
 * @property int $module_order
 */
#[Fillable(['name', 'description', 'is_module', 'category', 'size', 'module_price', 'goals', 'module_order'])]
class Feature extends Model
{
    public const CATEGORIES = [
        'clients' => 'Clientes y ventas',
        'operation' => 'Operación',
        'money' => 'Dinero',
        'communication' => 'Comunicación',
        'content' => 'Reportes y contenido',
        'automation' => 'Automatización',
    ];

    public const SIZES = ['S' => 'Pequeño', 'M' => 'Mediano', 'L' => 'Grande'];

    /** Tipos de proyecto a los que puede servir un módulo. */
    public const GOALS = [
        'website' => 'Páginas web',
        'management' => 'Software de gestión',
        'automation' => 'Automatizaciones',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['is_module' => 'boolean', 'module_price' => 'decimal:2', 'goals' => 'array'];
    }

    /**
     * Módulos que se pueden ofrecer públicamente (con precio).
     *
     * @param  Builder<Feature>  $query
     */
    public function scopeSellableModules(Builder $query): void
    {
        $query->where('is_module', true)->whereNotNull('module_price')->where('module_price', '>', 0);
    }

    /**
     * @return BelongsToMany<Plan, $this>
     */
    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class)->withPivot(['kind', 'extra_price_note', 'sort_order']);
    }

    /**
     * @return BelongsToMany<Service, $this>
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class);
    }
}
