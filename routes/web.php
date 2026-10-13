<?php

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

require __DIR__.'/settings.php';
