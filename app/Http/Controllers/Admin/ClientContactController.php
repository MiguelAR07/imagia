<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ContactRequest;
use App\Models\Client;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ClientContactController extends Controller
{
    public function store(ContactRequest $request, Client $client): RedirectResponse
    {
        DB::transaction(function () use ($request, $client) {
            $contact = $client->contacts()->make($request->validated());
            $this->keepSinglePrimary($client, $contact);
            $contact->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Contacto agregado.']);

        return to_route('admin.clients.show', $client);
    }

    public function update(ContactRequest $request, Client $client, Contact $contact): RedirectResponse
    {
        DB::transaction(function () use ($request, $client, $contact) {
            $contact->fill($request->validated());
            $this->keepSinglePrimary($client, $contact);
            $contact->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Contacto actualizado.']);

        return to_route('admin.clients.show', $client);
    }

    public function destroy(Client $client, Contact $contact): RedirectResponse
    {
        $contact->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Contacto eliminado.']);

        return to_route('admin.clients.show', $client);
    }

    /** Solo un contacto principal por cliente. */
    private function keepSinglePrimary(Client $client, Contact $contact): void
    {
        if ($contact->is_primary) {
            $client->contacts()->whereKeyNot($contact->getKey() ?? 0)->update(['is_primary' => false]);
        }
    }
}
