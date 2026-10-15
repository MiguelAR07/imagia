<?php

namespace Tests\Feature\Site;

use App\Assistant\AiEngine;
use App\Assistant\Assistant;
use App\Assistant\AssistantEngine;
use App\Assistant\AssistantTurn;
use App\Models\ChatSession;
use App\Models\Faq;
use App\Models\Lead;
use App\Models\Plan;
use App\Support\Settings;
use Database\Seeders\BaseDataSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Tests\TestCase;

class AssistantTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BaseDataSeeder::class, CatalogSeeder::class]);
    }

    private function start(): string
    {
        return $this->postJson(route('assistant.start'))->assertCreated()->json('uuid');
    }

    private function say(string $uuid, string $text): array
    {
        return $this->postJson(route('assistant.message', $uuid), ['content' => $text])->assertOk()->json();
    }

    /**
     * @param  list<string>  $answers
     */
    private function conversation(array $answers): string
    {
        $uuid = $this->start();

        foreach ($answers as $answer) {
            $this->say($uuid, $answer);
        }

        return $uuid;
    }

    public function test_without_api_key_the_guided_flow_greets_and_offers_the_goals()
    {
        $response = $this->postJson(route('assistant.start'))->assertCreated();

        $response->assertJsonPath('messages.0.role', 'assistant')
            ->assertJsonPath('messages.0.quick_replies.0', 'Quiero atraer más clientes')
            ->assertJsonPath('has_contact', false);

        $this->assertSame('rules', ChatSession::query()->value('engine'));
    }

    public function test_the_guided_flow_adapts_to_the_goal_and_recommends_a_management_system()
    {
        $uuid = $this->conversation(['Quiero organizar mi negocio', 'Spa de uñas']);

        $state = $this->say($uuid, 'WhatsApp y papel');
        $this->assertSame('¿Qué te gustaría controlar primero?', end($state['messages'])['content']);

        $this->say($uuid, 'Citas y reservas');
        $this->say($uuid, 'Entre 2 y 5 millones');
        $state = $this->say($uuid, 'Lo antes posible');

        $last = end($state['messages']);
        $this->assertTrue($last['offer_actions']);
        $this->assertStringContainsString('sistema de gestión', $last['content']);
        $this->assertSame('management', $state['recommendation']);
        $this->assertStringContainsString('Negocio: Spa de uñas', $state['summary']);
        $this->assertStringContainsString('Presupuesto: Entre 2 y 5 millones', $state['summary']);
    }

    public function test_the_recommendation_never_shows_an_unpublished_plan_and_shows_the_configured_price()
    {
        $answers = ['Necesito una página web', 'Panadería', 'No tengo', 'Un servicio o una promoción', 'Aún no lo sé', 'Más adelante'];

        $state = $this->say($this->conversation(array_slice($answers, 0, 5)), $answers[5]);
        $this->assertSame('landing', $state['recommendation']);
        $this->assertNull($state['plan']);

        Plan::query()->where('slug', 'presencia-digital')->update(['is_published' => true, 'price' => 1200000]);

        $state = $this->say($this->conversation(array_slice($answers, 0, 5)), $answers[5]);
        $this->assertSame('Presencia Digital', $state['plan']['name']);
        $this->assertSame('1200000.00', $state['plan']['price']);
    }

    public function test_free_text_is_accepted_and_unknown_goals_are_clarified()
    {
        $uuid = $this->conversation(['hola, quiero vender por internet mis productos']);
        $session = ChatSession::query()->where('uuid', $uuid)->first();

        $this->assertSame('clients', $session->answer('intent'));

        $uuid = $this->conversation(['no estoy seguro', 'Taller de motos']);
        $state = $this->say($uuid, 'Ahorrar tiempo en tareas repetitivas');
        $this->assertSame('¿Qué tarea repetitiva te quita más tiempo?', end($state['messages'])['content']);
    }

    public function test_price_questions_are_answered_only_with_configured_prices_and_the_flow_resumes()
    {
        $uuid = $this->conversation(['Necesito una página web', 'Panadería']);

        // Sin planes publicados no hay cifras.
        $state = $this->say($uuid, '¿Cuánto cuesta una página?');
        $last = end($state['messages']);
        $this->assertStringContainsString('depende de lo que necesites', $last['content']);
        $this->assertStringNotContainsString('$', $last['content']);
        $this->assertStringContainsString('¿Actualmente tienes una página web?', $last['content']);
        $this->assertSame(['No tengo', 'Sí, pero no me sirve', 'Sí, y quiero mejorarla'], $last['quick_replies']);

        Plan::query()->where('slug', 'presencia-digital')->update(['is_published' => true, 'price' => 1200000]);

        $state = $this->say($uuid, 'cuanto cuesta');
        $this->assertStringContainsString('Presencia Digital: desde $1.200.000 COP', end($state['messages'])['content']);

        // La pregunta no se guardó como respuesta: la conversación sigue donde iba.
        $state = $this->say($uuid, 'No tengo');
        $this->assertSame('¿Qué te gustaría mostrar en internet?', end($state['messages'])['content']);
    }

    public function test_the_assistant_explains_each_kind_of_solution_in_plain_words()
    {
        $uuid = $this->conversation(['Necesito una página web', 'Panadería']);

        $state = $this->say($uuid, 'qué es una landing');
        $this->assertStringContainsString('volante o un afiche en internet', end($state['messages'])['content']);

        $state = $this->say($uuid, '¿Qué es un panel de control?');
        $this->assertStringContainsString('oficina privada de tu negocio', end($state['messages'])['content']);
        $this->assertStringContainsString('¿Actualmente tienes una página web?', end($state['messages'])['content']);
    }

    public function test_published_faqs_answer_visitor_questions()
    {
        Faq::query()->create([
            'question' => '¿Incluyen el dominio y el hosting?',
            'answer' => 'Te ayudamos a contratarlos a tu nombre; su costo anual va aparte.',
            'is_published' => true,
        ]);

        $state = $this->say($this->start(), '¿El hosting está incluido?');

        $this->assertStringContainsString('Te ayudamos a contratarlos a tu nombre', end($state['messages'])['content']);
    }

    public function test_unknown_questions_are_not_invented_and_answers_are_not_mistaken_for_questions()
    {
        $uuid = $this->conversation(['Quiero organizar mi negocio', 'Que vendo ropa por catálogo']);
        $session = ChatSession::query()->where('uuid', $uuid)->first();
        $this->assertSame('Que vendo ropa por catálogo', $session->answer('business'));

        $state = $this->say($uuid, '¿Trabajan con empresas de otros países?');
        $this->assertStringContainsString('prefiero que te la responda directamente el equipo', end($state['messages'])['content']);
        $this->assertStringContainsString('¿Cómo gestionas hoy tus clientes o procesos?', end($state['messages'])['content']);
    }

    public function test_leaving_contact_data_creates_a_lead_with_the_summary_and_consent()
    {
        $uuid = $this->conversation(['Quiero organizar mi negocio', 'Ferretería', 'Hojas de Excel', 'Inventario', 'Aún no lo sé', 'En 1 a 3 meses']);

        $this->postJson(route('assistant.contact', $uuid), [
            'name' => 'Carlos Pérez', 'email' => 'carlos@example.com', 'consent' => false,
        ])->assertUnprocessable()->assertJsonValidationErrors('consent');

        $state = $this->postJson(route('assistant.contact', $uuid), [
            'name' => 'Carlos Pérez', 'email' => 'carlos@example.com', 'wants_meeting' => true, 'consent' => true,
        ])->assertOk()->json();

        $lead = Lead::query()->sole();
        $this->assertSame('chatbot', $lead->source);
        $this->assertNotNull($lead->consent_at);
        $this->assertStringContainsString('Negocio: Ferretería', $lead->need);
        $this->assertSame('En 1 a 3 meses', $lead->urgency);
        $this->assertTrue($state['has_contact']);
        $this->assertStringContainsString('reunión', end($state['messages'])['content']);

        $session = ChatSession::query()->sole();
        $this->assertSame($lead->id, $session->lead_id);
        $this->assertSame('converted', $session->status);

        // Una sola vez por conversación.
        $this->postJson(route('assistant.contact', $uuid), [
            'name' => 'Otro', 'email' => 'otro@example.com', 'consent' => true,
        ])->assertStatus(409);
        $this->assertSame(1, Lead::query()->count());
    }

    public function test_bots_filling_the_honeypot_do_not_create_leads()
    {
        $uuid = $this->start();

        $this->postJson(route('assistant.contact', $uuid), [
            'name' => 'Bot', 'email' => 'bot@example.com', 'consent' => true, 'website' => 'http://spam',
        ])->assertOk();

        $this->assertSame(0, Lead::query()->count());
    }

    public function test_messages_are_validated_and_limited_per_conversation()
    {
        $uuid = $this->start();

        $this->postJson(route('assistant.message', $uuid), ['content' => ''])->assertUnprocessable();
        $this->postJson(route('assistant.message', $uuid), ['content' => str_repeat('a', Assistant::MAX_LENGTH + 1)])->assertUnprocessable();

        $session = ChatSession::query()->sole();
        foreach (range(1, Assistant::MAX_USER_MESSAGES) as $i) {
            $session->messages()->create(['role' => 'user', 'content' => "mensaje {$i}"]);
        }

        $this->postJson(route('assistant.message', $uuid), ['content' => 'uno más'])->assertStatus(429);
        $this->getJson(route('assistant.show', $uuid))->assertJsonPath('limit_reached', true);
    }

    public function test_html_is_stripped_from_visitor_messages()
    {
        $uuid = $this->start();
        $this->say($uuid, '<script>alert(1)</script>Necesito una página web');

        $content = ChatSession::query()->sole()->messages()->where('role', 'user')->value('content');
        $this->assertSame('alert(1)Necesito una página web', $content);
    }

    public function test_the_assistant_can_be_disabled_from_the_panel()
    {
        Settings::put(Settings::ASSISTANT, [...Settings::get(Settings::ASSISTANT), 'enabled' => false]);

        $this->postJson(route('assistant.start'))->assertNotFound();
        $this->get(route('home'))->assertInertia(fn ($page) => $page->where('site.assistant', false));
    }

    public function test_unknown_conversations_are_not_found()
    {
        $this->getJson(route('assistant.show', '6f1c3a9e-1111-4b8a-9c1d-123456789abc'))->assertNotFound();
    }

    public function test_with_api_key_the_ai_answers_and_its_recommendation_is_validated()
    {
        config(['services.anthropic.key' => 'test-key']);
        $this->app->instance(AiEngine::class, new class implements AssistantEngine
        {
            public function reply(ChatSession $session, string $input): AssistantTurn
            {
                $session->setAnswer('business', 'Spa');
                $session->setAnswer('recommendation', 'management');

                return new AssistantTurn('Te recomiendo un **sistema de gestión**.', ['Solicitar cotización'], 'management', true, 'recommendation');
            }
        });

        $uuid = $this->start();
        $this->assertSame('ai', ChatSession::query()->value('engine'));

        $state = $this->say($uuid, 'Tengo un spa y quiero agenda');
        $this->assertSame('Te recomiendo un **sistema de gestión**.', end($state['messages'])['content']);
        $this->assertSame(1, Assistant::aiCallsToday());
    }

    public function test_if_the_ai_fails_the_conversation_continues_with_the_guided_flow()
    {
        config(['services.anthropic.key' => 'test-key']);
        $this->app->instance(AiEngine::class, new class implements AssistantEngine
        {
            public function reply(ChatSession $session, string $input): AssistantTurn
            {
                throw new RuntimeException('Sin conexión');
            }
        });

        $uuid = $this->start();
        $state = $this->say($uuid, 'Quiero organizar mi negocio');

        $this->assertStringContainsString('¿a qué se dedica tu negocio?', end($state['messages'])['content']);
        $this->assertSame('rules', ChatSession::query()->value('engine'));
    }

    public function test_the_daily_ai_limit_falls_back_to_the_guided_flow()
    {
        config(['services.anthropic.key' => 'test-key', 'services.anthropic.daily_limit' => 0]);

        $this->start();

        $this->assertSame('rules', ChatSession::query()->value('engine'));
        $this->assertFalse(Assistant::aiAvailable());
        Cache::flush();
    }
}
