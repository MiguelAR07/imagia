<?php

namespace App\Http\Controllers\Admin\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Preguntas frecuentes generales del sitio. El asistente también responde con ellas.
 * (Las preguntas de cada plan se editan dentro del plan.)
 */
class FaqController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog/faqs', [
            'faqs' => Faq::query()->whereNull('faqable_type')->orderBy('sort_order')->orderBy('id')->get()
                ->map(fn (Faq $f) => $f->only(['id', 'question', 'answer', 'is_published'])),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Faq::query()->create([
            ...$this->validated($request),
            'sort_order' => (int) Faq::query()->whereNull('faqable_type')->max('sort_order') + 1,
        ]);

        return back();
    }

    public function update(Request $request, Faq $faq): RedirectResponse
    {
        abort_unless($faq->faqable_type === null, 404);
        $faq->update($this->validated($request));

        return back();
    }

    public function reorder(Request $request): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer', 'exists:faqs,id']]);

        DB::transaction(fn () => collect($data['ids'])->each(
            fn ($id, $order) => Faq::query()->whereKey($id)->whereNull('faqable_type')->update(['sort_order' => $order])
        ));

        return back();
    }

    public function destroy(Faq $faq): RedirectResponse
    {
        abort_unless($faq->faqable_type === null, 404);
        $faq->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string', 'max:5000'],
            'is_published' => ['boolean'],
        ]);
    }
}
