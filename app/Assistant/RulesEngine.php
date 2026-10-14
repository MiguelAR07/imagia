<?php

namespace App\Assistant;

use App\Models\ChatSession;
use Illuminate\Support\Str;

/**
 * Asistente guiado por reglas: hace una pregunta a la vez, se adapta a lo que el
 * visitante elige y termina con una recomendación. Funciona sin IA y es el respaldo
 * cuando la IA no está configurada o falla.
 *
 * Cada pregunta guarda su respuesta en $session->answers y define cuál es la siguiente.
 */
class RulesEngine implements AssistantEngine
{
    public const INTENTS = [
        'clients' => 'Quiero atraer más clientes',
        'website' => 'Necesito una página web',
        'organize' => 'Quiero organizar mi negocio',
        'automate' => 'Necesito automatizar procesos',
        'app' => 'Tengo una idea de software',
        'unsure' => 'No sé qué solución necesito',
    ];

    public const BUDGETS = ['Menos de 2 millones', 'Entre 2 y 5 millones', 'Entre 5 y 15 millones', 'Más de 15 millones', 'Aún no lo sé'];

    public const TIMEFRAMES = ['Lo antes posible', 'En 1 a 3 meses', 'Más adelante', 'Solo estoy explorando'];

    /** Recorrido de preguntas según el objetivo. */
    private const PATHS = [
        'clients' => ['business', 'has_website', 'scope', 'budget', 'urgency'],
        'website' => ['business', 'has_website', 'scope', 'budget', 'urgency'],
        'organize' => ['business', 'management', 'module', 'budget', 'urgency'],
        'automate' => ['business', 'task', 'tools', 'budget', 'urgency'],
        'app' => ['business', 'idea', 'users', 'budget', 'urgency'],
        'unsure' => ['business', 'goal'],
    ];

    /**
     * @return array<string, array{question: string, options?: list<string>}>
     */
    private function questions(): array
    {
        return [
            'business' => ['question' => 'Perfecto. Para orientarte bien, ¿a qué se dedica tu negocio?'],
            'has_website' => ['question' => '¿Actualmente tienes una página web?', 'options' => ['No tengo', 'Sí, pero no me sirve', 'Sí, y quiero mejorarla']],
            'scope' => ['question' => '¿Qué te gustaría mostrar en internet?', 'options' => ['Un servicio o una promoción', 'Varios servicios e información de la empresa', 'Vender o recibir reservas en línea']],
            'management' => ['question' => '¿Cómo gestionas hoy tus clientes o procesos?', 'options' => ['WhatsApp y papel', 'Hojas de Excel', 'Un programa que no me sirve', 'No lo gestiono']],
            'module' => ['question' => '¿Qué te gustaría controlar primero?', 'options' => ['Citas y reservas', 'Inventario', 'Clientes y ventas', 'Usuarios y permisos', 'Varias cosas a la vez']],
            'task' => ['question' => '¿Qué tarea repetitiva te quita más tiempo?', 'options' => ['Responder mensajes', 'Registrar datos a mano', 'Enviar recordatorios', 'Hacer reportes']],
            'tools' => ['question' => '¿Usas otras herramientas que habría que conectar? (por ejemplo, contabilidad, tienda o correo)', 'options' => ['Sí, varias', 'Solo una', 'No', 'No estoy seguro']],
            'idea' => ['question' => 'Cuéntame tu idea en pocas palabras: ¿qué debería hacer el software?'],
            'users' => ['question' => '¿Quién la usaría?', 'options' => ['Mis clientes', 'Mi equipo', 'Ambos']],
            'goal' => ['question' => 'Sin problema, para eso estoy. ¿Qué te gustaría mejorar primero?', 'options' => ['Que me encuentren más clientes en internet', 'Organizar mejor mi trabajo', 'Ahorrar tiempo en tareas repetitivas']],
            'budget' => ['question' => '¿Tienes un presupuesto aproximado en mente? Me ayuda a proponerte algo realista.', 'options' => self::BUDGETS],
            'urgency' => ['question' => 'Última pregunta: ¿para cuándo lo necesitas?', 'options' => self::TIMEFRAMES],
        ];
    }

    public static function greeting(string $custom = ''): AssistantTurn
    {
        $text = $custom !== '' ? $custom
            : '¡Hola! Soy tu asistente de soluciones digitales. Te ayudaré a encontrar la mejor opción para tu negocio. Cuéntame, ¿qué te gustaría mejorar o conseguir?';

        return new AssistantTurn($text, array_values(self::INTENTS), stage: 'start');
    }

