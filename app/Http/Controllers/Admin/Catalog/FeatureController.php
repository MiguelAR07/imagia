<?php

namespace App\Http\Controllers\Admin\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Feature;
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
            'features' => Feature::query()->withCount(['plans', 'services'])->orderBy('name')->get()
                ->map(fn (Feature $f) => $f->only(['id', 'name', 'description', 'plans_count', 'services_count'])),
        ]);
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
