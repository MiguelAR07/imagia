<?php

use App\Http\Controllers\PortfolioMediaController;
use App\Http\Controllers\Site\LeadFormController;
use App\Http\Controllers\Site\PageController;
use App\Http\Controllers\Site\SitemapController;
use Illuminate\Support\Facades\Route;

/*
| Sitio comercial público. Solo muestra contenido publicado desde el panel.
*/
Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('servicios', [PageController::class, 'services'])->name('site.services');
Route::get('servicios/{slug}', [PageController::class, 'service'])->name('site.service');
Route::get('proyectos', [PageController::class, 'projects'])->name('site.projects');
Route::get('proyectos/{slug}', [PageController::class, 'project'])->name('site.project');
Route::get('planes', [PageController::class, 'plans'])->name('site.plans');
Route::get('como-trabajamos', [PageController::class, 'process'])->name('site.process');
Route::get('privacidad', [PageController::class, 'privacy'])->name('site.privacy');
Route::get('terminos', [PageController::class, 'terms'])->name('site.terms');

Route::get('cotizar', [LeadFormController::class, 'quote'])->name('site.quote');
Route::post('cotizar', [LeadFormController::class, 'storeQuote'])->middleware('throttle:5,1')->name('site.quote.store');
Route::get('contacto', [LeadFormController::class, 'contact'])->name('site.contact');
Route::post('contacto', [LeadFormController::class, 'storeContact'])->middleware('throttle:5,1')->name('site.contact.store');
Route::get('gracias', [LeadFormController::class, 'thanks'])->name('site.thanks');

Route::get('sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('robots.txt', fn () => response(implode("\n", [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /settings',
    'Disallow: /login',
    'Disallow: /gracias',
    '',
    'Sitemap: '.route('sitemap'),
]), 200, ['Content-Type' => 'text/plain; charset=UTF-8']))->name('robots');

/* Imágenes del portafolio (públicas solo si el proyecto está publicado y no es confidencial) */
Route::get('portafolio/portada/{item}', [PortfolioMediaController::class, 'cover'])->name('portfolio.cover');
Route::get('portafolio/imagen/{image}', [PortfolioMediaController::class, 'image'])->name('portfolio.image');

require __DIR__.'/settings.php';
