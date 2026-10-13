<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ContactSettingsRequest;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContactSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings/contact', [
            'settings' => Settings::get(Settings::CONTACT),
        ]);
    }

    public function update(ContactSettingsRequest $request): RedirectResponse
    {
        Settings::put(Settings::CONTACT, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Datos de contacto actualizados.']);

        return to_route('admin.contact.edit');
    }
}
