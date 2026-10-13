<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PortfolioRequest;
use App\Models\Client;
use App\Models\PortfolioImage;
use App\Models\PortfolioItem;
use App\Models\Project;
use App\Models\Technology;
use App\Models\Testimonial;
use App\Support\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    private const IMAGE_RULES = ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

    public function index(Request $request): Response
    {
        $status = $request->validate(['status' => ['nullable', 'in:published,draft,confidential,archived']])['status'] ?? '';

        $items = PortfolioItem::query()
            ->withCount('images')
            ->when($status === 'archived', fn ($q) => $q->onlyTrashed())
            ->when($status === 'published', fn ($q) => $q->publiclyVisible())
            ->when($status === 'draft', fn ($q) => $q->where('status', 'draft'))
            ->when($status === 'confidential', fn ($q) => $q->where('is_confidential', true))
            ->orderBy('sort_order')->orderByDesc('completed_on')->orderByDesc('id')
            ->get()
            ->map(fn (PortfolioItem $i) => [
                ...$i->only(['id', 'title', 'category', 'summary', 'status', 'is_confidential', 'is_featured', 'images_count']),
                'cover_url' => $i->cover_path ? route('portfolio.cover', $i) : null,
                'completed_on' => $i->completed_on?->toDateString(),
                'is_public' => $i->isPublic(),
                'archived' => $i->trashed(),
            ]);

        return Inertia::render('admin/portfolio/index', [
            'items' => $items,
            'filters' => ['status' => $status],
            'categories' => Options::from(Project::CATEGORIES),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/portfolio/form', ['item' => null, ...$this->formOptions()]);
    }

    public function store(PortfolioRequest $request): RedirectResponse
    {
        $item = DB::transaction(function () use ($request) {
            $data = $request->validated();
            $item = PortfolioItem::query()->create([
                ...$this->itemFields($data),
                'slug' => PortfolioItem::uniqueSlug($data['title']),
                'status' => 'draft',
            ]);
            $this->syncRelations($item, $data);

            return $item;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto guardado como borrador. Agrega la portada y publícalo cuando esté listo.']);

        return to_route('admin.portfolio.edit', $item);
    }

    public function edit(PortfolioItem $item): Response
    {
        $item->load(['images', 'technologies', 'testimonials']);

        return Inertia::render('admin/portfolio/form', [
            'item' => [
                ...$item->only(['id', 'title', 'slug', 'client_id', 'client_display_name', 'client_name_authorized', 'category', 'summary', 'problem', 'solution', 'public_url', 'status', 'is_confidential', 'is_featured']),
                'highlights' => $item->highlights ?? [],
                'completed_on' => $item->completed_on?->toDateString(),
                'technologies' => $item->technologies->pluck('name'),
                'cover_url' => $item->cover_path ? route('portfolio.cover', $item).'?v='.$item->updated_at?->timestamp : null,
                'images' => $item->images->map(fn (PortfolioImage $img) => [
                    'id' => $img->id,
                    'url' => route('portfolio.image', $img),
                    'caption' => $img->caption,
                ]),
                'testimonials' => $item->testimonials->map(fn (Testimonial $t) => [
                    ...$t->only(['author_name', 'author_role', 'quote', 'authorization_note', 'is_published']),
                    'authorized_at' => $t->authorized_at?->toDateString(),
                ]),
                'is_public' => $item->isPublic(),
            ],
            ...$this->formOptions(),
        ]);
    }

    public function update(PortfolioRequest $request, PortfolioItem $item): RedirectResponse
    {
        DB::transaction(function () use ($request, $item) {
            $data = $request->validated();
            $item->update($this->itemFields($data));
            $this->syncRelations($item, $data);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto del portafolio actualizado.']);

        return back();
    }

    /** Publicar o despublicar. Un proyecto sin portada no se publica. */
    public function publish(Request $request, PortfolioItem $item): RedirectResponse
    {
        $publish = $request->validate(['published' => ['required', 'boolean']])['published'];

        if ($publish && $item->cover_path === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Agrega una imagen de portada antes de publicar.']);

            return back();
        }

        $item->update(['status' => $publish ? 'published' : 'draft']);

        $message = match (true) {
            ! $publish => 'Proyecto despublicado.',
            $item->is_confidential => 'Quedó publicado, pero es confidencial: no se mostrará en el sitio.',
            default => 'Proyecto publicado en el sitio.',
        };
        Inertia::flash('toast', ['type' => $publish && $item->is_confidential ? 'warning' : 'success', 'message' => $message]);

        return back();
    }

    /** Copia el proyecto como borrador (sin imágenes ni testimonios, que son propios de cada caso). */
    public function duplicate(PortfolioItem $item): RedirectResponse
    {
        $copy = DB::transaction(function () use ($item) {
            $copy = $item->replicate(['slug', 'cover_path', 'status', 'is_featured']);
            $copy->title = $item->title.' (copia)';
            $copy->slug = PortfolioItem::uniqueSlug($copy->title);
            $copy->status = 'draft';
            $copy->is_featured = false;
            $copy->save();
            $copy->technologies()->sync($item->technologies()->pluck('technologies.id'));

            return $copy;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Copia creada como borrador.']);

        return to_route('admin.portfolio.edit', $copy);
    }

    public function destroy(PortfolioItem $item): RedirectResponse
    {
        $item->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto eliminado del portafolio.']);

        return to_route('admin.portfolio.index');
    }

    public function restore(PortfolioItem $item): RedirectResponse
    {
        $item->restore();
        $item->update(['status' => 'draft']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto restaurado como borrador.']);

        return to_route('admin.portfolio.edit', $item);
    }

    /* ----------------------------------------------------------- Imágenes */

    public function uploadCover(Request $request, PortfolioItem $item): RedirectResponse
    {
        $request->validate(['image' => self::IMAGE_RULES], $this->imageMessages());

        $old = $item->cover_path;
        $item->update(['cover_path' => $request->file('image')->store("portfolio/{$item->id}", 'local')]);

        if ($old) {
            Storage::disk('local')->delete($old);
        }

        return back();
    }

    public function uploadImages(Request $request, PortfolioItem $item): RedirectResponse
    {
        $request->validate(['images' => ['required', 'array', 'max:12'], 'images.*' => self::IMAGE_RULES], $this->imageMessages('images.*'));

        $order = (int) $item->images()->max('sort_order');
        foreach ($request->file('images') as $file) {
            $item->images()->create([
                'path' => $file->store("portfolio/{$item->id}", 'local'),
                'sort_order' => ++$order,
            ]);
        }

        return back();
    }

    public function destroyImage(PortfolioItem $item, PortfolioImage $image): RedirectResponse
    {
        $image->delete();

        return back();
    }

    /**
     * @return array<string, string>
     */
    private function imageMessages(string $field = 'image'): array
    {
        return [
            "{$field}.image" => 'El archivo debe ser una imagen.',
            "{$field}.mimes" => 'Usa imágenes JPG, PNG o WebP.',
            "{$field}.max" => 'Cada imagen puede pesar máximo 5 MB.',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function itemFields(array $data): array
    {
        return collect($data)->except(['technologies', 'testimonials'])->all() + ['highlights' => []];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncRelations(PortfolioItem $item, array $data): void
    {
        // Reutiliza la tecnología aunque cambien mayúsculas («Laravel» = «laravel»).
        $ids = collect($data['technologies'] ?? [])
            ->unique(fn (string $name) => mb_strtolower($name))
            ->map(fn (string $name) => Technology::query()->whereRaw('lower(name) = ?', [mb_strtolower($name)])->value('id')
                ?? Technology::query()->create(['name' => $name])->id);
        $item->technologies()->sync($ids);

        $item->testimonials()->delete();
        foreach ($data['testimonials'] ?? [] as $t) {
            $item->testimonials()->create([...$t, 'client_id' => $item->client_id]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'categories' => Options::from(Project::CATEGORIES),
            'clients' => Client::query()->orderBy('name')->get(['id', 'name'])
                ->map(fn (Client $c) => ['value' => (string) $c->id, 'label' => $c->name]),
            'technologies' => Technology::query()->orderBy('name')->pluck('name'),
        ];
    }
}
