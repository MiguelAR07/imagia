<?php

namespace App\Assistant;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\Plan;
use App\Support\PublicCatalog;
use App\Support\Settings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;

/**
 * Coordina el asistente del sitio: crea las conversaciones, elige el motor (IA o reglas),
 * guarda cada mensaje y arma el resumen que ve el equipo y el visitante.
 */
class Assistant
{
    /** Mensajes que puede enviar un visitante en una misma conversación. */
    public const MAX_USER_MESSAGES = 30;

    public const MAX_LENGTH = 1000;

    public const RECOMMENDATIONS = [
        'landing' => 'Landing page',
        'website' => 'Página web profesional',
        'management' => 'Sistema de gestión',
        'custom' => 'Solución a la medida',
    ];

    public function __construct(private readonly RulesEngine $rules) {}

    public static function enabled(): bool
    {
        return (bool) Settings::get(Settings::ASSISTANT)['enabled'];
    }

    /**
     * La IA se usa solo si está activada en el panel, hay clave en .env y no se llegó al tope diario.
     */
    public static function aiAvailable(): bool
    {
        return Settings::get(Settings::ASSISTANT)['use_ai']
            && filled(config('services.anthropic.key'))
            && self::aiCallsToday() < config('services.anthropic.daily_limit');
    }

    public static function aiCallsToday(): int
    {
        return (int) Cache::get(self::counterKey(), 0);
    }

    public function start(string $ip): ChatSession
    {
        $session = ChatSession::query()->create([
            'uuid' => (string) Str::uuid(),
            'ip_hash' => hash_hmac('sha256', $ip, (string) config('app.key')),
            'engine' => self::aiAvailable() ? 'ai' : 'rules',
            'answers' => [],
            'status' => 'open',
            'attention_status' => 'new',
            'last_message_at' => now(),
        ]);

        $this->store($session, RulesEngine::greeting((string) Settings::get(Settings::ASSISTANT)['greeting']));

        return $session;
    }

    public function respond(ChatSession $session, string $input): ChatMessage
    {
        $session->messages()->create(['role' => 'user', 'content' => $input]);

        $turn = $this->engineReply($session, $input);
        $message = $this->store($session, $turn);

        if ($turn->recommendation !== null) {
            $session->forceFill(['recommended_plan_id' => $this->planFor($turn->recommendation)?->id]);
        }

        $session->summary = $this->summary($session);
        $session->save();

        return $message;
    }

    /**
     * Mensaje del asistente que solo informa algo que ya ocurrió (por ejemplo, datos guardados).
     */
    public function note(ChatSession $session, string $text): ChatMessage
    {
        return $this->store($session, new AssistantTurn($text, stage: 'closing'));
    }

    public function limitReached(ChatSession $session): bool
    {
        return $session->userMessageCount() >= self::MAX_USER_MESSAGES;
    }

    /**
     * Resumen en texto plano: lo ve el visitante, va en el mensaje de WhatsApp y en el prospecto.
     */
    public function summary(ChatSession $session): string
    {
        $intent = $session->answer('intent');
        $recommendation = $session->answer('recommendation');
        // El primer mensaje solo aporta si el visitante lo escribió (no si tocó una opción).
        $firstMessage = $session->answer('first_message');
        $firstMessage = in_array($firstMessage, RulesEngine::INTENTS, true) ? null : $firstMessage;

        return collect([
            'Objetivo' => $intent !== null ? (RulesEngine::INTENTS[$intent] ?? null) : null,
            'Negocio' => $session->answer('business'),
            'Necesidad' => $session->answer('need') ?? $session->answer('idea') ?? $firstMessage,
            'Situación actual' => $session->answer('has_website') ?? $session->answer('management'),
            'Prioridad' => $session->answer('scope') ?? $session->answer('module') ?? $session->answer('task'),
            'Presupuesto' => $session->answer('budget'),
            'Para cuándo' => $session->answer('urgency'),
            'Recomendación' => $recommendation !== null ? (self::RECOMMENDATIONS[$recommendation] ?? null) : null,
        ])->filter(fn ($v) => is_string($v) && $v !== '')
            ->map(fn (string $v, string $label) => "{$label}: {$v}")
            ->implode("\n");
    }

    /**
     * Estado de la conversación para el navegador. Solo datos públicos.
     *
     * @return array<string, mixed>
     */
    public function state(ChatSession $session): array
    {
        $plan = $session->recommended_plan_id !== null
            ? PublicCatalog::plans()->firstWhere('id', $session->recommended_plan_id)
            : null;

        return [
            'uuid' => $session->uuid,
            'messages' => $session->messages()->get()->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'role' => $m->role,
                'content' => $m->content,
                'quick_replies' => $m->meta['quick_replies'] ?? [],
                'offer_actions' => (bool) ($m->meta['offer_actions'] ?? false),
            ]),
            'plan' => $plan,
            'recommendation' => $session->answer('recommendation'),
            'summary' => $session->summary,
            'has_contact' => $session->lead_id !== null,
            'limit_reached' => $this->limitReached($session),
            'max_length' => self::MAX_LENGTH,
        ];
    }

    /**
     * Plan configurado para una recomendación; solo si está publicado.
     */
    public function planFor(string $recommendation): ?Plan
    {
        $slug = Settings::get(Settings::ASSISTANT)['plans'][$recommendation] ?? null;

        return $slug ? Plan::query()->where('slug', $slug)->where('is_published', true)->first() : null;
    }

    private function engineReply(ChatSession $session, string $input): AssistantTurn
    {
        if ($session->engine === 'ai' && self::aiAvailable()) {
            try {
                Cache::add(self::counterKey(), 0, now()->endOfDay());
                Cache::increment(self::counterKey());

                return app(AiEngine::class)->reply($session, $input);
            } catch (Throwable $e) {
                report($e);
            }
        }

        // Sin IA (o si falló) la conversación sigue con el flujo guiado, sin volver a intentarlo.
        $session->engine = 'rules';

        return $this->rules->reply($session, $input);
    }

    private function store(ChatSession $session, AssistantTurn $turn): ChatMessage
    {
        $session->last_message_at = now();

        return $session->messages()->create([
            'role' => 'assistant',
            'content' => $turn->reply,
            'meta' => [
                'quick_replies' => $turn->quickReplies,
                'offer_actions' => $turn->offerActions,
                'recommendation' => $turn->recommendation,
                'stage' => $turn->stage,
                'engine' => $session->engine,
            ],
        ]);
    }

    private static function counterKey(): string
    {
        return 'assistant:ai-calls:'.now()->toDateString();
    }
}
