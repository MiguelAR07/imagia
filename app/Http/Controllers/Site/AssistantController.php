<?php

namespace App\Http\Controllers\Site;

use App\Assistant\Assistant;
use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Support\LeadIntake;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

/**
 * Endpoints del asistente del sitio (JSON). La conversación se identifica por su UUID,
 * que solo conoce el navegador del visitante.
 */
class AssistantController extends Controller
{
    public function __construct(private readonly Assistant $assistant)
    {
        abort_unless(Assistant::enabled(), 404);
    }

    public function start(Request $request): JsonResponse
    {
        $session = $this->assistant->start((string) $request->ip());

        return response()->json($this->assistant->state($session), 201);
    }

    public function show(ChatSession $chatSession): JsonResponse
    {
        return response()->json($this->assistant->state($chatSession));
    }

    public function message(Request $request, ChatSession $chatSession): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:'.Assistant::MAX_LENGTH],
        ], [
            'content.required' => 'Escribe un mensaje.',
            'content.max' => 'El mensaje es muy largo (máximo '.Assistant::MAX_LENGTH.' caracteres).',
        ]);

        if ($this->assistant->limitReached($chatSession)) {
            return response()->json([
                'message' => 'Esta conversación llegó a su límite. Puedes solicitar una cotización o escribirnos por WhatsApp.',
            ], 429);
        }

        $this->assistant->respond($chatSession, trim(strip_tags($data['content'])));

        return response()->json($this->assistant->state($chatSession->refresh()));
    }

    /**
     * El visitante deja sus datos desde el chat: se crea el prospecto con el resumen de la conversación.
     */
    public function contact(Request $request, ChatSession $chatSession): JsonResponse
    {
        // Campo trampa: si viene lleno es un robot; se responde igual para no darle pistas.
        if (filled($request->input('website'))) {
            return response()->json($this->assistant->state($chatSession));
        }

        if ($chatSession->lead_id !== null) {
            return response()->json(['message' => 'Ya recibimos tus datos en esta conversación.'], 409);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'required_without:phone', 'email', 'max:255'],
            'phone' => ['nullable', 'required_without:email', 'string', 'max:30', 'regex:/^[0-9 +()\-]{7,30}$/'],
            'wants_meeting' => ['boolean'],
            'consent' => ['accepted'],
        ], [
            'email.required_without' => 'Déjanos un correo o un teléfono para responderte.',
            'phone.required_without' => 'Déjanos un correo o un teléfono para responderte.',
            'phone.regex' => 'Escribe un teléfono válido.',
            'consent.accepted' => 'Necesitamos tu autorización para guardar tus datos y responderte.',
        ]);

        $summary = $this->assistant->summary($chatSession);

        try {
            $lead = LeadIntake::register([
                'name' => $data['name'],
                'company' => $data['company'] ?? null,
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'need' => $summary !== '' ? $summary : null,
                'budget_range' => $chatSession->answer('budget'),
                'urgency' => $chatSession->answer('urgency'),
                'recommended_plan_id' => $chatSession->recommended_plan_id,
            ], 'chatbot', array_values(array_filter([
                'Dejó sus datos en la conversación #'.$chatSession->id.' del asistente.',
                $request->boolean('wants_meeting') ? 'Quiere agendar una reunión.' : null,
            ])));
        } catch (Throwable $e) {
            report($e);

            // No se dice «guardado» si no se guardó.
            return response()->json([
                'message' => 'No pudimos guardar tus datos en este momento. Inténtalo de nuevo o escríbenos por WhatsApp.',
            ], 500);
        }

        $chatSession->forceFill(['lead_id' => $lead->id, 'status' => 'converted'])->save();
        $chatSession->logActivity('system', "Dejó sus datos de contacto: se creó el prospecto «{$lead->name}».");

        $firstName = strtok($data['name'], ' ');
        $this->assistant->note($chatSession, $request->boolean('wants_meeting')
            ? "¡Gracias, {$firstName}! Guardamos tus datos y tu solicitud de reunión. El equipo te contactará para acordar la fecha."
            : "¡Gracias, {$firstName}! Guardamos tus datos. El equipo revisará tu caso y te contactará para enviarte una propuesta.");
        $chatSession->save();

        return response()->json($this->assistant->state($chatSession->refresh()));
    }
}
