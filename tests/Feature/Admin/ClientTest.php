<?php

namespace Tests\Feature\Admin;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_list_can_be_searched_and_filtered()
    {
        $admin = $this->admin();
        Client::factory()->create(['name' => 'Clínica Sonrisas', 'status' => 'active']);
        Client::factory()->create(['name' => 'Ferretería Central', 'status' => 'inactive']);
        Client::factory()->create(['name' => 'Spa Archivado'])->delete();

        $this->actingAs($admin)
            ->get(route('admin.clients.index', ['q' => 'sonrisas']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/clients/index')
                ->has('clients.data', 1)
                ->where('clients.data.0.name', 'Clínica Sonrisas'));

        $this->actingAs($admin)
            ->get(route('admin.clients.index', ['status' => 'inactive']))
            ->assertInertia(fn (Assert $page) => $page->has('clients.data', 1)->where('clients.data.0.name', 'Ferretería Central'));

        $this->actingAs($admin)
            ->get(route('admin.clients.index'))
            ->assertInertia(fn (Assert $page) => $page->has('clients.data', 2));

        $this->actingAs($admin)
            ->get(route('admin.clients.index', ['status' => 'archived']))
            ->assertInertia(fn (Assert $page) => $page->has('clients.data', 1)->where('clients.data.0.archived', true));
    }

    public function test_a_client_can_be_created_and_the_history_records_it()
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->post(route('admin.clients.store'), [
            'type' => 'company',
            'name' => 'Clínica Sonrisas',
            'email' => 'CONTACTO@Sonrisas.co',
            'whatsapp' => '+57 300 111 2233',
            'status' => 'active',
        ]);

        $client = Client::query()->firstOrFail();
        $response->assertRedirect(route('admin.clients.show', $client));
        $this->assertSame('contacto@sonrisas.co', $client->email);
        $this->assertSame('573001112233', $client->whatsapp);
        $this->assertSame($admin->id, $client->created_by);
        $this->assertSame('system', $client->activities()->first()->type);
    }

    public function test_changing_the_status_is_recorded_in_the_history()
    {
        $client = Client::factory()->create(['status' => 'active']);

        $this->actingAs($this->admin())
            ->put(route('admin.clients.update', $client), [
                'type' => 'company',
                'name' => $client->name,
                'status' => 'inactive',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('inactive', $client->fresh()->status);
        $this->assertTrue($client->activities()->where('type', 'status_change')->exists());
    }

    public function test_archiving_keeps_the_client_and_it_can_be_restored()
    {
        $admin = $this->admin();
        $client = Client::factory()->create();

        $this->actingAs($admin)->delete(route('admin.clients.destroy', $client))
            ->assertRedirect(route('admin.clients.index'));
        $this->assertSoftDeleted($client);

        $this->actingAs($admin)->get(route('admin.clients.show', $client))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('client.archived', true));

        $this->actingAs($admin)->post(route('admin.clients.restore', $client));
        $this->assertNotSoftDeleted($client);
    }

    public function test_only_one_contact_can_be_primary()
    {
        $admin = $this->admin();
        $client = Client::factory()->create();

        $this->actingAs($admin)->post(route('admin.clients.contacts.store', $client), ['name' => 'Ana', 'is_primary' => true]);
        $this->actingAs($admin)->post(route('admin.clients.contacts.store', $client), ['name' => 'Luis', 'is_primary' => true]);

        $this->assertSame(['Luis'], $client->contacts()->where('is_primary', true)->pluck('name')->all());
    }

    public function test_contacts_of_another_client_cannot_be_edited_through_this_client()
    {
        $admin = $this->admin();
        $client = Client::factory()->create();
        $foreign = Client::factory()->create();
        $contact = $foreign->contacts()->create(['name' => 'Ajeno']);

        $this->actingAs($admin)
            ->put(route('admin.clients.contacts.update', ['client' => $client, 'contact' => $contact]), ['name' => 'Cambiado'])
            ->assertNotFound();

        $this->assertSame('Ajeno', Contact::query()->find($contact->id)->name);
    }

    public function test_notes_can_be_added_and_only_the_author_or_an_admin_can_delete_them()
    {
        $client = Client::factory()->create();
        $author = $this->collaborator();
        $author->givePermissionTo('clientes.gestionar');
        $other = $this->collaborator();
        $other->givePermissionTo('clientes.gestionar');

        $this->actingAs($author)
            ->post(route('admin.activities.store', ['subjectType' => 'clientes', 'subjectId' => $client->id]), [
                'type' => 'call',
                'description' => 'Llamada para revisar alcance.',
            ])
            ->assertSessionHasNoErrors();

        $note = Activity::query()->where('type', 'call')->firstOrFail();
        $this->assertSame($author->id, $note->user_id);

        $this->actingAs($other)->delete(route('admin.activities.destroy', $note))->assertForbidden();
        $this->actingAs($this->admin())->delete(route('admin.activities.destroy', $note));
        $this->assertModelMissing($note);
    }

    public function test_automatic_history_entries_cannot_be_deleted()
    {
        $admin = $this->admin();
        $client = Client::factory()->create();
        $entry = $client->logActivity('system', 'Cliente registrado.', $admin);

        $this->actingAs($admin)->delete(route('admin.activities.destroy', $entry))->assertForbidden();
    }

    public function test_collaborators_can_view_but_not_modify_clients()
    {
        $collaborator = $this->collaborator();
        $client = Client::factory()->create();

        $this->actingAs($collaborator)->get(route('admin.clients.index'))->assertOk();
        $this->actingAs($collaborator)->get(route('admin.clients.show', $client))->assertOk();
        $this->actingAs($collaborator)->post(route('admin.clients.store'), ['type' => 'company', 'name' => 'X', 'status' => 'active'])->assertForbidden();
        $this->actingAs($collaborator)->delete(route('admin.clients.destroy', $client))->assertForbidden();
        $this->actingAs($collaborator)
            ->post(route('admin.activities.store', ['subjectType' => 'clientes', 'subjectId' => $client->id]), ['type' => 'note', 'description' => 'x'])
            ->assertForbidden();
    }
}
