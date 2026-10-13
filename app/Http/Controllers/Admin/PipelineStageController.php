<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PipelineStage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Etapas del embudo comercial: renombrar, agregar, ordenar y eliminar (si están vacías).
 */
class PipelineStageController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateStage($request);

        PipelineStage::query()->create([
            ...$data,
            'slug' => $this->uniqueSlug($data['name']),
            'sort_order' => (int) PipelineStage::query()->max('sort_order') + 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Etapa agregada.']);

        return back();
    }

    public function update(Request $request, PipelineStage $stage): RedirectResponse
    {
        $stage->update($this->validateStage($request));

        return back();
    }

    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:pipeline_stages,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['ids'] as $order => $id) {
                PipelineStage::query()->whereKey($id)->update(['sort_order' => $order]);
            }
        });

        return back();
    }

    public function destroy(PipelineStage $stage): RedirectResponse
    {
        if ($stage->leads()->withTrashed()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "La etapa «{$stage->name}» tiene prospectos. Muévelos a otra etapa antes de eliminarla."]);

            return back();
        }

        $stage->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Etapa eliminada.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateStage(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'color' => ['required', Rule::in(PipelineStage::COLORS)],
            'kind' => ['required', Rule::in(['open', 'won', 'lost'])],
        ]);

        return [
            'name' => $data['name'],
            'color' => $data['color'],
            'is_won' => $data['kind'] === 'won',
            'is_lost' => $data['kind'] === 'lost',
        ];
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'etapa';
        $slug = $base;
        $i = 2;

        while (PipelineStage::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
