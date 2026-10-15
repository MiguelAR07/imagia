<?php

namespace App\Http\Controllers\Site;

use App\Models\Plan;
use App\Models\Service;
use App\Support\LeadIntake;
use App\Support\PublicCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Response;
use Throwable;

/**
 * Formularios públicos de cotización y contacto. Cada envío crea un prospecto en el embudo,
 * solo con autorización expresa para tratar los datos.
 */
class LeadFormController extends SiteController
{
    public const NEEDS = [
        'clients' => 'Atraer más clientes',
        'website' => 'Tener una página web',
        'organize' => 'Organizar mi negocio',
        'automate' => 'Automatizar procesos',
        'app' => 'Una app o idea de software',
        'unsure' => 'No estoy seguro',
    ];

    public const BUDGETS = [
        'Menos de 2 millones',
        'Entre 2 y 5 millones',
        'Entre 5 y 15 millones',
        'Más de 15 millones',
        'Aún no lo sé',
    ];

    public const TIMEFRAMES = ['Lo antes posible', 'En 1 a 3 meses', 'Más adelante', 'Sin fecha definida'];

    public function quote(Request $request): Response
    {
        $plan = $request->filled('plan')
            ? Plan::query()->where('slug', $request->string('plan'))->where('is_published', true)->first(['id', 'name', 'slug'])
            : null;

        return $this->page('site/quote', [
            'plans' => PublicCatalog::plans()->map(fn ($p) => ['value' => $p['slug'], 'label' => $p['name']]),
            'services' => Service::query()->where('is_published', true)->orderBy('sort_order')->get(['name', 'slug'])
                ->map(fn ($s) => ['value' => $s->slug, 'label' => $s->name]),
            'needs' => collect(self::NEEDS)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'budgets' => self::BUDGETS,
            'timeframes' => self::TIMEFRAMES,
            'selectedPlan' => $plan?->slug,
            'selectedService' => $request->string('servicio')->toString() ?: null,
            // Datos que llegan de la calculadora de presupuesto (el visitante los puede cambiar).
            'prefill' => $this->prefillFromBudget($request),
        ], 'Solicitar cotización', 'Cuéntanos qué necesitas y te enviamos una propuesta personalizada, sin compromiso.');
    }

    /**
     * @return array{need: string|null, budget: string|null, description: string|null}
     */
    private function prefillFromBudget(Request $request): array
    {
        $budget = (int) preg_replace('/\D/', '', $request->string('presupuesto')->toString());

        return [
            'need' => match ($request->string('objetivo')->toString()) {
                'landing', 'website' => 'website',
                'management' => 'organize',
                'automation' => 'automate',
                default => null,
            },
            'budget' => match (true) {
                $budget <= 0 => null,
                $budget < 2000000 => self::BUDGETS[0],
                $budget < 5000000 => self::BUDGETS[1],
                $budget < 15000000 => self::BUDGETS[2],
                default => self::BUDGETS[3],
            },
            'description' => $request->filled('detalle') ? mb_substr(strip_tags($request->string('detalle')->toString()), 0, 1000) : null,
        ];
    }

    public function storeQuote(Request $request): RedirectResponse
    {
        $this->rejectBots($request);

        $data = $request->validate([
            'need' => ['required', Rule::in(array_keys(self::NEEDS))],
            'service' => ['nullable', 'exists:services,slug'],
            'plan' => ['nullable', Rule::exists('plans', 'slug')->where('is_published', true)],
            'business' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:10', 'max:3000'],
            'budget' => ['nullable', Rule::in(self::BUDGETS)],
            'timeframe' => ['nullable', Rule::in(self::TIMEFRAMES)],
            ...$this->contactRules(),
        ], $this->messages());

        $plan = isset($data['plan']) ? Plan::query()->where('slug', $data['plan'])->first() : null;
        $service = isset($data['service']) ? Service::query()->where('slug', $data['service'])->value('name') : null;

        return $this->register($request, [
            'name' => $data['name'],
            'company' => $data['company'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'need' => trim(self::NEEDS[$data['need']].". Negocio: {$data['business']}.\n\n{$data['description']}"),
            'budget_range' => $data['budget'] ?? null,
            'urgency' => $data['timeframe'] ?? null,
            'recommended_plan_id' => $plan?->id,
        ], array_values(array_filter([
            'Solicitud de cotización.',
            $service ? "Servicio de interés: {$service}." : null,
            $plan ? "Plan elegido: {$plan->name}." : null,
            $request->boolean('wants_meeting') ? 'Quiere agendar una reunión.' : null,
        ])), 'cotizacion');
    }

    public function contact(): Response
    {
        return $this->page('site/contact', [], 'Contacto', 'Escríbenos por WhatsApp, correo o desde el formulario. Te respondemos pronto.');
    }

    public function storeContact(Request $request): RedirectResponse
    {
        $this->rejectBots($request);

        $data = $request->validate([
            'message' => ['required', 'string', 'min:10', 'max:3000'],
            ...$this->contactRules(),
        ], $this->messages());

        return $this->register($request, [
            'name' => $data['name'],
            'company' => $data['company'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'need' => $data['message'],
        ], array_values(array_filter([
            'Mensaje desde el formulario de contacto.',
            $request->boolean('wants_meeting') ? 'Quiere agendar una reunión.' : null,
        ])), 'contacto');
    }

    /** Confirmación: solo se muestra si de verdad se acaba de registrar una solicitud. */
    public function thanks(Request $request): Response|RedirectResponse
    {
        $kind = $request->session()->get('lead_submitted');

        if ($kind === null) {
            return to_route('home');
        }

        return $this->page('site/thanks', [
            'kind' => $kind,
            'name' => $request->session()->get('lead_name'),
        ], 'Solicitud recibida', 'Recibimos tu solicitud.', noindex: true);
    }

    /**
     * @param  array<string, mixed>  $lead
     * @param  list<string>  $details
     */
    private function register(Request $request, array $lead, array $details, string $kind): RedirectResponse
    {
        try {
            LeadIntake::register($lead, 'form', $details);
        } catch (Throwable $e) {
            report($e);

            // No se dice «enviado» si no se guardó: se ofrece otro canal.
            return back()->withErrors(['form' => 'No pudimos guardar tu solicitud en este momento. Inténtalo de nuevo o escríbenos por WhatsApp.'])->withInput();
        }

        return to_route('site.thanks')
            ->with('lead_submitted', $kind)
            ->with('lead_name', strtok($lead['name'], ' '));
    }

    /**
     * Campo trampa: las personas no lo ven; si viene lleno, es un robot.
     * Se responde como si todo saliera bien para no darle pistas.
     */
    private function rejectBots(Request $request): void
    {
        if (filled($request->input('website'))) {
            abort(to_route('site.thanks')->with('lead_submitted', 'ignorado'));
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function contactRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'required_without:phone', 'email', 'max:255'],
            'phone' => ['nullable', 'required_without:email', 'string', 'max:30', 'regex:/^[0-9 +()\-]{7,30}$/'],
            'wants_meeting' => ['boolean'],
            'consent' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function messages(): array
    {
        return [
            'email.required_without' => 'Déjanos un correo o un teléfono para responderte.',
            'phone.required_without' => 'Déjanos un correo o un teléfono para responderte.',
            'phone.regex' => 'Escribe un teléfono válido.',
            'consent.accepted' => 'Necesitamos tu autorización para guardar tus datos y responderte.',
            'description.min' => 'Cuéntanos un poco más (al menos 10 caracteres).',
            'message.min' => 'Cuéntanos un poco más (al menos 10 caracteres).',
        ];
    }
}
