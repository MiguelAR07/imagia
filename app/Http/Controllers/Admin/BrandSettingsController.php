<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandSettingsRequest;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BrandSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings/brand', [
            'settings' => Settings::get(Settings::BRAND),
        ]);
    }

    public function update(BrandSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['name'] = mb_strtoupper($data['name']);
        $data['acronym'] = array_map(fn (array $item) => [
            ...$item,
            'letter' => mb_strtoupper($item['letter']),
        ], $data['acronym']);

        Settings::put(Settings::BRAND, [
            ...Settings::get(Settings::BRAND),
            ...$data,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Marca actualizada.']);

        return to_route('admin.brand.edit');
    }
}
