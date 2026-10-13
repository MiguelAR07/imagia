<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ClientRequest;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Contact;
use App\Support\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive,archived'],
        ]);

        $clients = Client::query()
            ->when(($filters['status'] ?? null) === 'archived', fn ($q) => $q->onlyTrashed())
            ->when(in_array($filters['status'] ?? null, ['active', 'inactive'], true), fn ($q) => $q->where('status', $filters['status']))
            ->search($filters['q'] ?? null)
            ->withCount('contacts')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Client $client) => [
                'id' => $client->id,
                'name' => $client->name,
                'type' => $client->type,
                'email' => $client->email,
                'phone' => $client->phone,
                'city' => $client->city,
                'status' => $client->status,
                'contacts_count' => $client->contacts_count,
                'archived' => $client->trashed(),
            ]);

        return Inertia::render('admin/clients/index', [
            'clients' => $clients,
            'filters' => [
                'q' => $filters['q'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
            'options' => [
                'types' => Options::from(Client::TYPES),
                'statuses' => Options::from(Client::STATUSES),
            ],
        ]);
    }

    public function store(ClientRequest $request): RedirectResponse
    {
        $client = new Client($request->validated());
        $client->created_by = $request->user()->id;
        $client->save();

        $client->logActivity('system', 'Cliente registrado.');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente creado.']);

        return to_route('admin.clients.show', $client);
    }

    public function show(Client $client): Response
    {
        $client->load(['contacts', 'creator:id,name']);

        return Inertia::render('admin/clients/show', [
            'client' => [
                ...$client->only(['id', 'type', 'name', 'tax_id', 'email', 'phone', 'whatsapp', 'city', 'website', 'status', 'notes']),
                'created_at' => $client->created_at?->toIso8601String(),
                'created_by' => $client->creator?->name,
                'archived' => $client->trashed(),
                'contacts' => $client->contacts->map(fn (Contact $c) => $c->only(['id', 'name', 'role', 'email', 'phone', 'is_primary'])),
            ],
            'activities' => $client->activities()->with('user:id,name')->limit(100)->get()
                ->map(fn (Activity $a) => $a->toTimelineArray()),
            'options' => [
                'types' => Options::from(Client::TYPES),
                'statuses' => Options::from(Client::STATUSES),
                'activity_types' => Options::from(Activity::MANUAL_TYPES),
            ],
        ]);
    }

    public function update(ClientRequest $request, Client $client): RedirectResponse
    {
        $previousStatus = $client->status;
        $client->update($request->validated());

        if ($previousStatus !== $client->status) {
            $client->logActivity('status_change', 'Estado cambiado a «'.Client::STATUSES[$client->status].'».');
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente actualizado.']);

        return to_route('admin.clients.show', $client);
    }

    /**
     * Archiva el cliente (no se borra: conserva su historial, proyectos y cotizaciones).
     */
    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();
        $client->logActivity('system', 'Cliente archivado.');

        Inertia::flash('toast', ['type' => 'success', 'message' => "«{$client->name}» se archivó. Puedes restaurarlo desde el filtro «Archivados»."]);

        return to_route('admin.clients.index');
    }

    public function restore(Client $client): RedirectResponse
    {
        $client->restore();
        $client->logActivity('system', 'Cliente restaurado.');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente restaurado.']);

        return to_route('admin.clients.show', $client);
    }
}
