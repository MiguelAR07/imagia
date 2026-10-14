<?php

namespace App\Http\Middleware;

use App\Support\Settings;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $brand = Settings::get(Settings::BRAND);

        return [
            ...parent::share($request),
            'name' => $brand['name'],
            'brand' => [
                'name' => $brand['name'],
                'tagline' => $brand['tagline'],
                'descriptor' => $brand['descriptor'],
                'acronym' => $brand['acronym'],
            ],
            'auth' => [
                'user' => $user,
                'roles' => fn () => $user?->getRoleNames()->values() ?? [],
                'permissions' => fn () => $user === null ? [] : $user->getAllPermissions()->pluck('name')->values(),
            ],
            // Avisos de la campana: los 8 más recientes y cuántos faltan por leer.
            'notifications' => fn () => $user === null ? null : [
                'unread' => $user->unreadNotifications()->count(),
                'items' => $user->notifications()->limit(8)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'title' => $n->data['title'] ?? '',
                    'body' => $n->data['body'] ?? '',
                    'icon' => $n->data['icon'] ?? null,
                    'read' => $n->read_at !== null,
                    'created_at' => $n->created_at?->toIso8601String(),
                ]),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
