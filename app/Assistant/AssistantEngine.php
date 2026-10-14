<?php

namespace App\Assistant;

use App\Models\ChatSession;

interface AssistantEngine
{
    /**
     * Responde al último mensaje del visitante. El mensaje ya está guardado en la sesión.
     */
    public function reply(ChatSession $session, string $input): AssistantTurn;
}
