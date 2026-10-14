<?php

namespace App\Assistant;

/**
 * Respuesta del asistente en un turno. La misma forma sirve para el motor de reglas y para la IA.
 */
final class AssistantTurn
{
    /**
     * @param  list<string>  $quickReplies  Opciones que el visitante puede tocar
     * @param  string|null  $recommendation  landing|website|management|custom
     * @param  bool  $offerActions  Mostrar cotizar / WhatsApp / reunión / resumen
     */
    public function __construct(
        public readonly string $reply,
        public readonly array $quickReplies = [],
        public readonly ?string $recommendation = null,
        public readonly bool $offerActions = false,
        public readonly string $stage = 'discovery',
    ) {}
}
