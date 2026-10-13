<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\File;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(Client $client, array $overrides = []): array
    {
        return array_replace([
            'client_id' => $client->id,
            'name' => 'Sistema de citas',
            'status' => 'planning',
            'priority' => 'medium',
            'currency' => 'COP',
            'progress_mode' => 'tasks',
        ], $overrides);
    }

    public function test_progress_is_the_weight_of_finished_tasks_over_the_total()
    {
        $project = Project::factory()->create();
        Task::factory()->for($project)->create(['weight' => 3, 'status' => 'done']);
        Task::factory()->for($project)->create(['weight' => 1, 'status' => 'todo']);

        $this->assertSame(75, $project->progress());

        $this->actingAs($this->admin())
            ->get(route('admin.projects.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/projects/index')
                ->where('projects.0.progress', 75)
                ->where('projects.0.progress_is_manual', false));
    }

    public function test_manual_progress_is_used_and_flagged_when_chosen()
    {
        $project = Project::factory()->create(['progress_mode' => 'manual', 'manual_progress' => 40]);
        Task::factory()->for($project)->create(['status' => 'done']);

        $this->assertSame(40, $project->progress());
    }

    public function test_a_project_without_tasks_has_zero_progress()
    {
        $this->assertSame(0, Project::factory()->create()->progress());
    }

    public function test_projects_are_created_for_active_clients_only()
    {
        $admin = $this->admin();
        $client = Client::factory()->create();
        $archived = Client::factory()->create();
        $archived->delete();

        $this->actingAs($admin)->post(route('admin.projects.store'), $this->payload($archived))
            ->assertSessionHasErrors('client_id');

        $this->actingAs($admin)->post(route('admin.projects.store'), $this->payload($client))
            ->assertSessionHasNoErrors();

        $project = Project::query()->firstOrFail();
        $this->assertTrue($client->activities()->where('description', 'like', '%Sistema de citas%')->exists());
        $this->assertTrue($project->activities()->exists());
    }

    public function test_manual_progress_requires_a_percentage_and_dates_must_be_in_order()
    {
        $client = Client::factory()->create();

        $this->actingAs($this->admin())
            ->post(route('admin.projects.store'), $this->payload($client, [
                'progress_mode' => 'manual',
                'start_date' => '2026-11-10',
                'due_date' => '2026-11-01',
            ]))
            ->assertSessionHasErrors(['manual_progress', 'due_date']);
    }

    public function test_important_changes_are_written_to_the_history_and_delivery_sets_the_completion_date()
    {
        $project = Project::factory()->create(['status' => 'in_progress', 'due_date' => '2026-12-01']);

        $this->actingAs($this->admin())
            ->put(route('admin.projects.update', $project), $this->payload($project->client, [
                'status' => 'delivered',
                'due_date' => '2026-12-15',
            ]))
            ->assertSessionHasNoErrors();

        $project->refresh();
        $this->assertNotNull($project->completed_at);
        $history = $project->activities()->pluck('description')->implode(' | ');
        $this->assertStringContainsString('En desarrollo', $history);
        $this->assertStringContainsString('Entregado', $history);
        $this->assertStringContainsString('01/12/2026 → 15/12/2026', $history);
    }

    public function test_the_board_status_change_is_recorded()
    {
        $project = Project::factory()->create(['status' => 'planning']);

        $this->actingAs($this->collaborator())
            ->patch(route('admin.projects.status', $project), ['status' => 'review'])
            ->assertSessionHasNoErrors();

        $this->assertSame('review', $project->fresh()->status);
        $this->assertSame(1, $project->activities()->where('type', 'status_change')->count());
    }

    public function test_overdue_only_counts_open_projects()
    {
        $this->assertTrue(Project::factory()->create(['due_date' => today()->subDay(), 'status' => 'in_progress'])->isOverdue());
        $this->assertFalse(Project::factory()->create(['due_date' => today()->subDay(), 'status' => 'delivered'])->isOverdue());
    }

    public function test_milestones_and_deliverables_belong_to_their_project()
    {
        $admin = $this->admin();
        $project = Project::factory()->create();
        $other = Project::factory()->create();
        $milestone = $other->milestones()->create(['name' => 'Ajeno']);

        $this->actingAs($admin)
            ->put(route('admin.projects.milestones.update', ['project' => $project, 'milestone' => $milestone]), ['name' => 'X', 'completed' => true])
            ->assertNotFound();

        $this->actingAs($admin)
            ->post(route('admin.projects.deliverables.store', $project), ['name' => 'Manual de uso', 'status' => 'pending'])
            ->assertSessionHasNoErrors();

        $deliverable = $project->deliverables()->firstOrFail();
        $this->actingAs($admin)->put(route('admin.projects.deliverables.update', ['project' => $project, 'deliverable' => $deliverable]), [
            'name' => 'Manual de uso',
            'status' => 'delivered',
        ]);

        $this->assertNotNull($deliverable->fresh()->delivered_at);
        $this->assertTrue($project->activities()->where('description', 'like', '%Manual de uso%Entregado%')->exists());
    }

    public function test_files_are_private_and_only_allowed_types_are_accepted()
    {
        Storage::fake('local');
        $admin = $this->admin();
        $project = Project::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.projects.files.store', $project), ['file' => UploadedFile::fake()->create('ataque.html', 5, 'text/html')])
            ->assertSessionHasErrors('file');

        $this->actingAs($admin)
            ->post(route('admin.projects.files.store', $project), ['file' => UploadedFile::fake()->create('propuesta.pdf', 120, 'application/pdf')])
            ->assertSessionHasNoErrors();

        $file = File::query()->firstOrFail();
        Storage::disk('local')->assertExists($file->path);
        $this->assertStringStartsWith("projects/{$project->id}/", $file->path);

        $this->actingAs($admin)
            ->get(route('admin.projects.files.download', ['project' => $project, 'file' => $file]))
            ->assertOk()
            ->assertDownload('propuesta.pdf');

        auth()->guard('web')->logout();
        $this->get(route('admin.projects.files.download', ['project' => $project, 'file' => $file]))
            ->assertRedirect(route('login'));

        $this->actingAs($admin);

        $this->actingAs($admin)->delete(route('admin.projects.files.destroy', ['project' => $project, 'file' => $file]));
        Storage::disk('local')->assertMissing($file->path);
    }

    public function test_panel_users_without_project_permissions_cannot_see_or_change_projects()
    {
        $user = $this->collaborator();
        $user->syncRoles([]);
        $user->givePermissionTo('panel.acceder');
        $project = Project::factory()->create();

        $this->actingAs($user)->get(route('admin.projects.index'))->assertForbidden();
        $this->actingAs($user)->get(route('admin.projects.show', $project))->assertForbidden();
        $this->actingAs($user)->delete(route('admin.projects.destroy', $project))->assertForbidden();
        $this->assertNotSoftDeleted($project);
    }
}
