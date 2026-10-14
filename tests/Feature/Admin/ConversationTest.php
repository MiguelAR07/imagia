<?php

namespace Tests\Feature\Admin;

use App\Models\ChatSession;
use App\Support\Settings;
use Database\Seeders\BaseDataSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BaseDataSeeder::class, CatalogSeeder::class]);
    }

    private function conversation(bool $withMessages = true): ChatSession
    {
        $session = ChatSession::query()->create([
            'uuid' => (string) Str::uuid(),
            'engine' => 'rules',
            'answers' => ['intent' => 'organize', 'business' => 'Spa'],
            'summary' => "Objetivo: Quiero organizar mi negocio\nNegocio: Spa",
            'status' => 'open',
            'attention_status' => 'new',
            'last_message_at' => now(),
        ]);
        $session->messages()->create(['role' => 'assistant', 'content' => '¡Hola!']);

        if ($withMessages) {
            $session->messages()->create(['role' => 'user', 'content' => 'Quiero organizar mi negocio']);
        }

        return $session;
    }

    public function test_collaborators_see_conversations_with_visitor_messages_only()
    {
        $this->conversation();
        $this->conversation(withMessages: false);

        $this->actingAs($this->collaborator())
            ->get(route('admin.conversations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/conversations/index')
                ->has('conversations.data', 1)
                ->where('conversations.data.0.messages_count', 1)
                ->where('counts.new', 1));
    }

    public function test_the_detail_shows_the_transcript_and_attention_can_be_updated()
    {
        $session = $this->conversation();
        $user = $this->collaborator();

        $this->actingAs($user)
            ->get(route('admin.conversations.show', $session->id))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/conversations/show')
                ->has('conversation.messages', 2));

        $this->actingAs($user)
            ->patch(route('admin.conversations.update', $session->id), ['attention_status' => 'attended'])
            ->assertSessionHasNoErrors();

        $this->assertSame('attended', $session->refresh()->attention_status);
        $this->assertSame(1, $session->activities()->count());
    }

    public function test_notes_can_be_added_to_a_conversation()
    {
        $session = $this->conversation();

        $this->actingAs($this->collaborator())
            ->post(route('admin.activities.store', ['subjectType' => 'conversaciones', 'subjectId' => $session->id]), [
                'type' => 'note',
                'description' => 'Le escribí por WhatsApp.',
            ])->assertSessionHasNoErrors();

        $this->assertSame('Le escribí por WhatsApp.', $session->activities()->value('description'));
    }

    public function test_only_admins_delete_conversations()
    {
        $session = $this->conversation();

        $this->actingAs($this->collaborator())
            ->delete(route('admin.conversations.destroy', $session->id))
            ->assertForbidden();

        $this->actingAs($this->admin())
            ->delete(route('admin.conversations.destroy', $session->id))
            ->assertRedirect(route('admin.conversations.index'));

        $this->assertSame(0, ChatSession::query()->count());
        $this->assertDatabaseCount('chat_messages', 0);
    }

    public function test_assistant_settings_are_saved_and_report_the_ai_status_without_the_key()
    {
        config(['services.anthropic.key' => 'secret-key']);
        $admin = $this->admin();

        $this->actingAs($admin)
            ->get(route('admin.assistant.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/settings/assistant')
                ->where('ai.configured', true)
                ->missing('ai.key'))
            ->assertDontSee('secret-key');

        $this->actingAs($admin)
            ->put(route('admin.assistant.update'), [
                'enabled' => true,
                'use_ai' => false,
                'greeting' => 'Hola, ¿en qué te ayudo?',
                'plans' => ['landing' => 'web-profesional', 'website' => null, 'management' => 'gestion-empresarial', 'custom' => 'no-existe'],
            ])->assertSessionHasErrors('plans.custom');

        $this->actingAs($admin)
            ->put(route('admin.assistant.update'), [
                'enabled' => true,
                'use_ai' => false,
                'greeting' => 'Hola, ¿en qué te ayudo?',
                'plans' => ['landing' => 'web-profesional', 'website' => null, 'management' => 'gestion-empresarial', 'custom' => null],
            ])->assertSessionHasNoErrors();

        $settings = Settings::get(Settings::ASSISTANT);
        $this->assertFalse($settings['use_ai']);
        $this->assertSame('web-profesional', $settings['plans']['landing']);
        $this->assertSame('Hola, ¿en qué te ayudo?', $this->postJson(route('assistant.start'))->json('messages.0.content'));
    }

    public function test_collaborators_cannot_change_assistant_settings()
    {
        $this->actingAs($this->collaborator())
            ->get(route('admin.assistant.edit'))
            ->assertForbidden();
    }
}
