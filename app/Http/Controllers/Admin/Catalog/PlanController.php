<?php

namespace App\Http\Controllers\Admin\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PlanRequest;
use App\Models\Faq;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Service;
use App\Support\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog/plans/index', [
            'plans' => Plan::query()->with('service:id,name')->withCount('features')
                ->orderBy('sort_order')->orderBy('id')->get()
                ->map(fn (Plan $p) => [
                    ...$p->only(['id', 'name', 'summary', 'price_type', 'price', 'currency', 'estimated_time', 'badge', 'is_published', 'features_count']),
                    'service' => $p->service?->name,
                    'price_ready' => $p->hasValidPrice(),
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/catalog/plans/form', [
            'plan' => null,
            ...$this->formOptions(),
        ]);
    }

    public function store(PlanRequest $request): RedirectResponse
    {
        $plan = DB::transaction(function () use ($request) {
            $data = $request->validated();
            $plan = Plan::query()->create([
                ...$this->planFields($data),
                'slug' => Plan::uniqueSlug($data['name']),
                'sort_order' => (int) Plan::query()->max('sort_order') + 1,
            ]);
            $this->syncRelations($plan, $data);

            return $plan;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => $plan->is_published ? 'Plan creado y publicado.' : 'Plan guardado como borrador.']);

        return to_route('admin.catalog.plans.edit', $plan);
    }

    public function edit(Plan $plan): Response
    {
        $plan->load(['features', 'faqs']);

        return Inertia::render('admin/catalog/plans/form', [
            'plan' => [
                ...$plan->only(['id', 'name', 'slug', 'summary', 'description', 'service_id', 'price_type', 'price', 'currency', 'estimated_time', 'limits', 'exclusions', 'badge', 'is_published']),
                'addons' => $plan->addons ?? [],
                'features' => $plan->features->map(fn (Feature $f) => [
                    'feature_id' => $f->id,
                    'kind' => $f->pivot->kind,
                    'extra_price_note' => $f->pivot->extra_price_note,
                ]),
                'faqs' => $plan->faqs->map(fn (Faq $f) => $f->only(['question', 'answer'])),
            ],
            ...$this->formOptions(),
        ]);
    }

    public function update(PlanRequest $request, Plan $plan): RedirectResponse
    {
        DB::transaction(function () use ($request, $plan) {
            $data = $request->validated();
            $plan->update($this->planFields($data));
            $this->syncRelations($plan, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan actualizado.']);

        return back();
    }

    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer', 'exists:plans,id']]);

        DB::transaction(fn () => collect($data['ids'])->each(
            fn ($id, $order) => Plan::query()->whereKey($id)->update(['sort_order' => $order])
        ));

        return back();
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        DB::transaction(function () use ($plan) {
            $plan->faqs()->delete();
            $plan->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Plan eliminado.']);

        return to_route('admin.catalog.plans.index');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function planFields(array $data): array
    {
        return collect($data)->except(['features', 'faqs'])->all() + ['addons' => []];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncRelations(Plan $plan, array $data): void
    {
        $plan->features()->sync(collect($data['features'] ?? [])->mapWithKeys(fn ($f, $i) => [
            $f['feature_id'] => [
                'kind' => $f['kind'],
                'extra_price_note' => $f['kind'] === 'optional' ? ($f['extra_price_note'] ?? null) : null,
                'sort_order' => $i,
            ],
        ])->all());

        $plan->faqs()->delete();
        foreach (array_values($data['faqs'] ?? []) as $i => $faq) {
            $plan->faqs()->create([...$faq, 'is_published' => true, 'sort_order' => $i]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'services' => Service::query()->orderBy('sort_order')->get(['id', 'name'])
                ->map(fn (Service $s) => ['value' => (string) $s->id, 'label' => $s->name]),
            'features' => Feature::query()->orderBy('name')->get(['id', 'name']),
            'price_types' => Options::from(Plan::PRICE_TYPES),
        ];
    }
}
