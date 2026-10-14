<?php

namespace App\Support;

use App\Models\Faq;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\PortfolioImage;
use App\Models\PortfolioItem;
use App\Models\Project;
use App\Models\Service;
use App\Models\Testimonial;
use Illuminate\Support\Collection;

/**
 * Lo que el sitio público puede mostrar. Todo pasa por aquí para que ningún
 * borrador, precio sin definir o proyecto confidencial se filtre por error.
 */
class PublicCatalog
{
    /** Pasos del proceso de trabajo (sección «Cómo trabajo»). */
    public const PROCESS = [
        ['title' => 'Descubrimiento', 'text' => 'Conversamos sobre tu negocio, lo que quieres lograr y cómo trabajas hoy.'],
        ['title' => 'Definición de la solución', 'text' => 'Te proponemos la solución adecuada, con su alcance, tiempos y valor por escrito.'],
        ['title' => 'Diseño y planificación', 'text' => 'Diseñamos cómo se verá y organizamos el trabajo en etapas con fechas claras.'],
        ['title' => 'Desarrollo', 'text' => 'Construimos por partes y te mostramos avances para que opines a tiempo.'],
        ['title' => 'Pruebas y validación', 'text' => 'Revisamos todo contigo antes de publicar: funciones, celulares y seguridad.'],
        ['title' => 'Entrega y soporte', 'text' => 'Publicamos, te enseñamos a usarlo y te acompañamos según el soporte acordado.'],
    ];

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function services(): Collection
    {
        return Service::query()->where('is_published', true)->with('features:id,name')
            ->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (Service $s) => self::service($s));
    }

    /**
     * @return array<string, mixed>
     */
    public static function service(Service $s): array
    {
        return [
            ...$s->only(['id', 'name', 'slug', 'summary', 'description', 'icon']),
            'benefits' => $s->benefits ?? [],
            'features' => $s->features->pluck('name'),
        ];
    }

    /**
     * Planes publicados. Un plan «fijo» o «desde» sin precio no debería estar publicado
     * (el panel lo impide), pero si ocurre se muestra como «según cotización».
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function plans(?int $serviceId = null): Collection
    {
        return Plan::query()->where('is_published', true)
            ->when($serviceId, fn ($q) => $q->where('service_id', $serviceId))
            ->with(['features', 'faqs' => fn ($q) => $q->where('is_published', true)])
            ->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (Plan $p) => [
                ...$p->only(['id', 'name', 'slug', 'summary', 'description', 'estimated_time', 'limits', 'exclusions', 'badge']),
                'price_type' => $p->hasValidPrice() ? $p->price_type : 'quote',
                'price' => $p->hasValidPrice() ? $p->price : null,
                'currency' => $p->currency,
                'included' => $p->features->where('pivot.kind', 'included')->pluck('name')->values(),
                'optional' => $p->features->where('pivot.kind', 'optional')
                    ->map(fn (Feature $f) => ['name' => $f->name, 'note' => $f->pivot->extra_price_note])->values(),
                'addons' => $p->addons ?? [],
                'faqs' => $p->faqs->map(fn (Faq $f) => $f->only(['question', 'answer'])),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function generalFaqs(): Collection
    {
        return Faq::query()->whereNull('faqable_type')->where('is_published', true)
            ->orderBy('sort_order')->get()
            ->map(fn (Faq $f) => $f->only(['question', 'answer']));
    }

    /**
     * Precio de un plan publicado en texto, tal como está configurado (nunca inventado).
     *
     * @param  array<string, mixed>  $plan  Un elemento de plans()
     */
    public static function priceText(array $plan): string
    {
        $amount = fn () => '$'.number_format((float) $plan['price'], 0, ',', '.')." {$plan['currency']}";

        return match ($plan['price_type']) {
            'fixed' => $amount(),
            'from' => 'desde '.$amount(),
            default => 'según cotización',
        };
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public static function projects(?string $category = null, bool $featuredOnly = false, ?int $limit = null): Collection
    {
        return PortfolioItem::query()->publiclyVisible()->whereNotNull('cover_path')
            ->with('technologies:id,name')
            ->when($category, fn ($q) => $q->where('category', $category))
            ->when($featuredOnly, fn ($q) => $q->where('is_featured', true))
            ->orderBy('sort_order')->orderByDesc('completed_on')->orderByDesc('id')
            ->when($limit, fn ($q) => $q->limit($limit))
            ->get()
            ->map(fn (PortfolioItem $i) => self::projectCard($i));
    }

    /**
     * @return array<string, mixed>
     */
    public static function projectCard(PortfolioItem $i): array
    {
        return [
            'title' => $i->title,
            'slug' => $i->slug,
            'category' => $i->category,
            'category_label' => Project::CATEGORIES[$i->category] ?? $i->category,
            'summary' => $i->summary,
            'cover_url' => route('portfolio.cover', $i),
            'technologies' => $i->technologies->pluck('name'),
            'year' => $i->completed_on?->year,
            // «Sitio web · Panel administrativo»: lo que incluye el sistema entregado.
            'parts' => collect($i->parts ?? [])->map(fn (array $p) => PortfolioItem::PART_TYPES[$p['type']] ?? $p['type'])->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function projectDetail(PortfolioItem $i): array
    {
        $i->loadMissing(['images', 'technologies', 'testimonials', 'client:id,name']);

        return [
            ...self::projectCard($i),
            'client' => $i->publicClientName(),
            'problem' => $i->problem,
            'solution' => $i->solution,
            'highlights' => $i->highlights ?? [],
            'public_url' => $i->public_url,
            'completed_on' => $i->completed_on?->toDateString(),
            // Imágenes que no pertenecen a una parte definida van a la galería general.
            'images' => $i->images
                ->filter(fn (PortfolioImage $img) => $img->part === null || ! collect($i->parts ?? [])->contains('type', $img->part))
                ->map(fn (PortfolioImage $img) => self::image($img))->values(),
            'parts' => collect($i->parts ?? [])->map(fn (array $p) => [
                'type' => $p['type'],
                'label' => PortfolioItem::PART_TYPES[$p['type']] ?? $p['type'],
                'title' => $p['title'] ?? null,
                'description' => $p['description'] ?? null,
                'features' => $p['features'] ?? [],
                'images' => $i->images->where('part', $p['type'])->map(fn (PortfolioImage $img) => self::image($img))->values(),
            ])->values(),
            // Solo testimonios publicados y con autorización registrada.
            'testimonials' => $i->testimonials
                ->filter(fn (Testimonial $t) => $t->is_published && $t->authorized_at !== null)
                ->map(fn (Testimonial $t) => $t->only(['author_name', 'author_role', 'quote']))
                ->values(),
        ];
    }

    /**
     * @return array{url: string, caption: string|null}
     */
    private static function image(PortfolioImage $img): array
    {
        return ['url' => route('portfolio.image', $img), 'caption' => $img->caption];
    }

    /**
     * Categorías que tienen al menos un proyecto público (para los filtros).
     *
     * @return list<array{value: string, label: string}>
     */
    public static function projectCategories(): array
    {
        return PortfolioItem::query()->publiclyVisible()->whereNotNull('cover_path')
            ->distinct()->pluck('category')
            ->map(fn (string $c) => ['value' => $c, 'label' => Project::CATEGORIES[$c] ?? $c])
            ->sortBy('label')->values()->all();
    }
}
