<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\PortfolioItem;
use App\Models\Service;
use Illuminate\Http\Response;

/**
 * Mapa del sitio para buscadores: solo páginas públicas y contenido publicado.
 */
class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $urls = collect([
            ['loc' => route('home'), 'priority' => '1.0'],
            ['loc' => route('site.services'), 'priority' => '0.9'],
            ['loc' => route('site.projects'), 'priority' => '0.9'],
            ['loc' => route('site.plans'), 'priority' => '0.9'],
            ['loc' => route('site.process'), 'priority' => '0.6'],
            ['loc' => route('site.quote'), 'priority' => '0.8'],
            ['loc' => route('site.contact'), 'priority' => '0.7'],
            ['loc' => route('site.support'), 'priority' => '0.3'],
        ])
            ->merge(Service::query()->where('is_published', true)->get(['slug', 'updated_at'])
                ->map(fn (Service $s) => ['loc' => route('site.service', $s->slug), 'lastmod' => $s->updated_at?->toDateString(), 'priority' => '0.8']))
            ->merge(PortfolioItem::query()->publiclyVisible()->whereNotNull('cover_path')->get(['slug', 'updated_at'])
                ->map(fn (PortfolioItem $p) => ['loc' => route('site.project', $p->slug), 'lastmod' => $p->updated_at?->toDateString(), 'priority' => '0.7']));

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($urls as $u) {
            $xml .= '<url><loc>'.e($u['loc']).'</loc>'
                .(isset($u['lastmod']) ? '<lastmod>'.$u['lastmod'].'</lastmod>' : '')
                .'<priority>'.$u['priority'].'</priority></url>';
        }
        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
