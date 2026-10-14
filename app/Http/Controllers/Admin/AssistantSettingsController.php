<?php

namespace App\Http\Controllers\Admin;

use App\Assistant\Assistant;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Configuración del asistente del sitio. La clave de la IA no se edita aquí:
 * vive solo en el archivo .env del servidor.
 */
class AssistantSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings/assistant', [
            'settings' => Settings::get(Settings::ASSISTANT),
            'recommendations' => collect(Assistant::RECOMMENDATIONS)
                ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'plans' => Plan::query()->orderBy('sort_order')->get(['slug', 'name', 'is_published'])
                ->map(fn (Plan $p) => [
                    'value' => $p->slug,
                    'label' => $p->name.($p->is_published ? '' : ' (sin publicar)'),
                ]),
            'ai' => [
                'configured' => filled(config('services.anthropic.key')),
                'model' => config('services.anthropic.model'),
                'daily_limit' => config('services.anthropic.daily_limit'),
                'calls_today' => Assistant::aiCallsToday(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $keys = array_keys(Assistant::RECOMMENDATIONS);

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'use_ai' => ['required', 'boolean'],
            'greeting' => ['nullable', 'string', 'max:500'],
            'plans' => ['array:'.implode(',', $keys)],
            'plans.*' => ['nullable', 'string', Rule::exists('plans', 'slug')],
        ]);

        Settings::put(Settings::ASSISTANT, [
            'enabled' => $data['enabled'],
            'use_ai' => $data['use_ai'],
            'greeting' => trim((string) ($data['greeting'] ?? '')),
            'plans' => collect($keys)->mapWithKeys(fn ($k) => [$k => $data['plans'][$k] ?? null])->all(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Asistente actualizado.']);

        return to_route('admin.assistant.edit');
    }
}
