<?php

namespace Tests\Feature\Admin;

use App\Models\Lead;
use App\Models\Project;
use App\Notifications\NewLeadReceived;
use App\Notifications\TaskAssigned;
use Database\Seeders\BaseDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaseDataSeeder::class);
    }

    private function sendQuoteForm(): void
    {
        $this->post(route('site.contact.store'), [
            'name' => 'Laura Ríos',
            'email' => 'laura@example.com',
            'message' => 'Quiero una página para mi panadería.',
            'consent' => true,
        ])->assertRedirect(route('site.thanks'));
    }

    public function test_the_team_is_notified_when_a_lead_arrives_from_the_site()
    {
        Notification::fake();
        $admin = $this->admin();
        $collaborator = $this->collaborator();
        $inactive = $this->collaborator(['is_active' => false]);

        $this->sendQuoteForm();

        Notification::assertSentTo([$admin, $collaborator], NewLeadReceived::class);
        Notification::assertNotSentTo($inactive, NewLeadReceived::class);
    }

    public function test_a_failing_notification_never_loses_the_lead()
    {
        $this->admin();
        config(['mail.default' => 'failover', 'mail.mailers.failover.mailers' => ['does-not-exist']]);

        $this->sendQuoteForm();

        $this->assertDatabaseHas('leads', ['email' => 'laura@example.com']);
    }

    public function test_the_bell_shows_unread_notifications_and_opening_one_marks_it_read()
    {
        $admin = $this->admin();
        $this->sendQuoteForm();

        $this->actingAs($admin)->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('notifications.unread', 1)
                ->where('notifications.items.0.title', 'Nuevo prospecto: Laura Ríos'));

        $notification = $admin->notifications()->first();
        $this->actingAs($admin)->get(route('admin.notifications.open', $notification->id))
            ->assertRedirect(route('admin.leads.show', Lead::query()->value('id')));

        $this->assertSame(0, $admin->unreadNotifications()->count());
    }

    public function test_users_cannot_open_notifications_of_others()
    {
        $admin = $this->admin();
        $this->sendQuoteForm();
        $id = $admin->notifications()->value('id');

        $this->actingAs($this->collaborator())->get(route('admin.notifications.open', $id))->assertNotFound();
    }

    public function test_assignees_are_notified_but_not_when_assigning_to_themselves()
    {
        Notification::fake();
        $boss = $this->collaborator();
        $dev = $this->collaborator();
        $project = Project::factory()->create();

        $this->actingAs($boss)->post(route('admin.tasks.store'), [
            'project_id' => $project->id, 'title' => 'Diseñar portada', 'status' => 'todo', 'priority' => 'medium', 'weight' => 1, 'assignee_id' => $dev->id,
        ])->assertSessionHasNoErrors();

        $this->actingAs($boss)->post(route('admin.tasks.store'), [
            'project_id' => $project->id, 'title' => 'Mi tarea', 'status' => 'todo', 'priority' => 'medium', 'weight' => 1, 'assignee_id' => $boss->id,
        ]);

        Notification::assertSentToTimes($dev, TaskAssigned::class, 1);
        Notification::assertNotSentTo($boss, TaskAssigned::class);
    }

    public function test_mark_all_as_read()
    {
        $admin = $this->admin();
        $this->sendQuoteForm();
        $this->sendQuoteForm();

        $this->actingAs($admin)->post(route('admin.notifications.read'))->assertRedirect();

        $this->assertSame(0, $admin->unreadNotifications()->count());
    }
}
