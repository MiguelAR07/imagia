<?php

namespace App\Support;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Support\Collection;

/**
 * Calculadora «tengo tanto, ¿qué podemos hacer?». Con un presupuesto y un tipo de proyecto
 * propone el mejor plan publicado que alcanza y los módulos que caben con lo que sobra.
 * Solo usa precios publicados; el resultado es orientativo y se confirma con una cotización.
 */
class BudgetPlanner
{
    /** Tipo de proyecto => [etiqueta, servicio del catálogo]. */
    public const GOALS = [
        'landing' => ['Una landing page', 'landing-pages'],
        'website' => ['Una página web', 'paginas-web'],
        'management' => ['Un sistema de gestión', 'software-de-gestion'],
        'automation' => ['Automatizar procesos', 'automatizacion-empresarial'],
    ];

    public const MIN_BUDGET = 300000;

    public const MAX_BUDGET = 500000000;

    /** Módulos que se sugieren como máximo, para que la propuesta sea clara. */
    private const MAX_MODULES = 6;

    /**
     * @return array<string, mixed>
     */
    public static function plan(int $budget, string $goal): array
    {
        $plans = self::plansFor($goal);
        $plan = $plans->filter(fn (Plan $p) => (float) $p->price <= $budget)->sortByDesc(fn (Plan $p) => (float) $p->price)->first();

        if ($plan === null) {
            $cheapest = $plans->sortBy(fn (Plan $p) => (float) $p->price)->first();

            return [
                'goal' => $goal,
                'budget' => $budget,
                'fits' => false,
                'plan' => null,
                'modules' => [],
                'total' => 0,
                'remaining' => $budget,
                'shortfall' => $cheapest ? ['plan' => self::planArray($cheapest), 'missing' => (float) $cheapest->price - $budget] : null,
                'next' => null,
                'alternatives' => self::alternatives($budget, $goal),
            ];
        }

        $remaining = $budget - (float) $plan->price;
        $included = $plan->features->where('pivot.kind', 'included')->pluck('id');
        $candidates = self::modulesFor($goal)->reject(fn (Feature $f) => $included->contains($f->id))->values();

        $chosen = collect();
        foreach ($candidates as $module) {
            if ($chosen->count() < self::MAX_MODULES && (float) $module->module_price <= $remaining) {
                $chosen->push($module);
                $remaining -= (float) $module->module_price;
            }
        }

        // «Con un poco más…»: el siguiente plan o el módulo pendiente más económico.
        $nextPlan = $plans->filter(fn (Plan $p) => (float) $p->price > (float) $plan->price)->sortBy(fn (Plan $p) => (float) $p->price)->first();
        $nextModule = $candidates->reject(fn (Feature $f) => $chosen->contains('id', $f->id))->sortBy(fn (Feature $f) => (float) $f->module_price)->first();
        $next = match (true) {
            $nextModule !== null && $chosen->count() < self::MAX_MODULES => ['name' => $nextModule->name, 'kind' => 'module', 'extra' => (float) $nextModule->module_price - $remaining],
            $nextPlan !== null => ['name' => $nextPlan->name, 'kind' => 'plan', 'extra' => (float) $nextPlan->price - $budget],
            default => null,
        };

        return [
            'goal' => $goal,
            'budget' => $budget,
            'fits' => true,
            'plan' => self::planArray($plan),
            'modules' => $chosen->map(fn (Feature $f) => self::moduleArray($f))->values()->all(),
            'total' => $budget - $remaining,
            'remaining' => $remaining,
            'shortfall' => null,
            'next' => $next,
            'alternatives' => [],
        ];
    }

    /**
     * Texto para la solicitud de cotización con la propuesta armada.
     *
     * @param  array<string, mixed>  $result
     */
    public static function summary(array $result): string
    {
        $lines = ['Usé la calculadora con un presupuesto de $'.number_format($result['budget'], 0, ',', '.').' para: '.mb_strtolower(self::GOALS[$result['goal']][0]).'.'];

        if ($result['plan']) {
            $lines[] = "Plan sugerido: {$result['plan']['name']}.";
        }
        if ($result['modules'] !== []) {
            $lines[] = 'Módulos: '.collect($result['modules'])->pluck('name')->implode(', ').'.';
        }

        return implode("\n", $lines);
    }

    /**
     * @return Collection<int, Plan>
     */
    private static function plansFor(string $goal): Collection
    {
        return Plan::query()->where('is_published', true)->whereIn('price_type', ['from', 'fixed'])
            ->where('price', '>', 0)
            ->whereHas('service', fn ($q) => $q->where('slug', self::GOALS[$goal][1])->where('is_published', true))
            ->with('features')->get();
    }

    /**
     * Módulos publicados que sirven para este tipo de proyecto, en el orden definido en el panel.
     *
     * @return Collection<int, Feature>
     */
    private static function modulesFor(string $goal): Collection
    {
        return Feature::query()->sellableModules()->orderBy('module_order')->orderBy('id')->get()
            ->filter(fn (Feature $f) => in_array($goal, $f->goals ?? [], true))->values();
    }

    /**
     * Otras líneas que sí alcanzan con este presupuesto.
     *
     * @return list<array<string, mixed>>
     */
    private static function alternatives(int $budget, string $goal): array
    {
        return collect(array_keys(self::GOALS))->reject(fn ($g) => $g === $goal)
            ->map(function (string $g) use ($budget) {
                $plan = self::plansFor($g)->filter(fn (Plan $p) => (float) $p->price <= $budget)->sortByDesc(fn (Plan $p) => (float) $p->price)->first();

                return $plan ? ['goal' => $g, 'label' => self::GOALS[$g][0], 'plan' => self::planArray($plan)] : null;
            })->filter()->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    private static function planArray(Plan $plan): array
    {
        return [
            'slug' => $plan->slug,
            'name' => $plan->name,
            'summary' => $plan->summary,
            'price' => (float) $plan->price,
            'estimated_time' => $plan->estimated_time,
            'included' => $plan->features->where('pivot.kind', 'included')->pluck('name')->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function moduleArray(Feature $f): array
    {
        return ['id' => $f->id, 'name' => $f->name, 'description' => $f->description, 'price' => (float) $f->module_price, 'size' => $f->size];
    }
}
