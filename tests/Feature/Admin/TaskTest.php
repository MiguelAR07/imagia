<?php

namespace Tests\Feature\Admin;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_tasks_are_created_inside_a_project()
    {
        $project = Project::factory()->create();

        $this->actingAs($this->collaborator())
            ->post(route('admin.tasks.store'), [
                'project_id' => $project->id,
                'title' => 'Diseñar el módulo de agenda',
                'status' => 'todo',
                'priority' => 'high',
                'weight' => 3,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, $project->tasks()->count());
    }

    public function test_finishing_a_task_sets_the_completion_date_and_reopening_clears_it()
    {
        $task = Task::factory()->create();
        $user = $this->collaborator();

        $this->actingAs($user)->patch(route('admin.tasks.status', $task), ['status' => 'done']);
        $this->assertNotNull($task->fresh()->completed_at);

        $this->actingAs($user)->patch(route('admin.tasks.status', $task), ['status' => 'in_progress']);
        $this->assertNull($task->fresh()->completed_at);
    }

    public function test_a_task_cannot_use_a_milestone_from_another_project()
    {
        $project = Project::factory()->create();
        $foreign = Project::factory()->create()->milestones()->create(['name' => 'Ajeno']);

        $this->actingAs($this->collaborator())
            ->post(route('admin.tasks.store'), [
                'project_id' => $project->id,
                'milestone_id' => $foreign->id,
                'title' => 'X',
                'status' => 'todo',
                'priority' => 'medium',
                'weight' => 1,
            ])
            ->assertSessionHasErrors('milestone_id');
    }

    public function test_the_global_list_filters_by_due_date_and_hides_archived_projects()
    {
        $user = $this->collaborator();
        Task::factory()->create(['title' => 'Vencida', 'due_date' => today()->subDays(2)]);
        Task::factory()->create(['title' => 'Futura', 'due_date' => today()->addDays(20)]);
        Task::factory()->create(['title' => 'Hecha y vencida', 'due_date' => today()->subDay(), 'status' => 'done']);
        $archived = Project::factory()->create();
        Task::factory()->for($archived)->create(['title' => 'De proyecto archivado', 'due_date' => today()->subDay()]);
        $archived->delete();

        $this->actingAs($user)
            ->get(route('admin.tasks.index', ['due' => 'overdue']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/tasks/index')
                ->has('tasks.data', 1)
                ->where('tasks.data.0.title', 'Vencida')
                ->where('tasks.data.0.overdue', true));
    }

    public function test_my_tasks_filter()
    {
        $user = $this->collaborator();
        Task::factory()->create(['title' => 'Mía', 'assignee_id' => $user->id]);
        Task::factory()->create(['title' => 'De otro']);

        $this->actingAs($user)
            ->get(route('admin.tasks.index', ['assignee' => 'me']))
            ->assertInertia(fn (Assert $page) => $page->has('tasks.data', 1)->where('tasks.data.0.title', 'Mía'));
    }

    public function test_task_detail_includes_comments_and_only_the_author_can_delete_them()
    {
        $task = Task::factory()->create();
        $author = $this->collaborator();
        $other = $this->collaborator();

        $this->actingAs($author)->post(route('admin.tasks.comments.store', $task), ['body' => 'Revisado con el cliente.']);

        $this->actingAs($other)
            ->getJson(route('admin.tasks.show', $task))
            ->assertOk()
            ->assertJsonPath('comments.0.body', 'Revisado con el cliente.');

        $comment = TaskComment::query()->firstOrFail();
        $this->actingAs($other)->delete(route('admin.tasks.comments.destroy', $comment))->assertForbidden();
        $this->actingAs($author)->delete(route('admin.tasks.comments.destroy', $comment));
        $this->assertModelMissing($comment);
    }
}
