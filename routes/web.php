<?php

use App\Http\Controllers\PortfolioMediaController;
use App\Support\Settings;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
| Página pública provisional. El sitio comercial completo se construye en la Fase 4.
| Solo expone datos de contacto públicos.
*/
Route::get('/', fn () => Inertia::render('welcome', [
    'contact' => collect(Settings::get(Settings::CONTACT))
        ->only(['email', 'whatsapp', 'whatsapp_message', 'city', 'instagram', 'facebook', 'linkedin', 'tiktok', 'github']),
    'story' => collect(Settings::get(Settings::BRAND))->only(['origin', 'logo_parts']),
]))->name('home');

/* Imágenes del portafolio (públicas solo si el proyecto está publicado y no es confidencial) */
Route::get('portafolio/portada/{item}', [PortfolioMediaController::class, 'cover'])->name('portfolio.cover');
Route::get('portafolio/imagen/{image}', [PortfolioMediaController::class, 'image'])->name('portfolio.image');

require __DIR__.'/settings.php';
