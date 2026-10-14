<?php

namespace App\Assistant;

use Anthropic\Beta\Messages\BetaTextBlock;
use Anthropic\Client;
use App\Models\ChatSession;
use App\Support\PublicCatalog;
use App\Support\Settings;
use RuntimeException;

/**
 * Asistente con IA (Claude). Solo conversa y recomienda: no puede guardar datos,
 * enviar correos ni agendar nada; esas acciones las hace el visitante con los botones.
 *
 * Cualquier falla (sin conexión, negativa del modelo, respuesta inválida) lanza una
 * excepción para que el asistente continúe con el flujo guiado por reglas.
 */
class AiEngine implements AssistantEngine
{
    private const STAGES = ['discovery', 'recommendation', 'closing'];

    private const RECOMMENDATIONS = ['none', 'landing', 'website', 'management', 'custom'];

    private const INTENTS = ['clients', 'website', 'organize', 'automate', 'app', 'unsure'];

    /** Mensajes anteriores que se envían como contexto. */
    private const HISTORY_LIMIT = 30;

    public function __construct(private readonly Client $client, private readonly string $model) {}

    public function reply(ChatSession $session, string $input): AssistantTurn
    {
        $message = $this->client->beta->messages->create(
            maxTokens: 4096,
            messages: $this->history($session),
            model: $this->model,
            // Si el modelo declina por política, el servidor reintenta con su modelo alterno.
            fallbacks: 'default',
            outputConfig: [
                'effort' => 'low',
                'format' => ['type' => 'json_schema', 'schema' => self::schema()],
            ],
            system: [['type' => 'text', 'text' => $this->systemPrompt(), 'cacheControl' => ['type' => 'ephemeral']]],
            betas: ['server-side-fallback-2026-07-01'],
        );

        if ($message->stopReason !== 'end_turn') {
            throw new RuntimeException("La IA terminó con «{$message->stopReason}».");
        }

        $text = '';
        foreach ($message->content as $block) {
            if ($block instanceof BetaTextBlock) {
                $text = $block->text;
                break;
            }
        }

        $data = json_decode($text, true);

        if (! is_array($data)) {
            throw new RuntimeException('La IA no devolvió JSON válido.');
        }

        return $this->toTurn($session, $data);
    }

    /**
     * Valida la respuesta del modelo: nada sale al visitante si no tiene la forma esperada.
     *
     * @param  array<string, mixed>  $data
     */
    private function toTurn(ChatSession $session, array $data): AssistantTurn
    {
        $reply = is_string($data['reply'] ?? null) ? trim($data['reply']) : '';

        if ($reply === '' || mb_strlen($reply) > 2000) {
            throw new RuntimeException('La IA devolvió una respuesta vacía o demasiado larga.');
        }

        $quickReplies = collect(is_array($data['quick_replies'] ?? null) ? $data['quick_replies'] : [])
            ->filter(fn ($r) => is_string($r) && trim($r) !== '' && mb_strlen($r) <= 60)
            ->map(fn (string $r) => trim($r))
            ->take(4)->values()->all();

        $stage = in_array($data['stage'] ?? null, self::STAGES, true) ? $data['stage'] : 'discovery';
        $recommendation = in_array($data['recommendation'] ?? null, self::RECOMMENDATIONS, true) ? $data['recommendation'] : 'none';

        if (in_array($data['intent'] ?? null, self::INTENTS, true)) {
            $session->setAnswer('intent', $data['intent']);
        }

        foreach (['business', 'budget', 'urgency', 'need'] as $key) {
            $value = $data[$key] ?? null;

            if (is_string($value) && trim($value) !== '') {
                $session->setAnswer($key, mb_substr(trim($value), 0, 500));
            }
        }

        if ($recommendation !== 'none') {
            $session->setAnswer('recommendation', $recommendation);
        }

        return new AssistantTurn(
            $reply,
            $quickReplies,
            recommendation: $recommendation === 'none' ? null : $recommendation,
            offerActions: $recommendation !== 'none' && $stage !== 'discovery',
            stage: $stage,
        );
    }

    /**
     * Conversación en el formato de la API: empieza con el visitante y alterna los turnos.
     *
     * @return list<array{role: string, content: string}>
     */
    private function history(ChatSession $session): array
    {
        $messages = [];

        foreach ($session->messages()->latest('id')->limit(self::HISTORY_LIMIT)->get()->reverse() as $m) {
            $role = $m->role === 'user' ? 'user' : 'assistant';

            if ($messages === [] && $role === 'assistant') {
                continue;
            }

            $last = array_key_last($messages);

            if ($last !== null && $messages[$last]['role'] === $role) {
                $messages[$last]['content'] .= "\n\n".$m->content;
            } else {
                $messages[] = ['role' => $role, 'content' => $m->content];
            }
        }

        return $messages;
    }

    private function systemPrompt(): string
    {
        $prompt = (string) file_get_contents(resource_path('prompts/assistant.md'));

        return strtr($prompt, [
            '{marca}' => Settings::get(Settings::BRAND)['name'],
            '{catalogo}' => $this->catalog(),
        ]);
    }

    /**
     * Solo lo publicado: servicios y planes, con precio únicamente si está definido.
     */
    private function catalog(): string
    {
        $lines = [];

        foreach (PublicCatalog::services() as $service) {
            $lines[] = "- Servicio «{$service['name']}»: {$service['summary']}";
        }

        foreach (PublicCatalog::plans() as $plan) {
            $price = ' Precio: '.PublicCatalog::priceText($plan).'.';
            $included = collect($plan['included'])->take(8)->implode(', ');

            $lines[] = "- Plan «{$plan['name']}»: {$plan['summary']}".($included !== '' ? " Incluye: {$included}." : '').$price;
        }

        return $lines === []
            ? 'There is no published catalog yet: describe the four solution types in general terms, without prices.'
            : implode("\n", $lines);
    }

    /**
     * @return array<string, mixed>
     */
    private static function schema(): array
    {
        $text = ['type' => 'string'];

        return [
            'type' => 'object',
            'properties' => [
                'reply' => $text,
                'quick_replies' => ['type' => 'array', 'items' => $text],
                'stage' => ['type' => 'string', 'enum' => self::STAGES],
                'recommendation' => ['type' => 'string', 'enum' => self::RECOMMENDATIONS],
                'intent' => ['type' => 'string', 'enum' => self::INTENTS],
                'business' => $text,
                'budget' => $text,
                'urgency' => $text,
                'need' => $text,
            ],
            'required' => ['reply', 'quick_replies', 'stage', 'recommendation', 'intent', 'business', 'budget', 'urgency', 'need'],
            'additionalProperties' => false,
        ];
    }
}
