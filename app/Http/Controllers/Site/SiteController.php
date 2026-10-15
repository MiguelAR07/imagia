<?php

namespace App\Http\Controllers\Site;

use App\Assistant\Assistant;
use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use App\Models\Service;
use App\Support\Settings;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Base de las páginas públicas: agrega los datos del sitio (contacto, menú) y
 * las etiquetas para buscadores, que se generan en el servidor.
 */
abstract class SiteController extends Controller
{
    /**
     * @param  array<string, mixed>  $props
     */
    protected function page(string $component, array $props, string $title, string $description, ?string $image = null, bool $noindex = false): Response
    {
        $brand = Settings::get(Settings::BRAND);
        $contact = Settings::get(Settings::CONTACT);
        $fullTitle = $title === '' ? "{$brand['name']} · {$brand['tagline']}" : "{$title} · {$brand['name']}";

        return Inertia::render($component, [
            ...$props,
            'site' => [
                'contact' => collect($contact)->only([
                    'email', 'phone', 'whatsapp', 'whatsapp_message', 'city',
                    'instagram', 'facebook', 'linkedin', 'tiktok', 'github',
                ]),
                'services' => Service::query()->where('is_published', true)->orderBy('sort_order')->get(['name', 'slug']),
                'logo_parts' => $brand['logo_parts'],
                'origin' => $brand['origin'],
                'assistant' => Assistant::enabled(),
                // Proyectos visibles del portafolio, para enlazar ejemplos reales en las explicaciones.
                'portfolio' => PortfolioItem::query()->publiclyVisible()->whereNotNull('cover_path')->pluck('slug'),
            ],
            'seoTitle' => $fullTitle,
        ])->withViewData([
            'forceDark' => true,
            'meta' => [
                'title' => $fullTitle,
                'description' => mb_strimwidth(strip_tags($description), 0, 160, '…'),
                'url' => url()->current(),
                'site_name' => $brand['name'],
                'image' => $image,
                'noindex' => $noindex,
            ],
        ]);
    }
}