    public function reply(ChatSession $session, string $input): AssistantTurn
    {
        $input = trim($input);

        // 1. Sin objetivo todavía: lo detectamos por la opción elegida o por palabras clave.
        if ($session->answer('intent') === null) {
            $session->setAnswer('intent', $this->detectIntent($input));
            $session->setAnswer('first_message', $input);

            return $this->ask($session, 'business');
        }

        // 2. Ya hay recomendación: la conversación pasa a los siguientes pasos.
        if ($session->answer('recommendation') !== null) {
            return $this->afterRecommendation($session);
        }

        // 3. Guarda la respuesta a la pregunta pendiente y pasa a la siguiente.
        $pending = $session->answer('_pending');

        if ($pending !== null) {
            $session->setAnswer($pending, $this->matchOption($pending, $input));

            // «No sé qué necesito»: la respuesta a «goal» define el recorrido real.
            if ($pending === 'goal') {
                $session->setAnswer('intent', match ($session->answer('goal')) {
                    'Organizar mejor mi trabajo' => 'organize',
                    'Ahorrar tiempo en tareas repetitivas' => 'automate',
                    default => 'clients',
                });
            }
        }

        $next = $this->nextQuestion($session);

        return $next !== null ? $this->ask($session, $next) : $this->recommend($session);
    }

    private function ask(ChatSession $session, string $key): AssistantTurn
    {
        $session->setAnswer('_pending', $key);
        $q = $this->questions()[$key];

        return new AssistantTurn($q['question'], $q['options'] ?? []);
    }

    private function nextQuestion(ChatSession $session): ?string
    {
        foreach (self::PATHS[$session->answer('intent')] ?? self::PATHS['unsure'] as $key) {
            if ($session->answer($key) === null) {
                return $key;
            }
        }

        return null;
    }

    /**
     * Elige la solución según las respuestas y explica por qué.
     */
    private function recommend(ChatSession $session): AssistantTurn
    {
        $intent = $session->answer('intent');
        $scope = $session->answer('scope');

        $key = match (true) {
            $intent === 'organize' => 'management',
            in_array($intent, ['automate', 'app'], true) => 'custom',
            $scope === 'Vender o recibir reservas en línea' => 'custom',
            $scope === 'Varios servicios e información de la empresa' => 'website',
            default => 'landing',
        };

        $session->setAnswer('recommendation', $key);
        $session->setAnswer('_pending', null);

        $reason = match ($key) {
            'landing' => 'Como quieres mostrar lo que ofreces y recibir contactos, te recomiendo una **landing page**: una página enfocada en convertir visitas en clientes, con formulario y botón de WhatsApp.',
            'website' => 'Como necesitas presentar varios servicios e información de tu empresa, te recomiendo una **página web profesional** con varias secciones, formularios y buen posicionamiento básico.',
            'management' => 'Por lo que me cuentas'.($session->answer('module') ? ' ('.mb_strtolower((string) $session->answer('module')).')' : '').', te recomiendo un **sistema de gestión**: un panel propio para organizar la información, con usuarios y permisos.',
            default => 'Lo que necesitas es específico, así que te recomiendo una **solución a la medida**: la diseñamos según tus procesos y la conectamos con las herramientas que ya usas.',
        };

        $missing = 'Para definir el alcance exacto y darte un valor, falta conversar sobre los detalles de tu negocio.';

        return new AssistantTurn(
            "{$reason}\n\n{$missing} ¿Cómo quieres continuar?",
            recommendation: $key,
            offerActions: true,
            stage: 'recommendation',
        );
    }

    private function afterRecommendation(ChatSession $session): AssistantTurn
    {
        return new AssistantTurn(
            'Puedo ayudarte a solicitar una cotización, abrir WhatsApp con un resumen de lo que conversamos o agendar una reunión. ¿Qué prefieres?',
            offerActions: true,
            stage: 'closing',
        );
    }

    /**
     * Si el texto coincide con una opción de la pregunta, guarda la opción; si no, el texto tal cual.
     */
    private function matchOption(string $key, string $input): string
    {
        $options = $this->questions()[$key]['options'] ?? [];
        $normalized = Str::lower(Str::ascii($input));

        foreach ($options as $option) {
            if (Str::lower(Str::ascii($option)) === $normalized) {
                return $option;
            }
        }

        return mb_substr($input, 0, 500);
    }

    private function detectIntent(string $input): string
    {
        $match = array_search($input, self::INTENTS, true);

        if (is_string($match)) {
            return $match;
        }

        $text = Str::lower(Str::ascii($input));

        return match (true) {
            Str::contains($text, ['cita', 'reserva', 'inventario', 'organiz', 'control', 'gestion', 'usuarios']) => 'organize',
            Str::contains($text, ['automat', 'repetit', 'integra', 'conectar']) => 'automate',
            Str::contains($text, ['app', 'aplicacion', 'software', 'idea', 'plataforma', 'sistema']) => 'app',
            Str::contains($text, ['pagina', 'web', 'sitio', 'landing']) => 'website',
            Str::contains($text, ['cliente', 'venta', 'vender', 'marketing']) => 'clients',
            default => 'unsure',
        };
    }
}
