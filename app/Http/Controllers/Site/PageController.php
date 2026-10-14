<?php

namespace App\Http\Controllers\Site;

use App\Models\PortfolioItem;
use App\Models\Project;
use App\Models\Service;
use App\Support\PublicCatalog;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Response;

class PageController extends SiteController
{
    public function home(): Response
    {
        $brand = Settings::get(Settings::BRAND);
        $featured = PublicCatalog::projects(featuredOnly: true, limit: 6);

        return $this->page('site/home', [
            'services' => PublicCatalog::services(),
            // Si no hay destacados, se muestran los más recientes publicados.
            'projects' => $featured->isNotEmpty() ? $featured : PublicCatalog::projects(limit: 3),
            'plans' => PublicCatalog::plans(),
            'process' => PublicCatalog::PROCESS,
        ], '', "{$brand['descriptor']}. {$brand['tagline']} Webs, apps y automatización a la medida de tu negocio.");
    }

    public function services(): Response
    {
        return $this->page('site/services', [
            'services' => PublicCatalog::services(),
        ], 'Servicios', 'Landing pages, páginas web, software de gestión, paneles administrativos, automatización e inteligencia artificial.');
    }

    public function service(string $slug): Response
    {
        $service = Service::query()->where('slug', $slug)->where('is_published', true)->with('features:id,name')->firstOrFail();

        return $this->page('site/service', [
            'service' => PublicCatalog::service($service),
            'plans' => PublicCatalog::plans($service->id),
        ], $service->name, $service->summary);
    }

    public function projects(Request $request): Response
    {
        $category = $request->validate([
            'categoria' => ['nullable', Rule::in(array_keys(Project::CATEGORIES))],
        ])['categoria'] ?? null;

        return $this->page('site/projects', [
            'projects' => PublicCatalog::projects($category),
            'categories' => PublicCatalog::projectCategories(),
            'category' => $category ?? '',
        ], 'Proyectos', 'Proyectos que hemos desarrollado: webs, sistemas de gestión, automatizaciones y más.');
    }

    public function project(string $slug): Response
    {
        $item = PortfolioItem::query()->publiclyVisible()->whereNotNull('cover_path')->where('slug', $slug)->firstOrFail();

        return $this->page('site/project', [
            'project' => PublicCatalog::projectDetail($item),
            'related' => PublicCatalog::projects($item->category, limit: 4)->where('slug', '!=', $item->slug)->take(3)->values(),
        ], $item->title, $item->summary, route('portfolio.cover', $item));
    }

    public function plans(): Response
    {
        return $this->page('site/plans', [
            'plans' => PublicCatalog::plans(),
            'faqs' => PublicCatalog::generalFaqs(),
        ], 'Planes', 'Planes para tener presencia digital, una web profesional, un sistema de gestión o una solución a la medida.');
    }

    public function process(): Response
    {
        return $this->page('site/process', [
            'process' => PublicCatalog::PROCESS,
            'faqs' => PublicCatalog::generalFaqs(),
        ], 'Cómo trabajamos', 'Del descubrimiento a la entrega: así desarrollamos cada proyecto contigo, paso a paso.');
    }

    public function privacy(): Response
    {
        return $this->legal('privacy', 'Política de privacidad');
    }

    public function terms(): Response
    {
        return $this->legal('terms', 'Términos y condiciones');
    }

    private function legal(string $key, string $title): Response
    {
        $legal = Settings::get(Settings::LEGAL);
        $brand = Settings::get(Settings::BRAND);
        $email = Settings::get(Settings::CONTACT)['email'] ?? null;

        $text = strtr((string) $legal[$key], [
            '{marca}' => $brand['name'],
            '{correo}' => $email ?: 'nuestro correo de contacto',
        ]);

        return $this->page('site/legal', [
            'title' => $title,
            'content' => $text,
            'updated_at' => $legal['updated_at'],
        ], $title, "{$title} de {$brand['name']}.");
    }
}
