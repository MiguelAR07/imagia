<?php

namespace App\Assistant;

use App\Models\ChatSession;
use App\Models\Faq;
use App\Support\PublicCatalog;
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

    private const UNKNOWN_ANSWER = 'Esa pregunta prefiero que te la responda directamente el equipo, para no darte información equivocada. Al final de la conversación puedes dejarnos tus datos o escribirnos por WhatsApp.';

    /** Palabras que no ayudan a encontrar la pregunta frecuente correcta. */
    private const STOPWORDS = ['como', 'cual', 'cuales', 'cuanto', 'cuanta', 'cuantos', 'cuando', 'donde', 'para', 'por', 'que', 'una', 'uno', 'unos', 'las', 'los', 'del', 'con', 'sin', 'mas', 'pero', 'ustedes', 'tienen', 'hacen', 'puedo', 'puede', 'pueden', 'quiero', 'necesito', 'esto', 'esta', 'este', 'eso', 'tengo', 'hay', 'son', 'sus', 'mis', 'sobre'];

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

        // 0. Si el visitante hace una pregunta, se responde primero y luego se retoma la conversación.
        if ($this->isQuestion($input)) {
            $answer = $this->answerQuestion($input);

            // Sin respuesta, en una pregunta abierta (negocio, idea) el mensaje se toma como la respuesta.
            $freeText = in_array($session->answer('_pending'), ['business', 'idea'], true);

            if ($answer !== null || ($session->answer('_pending') !== null && ! $freeText) || $session->answer('recommendation') !== null) {
                return $this->answerAndResume($session, $input, $answer ?? self::UNKNOWN_ANSWER);
            }
        }

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
     * Responde la pregunta y vuelve al punto de la conversación donde estaba el visitante.
     */
    private function answerAndResume(ChatSession $session, string $input, string $answer): AssistantTurn
    {
        // Ya hubo recomendación: después de responder se ofrecen los siguientes pasos.
        if ($session->answer('recommendation') !== null) {
            return new AssistantTurn("{$answer}\n\n¿Quieres solicitar una cotización o seguir por WhatsApp?", offerActions: true, stage: 'closing');
        }

        $pending = $session->answer('_pending');

        // Primera pregunta de la conversación: si deja ver qué busca, se sigue por ese camino.
        if ($session->answer('intent') === null) {
            $intent = $this->detectIntent($input);

            if ($intent === 'unsure') {
                return new AssistantTurn("{$answer}\n\nY cuéntame, ¿qué te gustaría mejorar o conseguir en tu negocio?", array_values(self::INTENTS), stage: 'start');
            }

            $session->setAnswer('intent', $intent);
            $session->setAnswer('first_message', $input);
            $pending = 'business';
        }

        $next = $this->ask($session, $pending ?? $this->nextQuestion($session) ?? 'business');

        $question = str_replace(['Perfecto. ', 'Sin problema, para eso estoy. '], '', $next->reply);

        return new AssistantTurn("{$answer}\n\nAhora sí, sigamos. {$question}", $next->quickReplies);
    }

    private function isQuestion(string $input): bool
    {
        $text = Str::lower(Str::ascii($input));

        // Sin signos de pregunta solo cuentan inicios claramente interrogativos
        // («que vendo ropa» es una respuesta, no una pregunta).
        return Str::contains($input, ['?', '¿'])
            || preg_match('/^(que es|que significa|para que sirve|cuanto|cuanta|cuantos|cuantas|cuando|cual|cuales|donde|hacen|ofrecen|incluye|incluyen|aceptan)\b/', $text) === 1;
    }

    /**
     * Responde con lo publicado en el panel: preguntas frecuentes, planes y servicios.
     * Si no hay información publicada, no inventa: devuelve null.
     */
    private function answerQuestion(string $input): ?string
    {
        $text = Str::lower(Str::ascii($input));

        // 1. Preguntas frecuentes publicadas (las del sitio, de los planes y de los servicios).
        $faq = $this->matchFaq($text);

        if ($faq !== null) {
            return $faq;
        }

        // 2. «¿Qué es…?»: explicaciones sencillas de cada tipo de solución.
        if (Str::contains($text, ['que es', 'que significa', 'diferencia', 'para que sirve'])) {
            $definition = match (true) {
                Str::contains($text, ['landing']) => 'Una **landing page** es como un volante o un afiche en internet: una sola página enfocada en un producto, servicio o promoción, para que la persona te escriba o te compre.',
                Str::contains($text, ['panel', 'administrador', 'administrativo']) => 'Un **panel de control** es la oficina privada de tu negocio: una parte a la que solo entras tú y tu equipo con usuario y contraseña, para cambiar textos y fotos o ver reservas, clientes y pagos sin saber programar.',
                Str::contains($text, ['software', 'sistema', 'gestion']) => 'Un **software de gestión** es un sistema a la medida para organizar tu negocio (citas, clientes, inventario, pagos y reportes) y reemplazar el cuaderno, el Excel y los mensajes sueltos.',
                Str::contains($text, ['automat']) => 'Una **automatización** hace que tareas repetitivas se hagan solas: recordatorios, reportes o pasar datos de una herramienta a otra.',
                Str::contains($text, ['pagina', 'web', 'sitio']) => 'Una **página web** es tu local en internet, abierto las 24 horas: varias secciones (inicio, servicios, quiénes somos, contacto) que presentan tu negocio y dan confianza.',
                default => null,
            };

            if ($definition !== null) {
                return $definition;
            }
        }

        $plans = PublicCatalog::plans();

        // 3. Precios: solo los configurados.
        if (Str::contains($text, ['precio', 'cuesta', 'costo', 'cobran', 'valor', 'vale', 'tarifa', 'cuanto sale'])) {
            if ($plans->isEmpty()) {
                return 'El valor depende de lo que necesites. Después de conocer tu proyecto te enviamos una propuesta por escrito, sin compromiso.';
            }

            $lines = $plans->map(fn ($p) => "• {$p['name']}: ".PublicCatalog::priceText($p))->implode("\n");

            return "Estos son nuestros planes:\n{$lines}\n\nEl valor final depende del alcance y se confirma en una propuesta por escrito.";
        }

        // 4. Tiempos: solo los estimados configurados en cada plan.
        if (Str::contains($text, ['tiempo', 'tarda', 'demora', 'dura', 'cuando estaria', 'cuando esta', 'plazo', 'entrega'])) {
            $timed = $plans->filter(fn ($p) => filled($p['estimated_time']));

            if ($timed->isEmpty()) {
                return 'El tiempo depende del alcance del proyecto. En la propuesta te damos las fechas de cada etapa por escrito.';
            }

            $lines = $timed->map(fn ($p) => "• {$p['name']}: {$p['estimated_time']}")->implode("\n");

            return "Tiempos estimados:\n{$lines}\n\nLa fecha exacta se define en la propuesta, según el alcance.";
        }

        // 5. Qué ofrecemos: los servicios publicados.
        if (Str::contains($text, ['servicio', 'ofrecen', 'que hacen', 'a que se dedican', 'que venden'])) {
            $services = PublicCatalog::services();

            return $services->isEmpty()
                ? 'Hacemos páginas web, sistemas de gestión para negocios, aplicaciones y automatización de procesos.'
                : 'Ofrecemos: '.$services->pluck('name')->implode(', ').'.';
        }

        return null;
    }

    /**
     * Busca la pregunta frecuente publicada que más palabras comparte con la del visitante.
     */
    private function matchFaq(string $text): ?string
    {
        $words = $this->keywords($text);

        if ($words === []) {
            return null;
        }

        $best = null;
        $bestScore = 0;

        foreach (Faq::query()->where('is_published', true)->get(['question', 'answer']) as $faq) {
            $score = count(array_intersect($words, $this->keywords(Str::lower(Str::ascii($faq->question)))));

            if ($score > $bestScore) {
                [$best, $bestScore] = [$faq->answer, $score];
            }
        }

        // Con preguntas cortas basta una palabra clave en común; con las largas, dos.
        return $bestScore >= min(2, count($words)) ? $best : null;
    }

    /**
     * Raíces de las palabras importantes («precios» y «precio» cuentan igual).
     *
     * @return list<string>
     */
    private function keywords(string $text): array
    {
        preg_match_all('/[a-z]{4,}/', $text, $matches);

        return array_values(array_unique(array_map(
            fn (string $w) => mb_substr($w, 0, 5),
            array_diff($matches[0], self::STOPWORDS),
        )));
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
