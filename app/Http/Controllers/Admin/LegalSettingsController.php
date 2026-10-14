<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Textos legales del sitio (privacidad y términos). Parten de una plantilla base
 * que debe revisarse con un asesor legal antes de publicar el sitio.
 */
class LegalSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings/legal', [
            'settings' => Settings::get(Settings::LEGAL),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'privacy' => ['required', 'string', 'max:30000'],
            'terms' => ['required', 'string', 'max:30000'],
        ]);

        Settings::put(Settings::LEGAL, [...$data, 'updated_at' => now()->toDateString()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Textos legales actualizados.']);

        return to_route('admin.legal.edit');
    }
}
