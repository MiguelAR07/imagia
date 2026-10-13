<?php

namespace App\Http\Controllers\Admin\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog/services', [
            'services' => Service::query()->with('features:id')->withCount('plans')->orderBy('sort_order')->orderBy('id')->get()
                ->map(fn (Service $s) => [
                    ...$s->only(['id', 'name', 'slug', 'summary', 'description', 'icon', 'is_published', 'plans_count']),
                    'benefits' => $s->benefits ?? [],
                    'feature_ids' => $s->features->pluck('id'),
                ]),
            'features' => Feature::query()->orderBy('name')->get(['id', 'name']),
            'icons' => Service::ICONS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data) {
            $service = Service::query()->create([
                ...collect($data)->except('feature_ids')->all(),
                'slug' => Service::uniqueSlug($data['name']),
                'sort_order' => (int) Service::query()->max('sort_order') + 1,
            ]);
            $service->features()->sync($data['feature_ids'] ?? []);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio creado.']);

        return back();
    }

    public function update(Request $request, Service $service): RedirectResponse
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data, $service) {
            $service->update(collect($data)->except('feature_ids')->all());
            $service->features()->sync($data['feature_ids'] ?? []);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio actualizado.']);

        return back();
    }

    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer', 'exists:services,id']]);

        DB::transaction(fn () => collect($data['ids'])->each(
            fn ($id, $order) => Service::query()->whereKey($id)->update(['sort_order' => $order])
        ));

        return back();
    }

    public function destroy(Service $service): RedirectResponse
    {
        $service->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Servicio eliminado.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        // Las líneas de beneficios vacías se ignoran en vez de dar error.
        $request->merge([
            'benefits' => array_values(array_filter((array) $request->input('benefits', []), fn ($b) => filled($b))),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'summary' => ['required', 'string', 'max:300'],
            'description' => ['nullable', 'string', 'max:5000'],
            'benefits' => ['array', 'max:10'],
            'benefits.*' => ['required', 'string', 'max:160'],
            'icon' => ['nullable', Rule::in(Service::ICONS)],
            'is_published' => ['boolean'],
            'feature_ids' => ['array'],
            'feature_ids.*' => ['integer', 'exists:features,id'],
        ]);
        $data['benefits'] ??= [];

        return $data;
    }
}
