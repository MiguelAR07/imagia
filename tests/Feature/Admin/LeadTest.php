<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\Lead;
use App\Models\PipelineStage;
use Database\Seeders\BaseDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaseDataSeeder::class);
    }

    private function stage(string $slug): PipelineStage
    {
        return PipelineStage::query()->where('slug', $slug)->firstOrFail();
    }

    public function test_the_board_shows_every_stage_and_lead()
    {
        Lead::factory()->count(3)->create();

        $this->actingAs($this->collaborator())
            ->get(route('admin.leads.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/leads/index')
                ->has('stages', 7)
                ->has('leads', 3));
    }

    public function test_new_leads_start_in_the_first_stage_and_the_history_records_the_source()
    {
        $this->actingAs($this->collaborator())
            ->post(route('admin.leads.store'), [
                'name' => 'Andrea Gómez',
                'company' => 'Spa Andrea',
                'source' => 'whatsapp',
                'need' => 'Agenda de citas',
            ])
            ->assertSessionHasNoErrors();

        $lead = Lead::query()->firstOrFail();
        $this->assertSame($this->stage('nuevo')->id, $lead->pipeline_stage_id);
        $this->assertStringContainsString('WhatsApp', $lead->activities()->first()->description);
    }

    public function test_moving_a_lead_records_the_change()
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->collaborator())
            ->patch(route('admin.leads.move', $lead), ['pipeline_stage_id' => $this->stage('contactado')->id])
            ->assertSessionHasNoErrors();

        $this->assertSame($this->stage('contactado')->id, $lead->fresh()->pipeline_stage_id);
        $this->assertTrue($lead->activities()->where('type', 'status_change')->exists());
    }

    public function test_moving_to_a_lost_stage_requires_a_reason()
    {
        $lead = Lead::factory()->create();
        $lost = $this->stage('perdido');
        $user = $this->collaborator();

        $this->actingAs($user)
            ->patch(route('admin.leads.move', $lead), ['pipeline_stage_id' => $lost->id])
            ->assertSessionHasErrors('lost_reason');

        $this->actingAs($user)
            ->patch(route('admin.leads.move', $lead), ['pipeline_stage_id' => $lost->id, 'lost_reason' => 'Eligió otra opción'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Eligió otra opción', $lead->fresh()->lost_reason);
    }

    public function test_updating_a_lead_does_not_change_its_stage()
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->collaborator())->put(route('admin.leads.update', $lead), [
            'name' => 'Nuevo nombre',
            'source' => 'manual',
            'pipeline_stage_id' => $this->stage('ganado')->id,
        ]);

        $lead->refresh();
        $this->assertSame('Nuevo nombre', $lead->name);
        $this->assertSame($this->stage('nuevo')->id, $lead->pipeline_stage_id);
    }

    public function test_a_lead_with_a_company_is_converted_into_a_client_with_a_primary_contact()
    {
        $lead = Lead::factory()->create(['name' => 'Andrea', 'company' => 'Spa Andrea', 'email' => 'andrea@spa.co']);

        $this->actingAs($this->admin())
            ->post(route('admin.leads.convert', $lead))
            ->assertRedirect();

        $client = Client::query()->firstOrFail();
        $this->assertSame('Spa Andrea', $client->name);
        $this->assertSame('company', $client->type);
        $this->assertSame('Andrea', $client->contacts()->where('is_primary', true)->value('name'));
        $this->assertSame($client->id, $lead->fresh()->client_id);
        $this->assertSame($this->stage('nuevo')->id, $lead->fresh()->pipeline_stage_id, 'Convertir no cierra la venta');

        // Convertir dos veces no duplica el cliente.
        $this->actingAs($this->admin())->post(route('admin.leads.convert', $lead));
        $this->assertSame(1, Client::query()->count());
    }

    public function test_collaborators_cannot_convert_leads_without_client_permission()
    {
        $lead = Lead::factory()->create();

        $this->actingAs($this->collaborator())->post(route('admin.leads.convert', $lead))->assertForbidden();
        $this->assertSame(0, Client::query()->count());
    }

    public function test_calls_update_the_last_contact_date_but_notes_do_not()
    {
        $lead = Lead::factory()->create();
        $user = $this->collaborator();
        $url = route('admin.activities.store', ['subjectType' => 'prospectos', 'subjectId' => $lead->id]);

        $this->actingAs($user)->post($url, ['type' => 'note', 'description' => 'Pendiente enviar propuesta']);
        $this->assertNull($lead->fresh()->last_contacted_at);

        $this->actingAs($user)->post($url, ['type' => 'call', 'description' => 'Llamada de descubrimiento']);
        $this->assertNotNull($lead->fresh()->last_contacted_at);
    }

    public function test_overdue_follow_ups_are_flagged()
    {
        Lead::factory()->create(['next_follow_up_at' => today()->subDay()]);
        Lead::factory()->create(['next_follow_up_at' => today()->addDay()]);

        $this->actingAs($this->collaborator())
            ->get(route('admin.leads.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('leads', fn ($leads) => collect($leads)->where('follow_up_overdue', true)->count() === 1));
    }

    public function test_admins_manage_stages_but_cannot_delete_stages_with_leads()
    {
        $admin = $this->admin();
        Lead::factory()->create();

        $this->actingAs($admin)->post(route('admin.stages.store'), ['name' => 'Propuesta técnica', 'color' => 'violet', 'kind' => 'open'])
            ->assertSessionHasNoErrors();
        $created = PipelineStage::query()->where('name', 'Propuesta técnica')->firstOrFail();
        $this->assertSame('propuesta-tecnica', $created->slug);

        $this->actingAs($admin)->delete(route('admin.stages.destroy', $this->stage('nuevo')));
        $this->assertModelExists($this->stage('nuevo'));

        $this->actingAs($admin)->delete(route('admin.stages.destroy', $created));
        $this->assertModelMissing($created);

        $this->actingAs($this->collaborator())
            ->post(route('admin.stages.store'), ['name' => 'X', 'color' => 'blue', 'kind' => 'open'])
            ->assertForbidden();
    }

    public function test_stages_can_be_reordered()
    {
        $ids = PipelineStage::query()->orderBy('sort_order')->pluck('id')->reverse()->values()->all();

        $this->actingAs($this->admin())->put(route('admin.stages.reorder'), ['ids' => $ids]);

        $this->assertSame($ids, PipelineStage::query()->orderBy('sort_order')->pluck('id')->all());
    }
}
