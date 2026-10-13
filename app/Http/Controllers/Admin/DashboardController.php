<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Settings;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $brand = Settings::get(Settings::BRAND);

        return Inertia::render('admin/dashboard', [
            'story' => [
                'origin' => $brand['origin'],
                'logo_parts' => $brand['logo_parts'],
            ],
            'stats' => [
                'active_users' => User::query()->where('is_active', true)->count(),
            ],
        ]);
    }
}
