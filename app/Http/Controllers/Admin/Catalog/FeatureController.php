<?php

namespace App\Http\Controllers\Admin\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Support\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Catálogo único de funcionalidades: se escriben una vez y se reutilizan en planes y servicios.
 */
class FeatureController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog/features', [
            'features' => Feature::query()->withCount(['plans', 'services'])
                ->orderByDesc('is_module')->orderBy('module_order')->orderBy('name')->get()
                ->map(fn (Feature $f) => [
                    ...$f->only(['id', 'name', 'description', 'plans_count', 'services_count', 'is_module', 'category', 'size', 'module_price', 'module_order']),
                    'goals' => $f->goals ?? [],
                ]),
            'options' => [
                'categories' => Options::from(Feature::CATEGORIES),
                'sizes' => Options::from(Feature::SIZES),
                'goals' => Options::from(Feature::GOALS),
            ],
        ]);
    }

    /**
     * Configura la funcionalidad como módulo que se vende por separado (calculadora y cotizaciones).
     */
    public function updateModule(Request $request, Feature $feature): RedirectResponse
    {
        $data = $request->validate([
            'is_module' => ['required', 'boolean'],
            'category' => ['nullable', 'required_if_accepted:is_module', Rule::in(array_keys(Feature::CATEGORIES))],
            'size' => ['nullable', Rule::in(array_keys(Feature::SIZES))],
            'module_price' => ['nullable', 'required_if_accepted:is_module', 'numeric', 'min:0', 'max:999999999'],
            'goals' => ['array'],
            'goals.*' => [Rule::in(array_keys(Feature::GOALS))],
            'module_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ], [
            'module_price.required_if_accepted' => 'Un módulo necesita precio.',
            'category.required_if_accepted' => 'Elige la categoría del módulo.',
        ]);

        $feature->update([...$data, 'goals' => array_values(array_unique($data['goals'] ?? [])), 'module_order' => $data['module_order'] ?? 0]);
        Inertia::flash('toast', ['type' => 'success', 'message' => $feature->is_module ? 'Módulo actualizado.' : 'Ya no se ofrece como módulo.']);

        return back();
    }

    public function store(Request $request): RedirectResponse
    {
        Feature::query()->create($request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('features', 'name')],
            'description' => ['nullable', 'string', 'max:300'],
        ]));

        return back();
    }

    public function update(Request $request, Feature $feature): RedirectResponse
    {
        $feature->update($request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('features', 'name')->ignore($feature)],
            'description' => ['nullable', 'string', 'max:300'],
        ]));

        return back();
    }

    public function destroy(Feature $feature): RedirectResponse
    {
        $feature->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Funcionalidad eliminada de todos los planes y servicios.']);

        return back();
    }
}
