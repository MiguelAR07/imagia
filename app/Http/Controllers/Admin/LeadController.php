<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LeadRequest;
use App\Models\Activity;
use App\Models\ChatSession;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\User;
use App\Support\Options;
use App\Support\QuoteAcceptance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:20'],
            'assigned' => ['nullable', 'string', 'max:10'],
        ]);

        $leads = Lead::query()
            ->with('assignee:id,name')
            ->search($filters['q'] ?? null)
            ->when($filters['source'] ?? null, fn ($q, $source) => $q->where('source', $source))
            ->when($filters['assigned'] ?? null, fn ($q, $assigned) => $assigned === 'me'
                ? $q->where('assigned_to', $request->user()->id)
                : $q->whereNull('assigned_to'))
            ->latest()
            ->get()
            ->map(fn (Lead $lead) => $this->card($lead));

        return Inertia::render('admin/leads/index', [
            'stages' => $this->stages(),
            'leads' => $leads,
            'filters' => [
                'q' => $filters['q'] ?? '',
                'source' => $filters['source'] ?? '',
                'assigned' => $filters['assigned'] ?? '',
            ],
            'options' => $this->options(),
        ]);
    }

    public function store(LeadRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['pipeline_stage_id'] ??= PipelineStage::initial()?->id;

        if ($data['pipeline_stage_id'] === null) {
            throw ValidationException::withMessages(['pipeline_stage_id' => 'Primero crea al menos una etapa en el embudo.']);
        }

        $lead = Lead::query()->create($data);
        $lead->logActivity('system', 'Prospecto registrado ('.Lead::SOURCES[$lead->source].').');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Prospecto creado.']);

        return to_route('admin.leads.show', $lead);
    }

    public function show(Lead $lead): Response
    {
        $lead->load(['stage', 'assignee:id,name', 'client:id,name,deleted_at']);

        return Inertia::render('admin/leads/show', [
            'lead' => [
                ...$this->card($lead),
                'email' => $lead->email,
                'phone' => $lead->phone,
                'need' => $lead->need,
                'budget_range' => $lead->budget_range,
                'urgency' => $lead->urgency,
                'assigned_to' => $lead->assigned_to,
                'lost_reason' => $lead->lost_reason,
                'consent_at' => $lead->consent_at?->toIso8601String(),
                'last_contacted_at' => $lead->last_contacted_at?->toIso8601String(),
                'client' => $lead->client?->only(['id', 'name']),
                'archived' => $lead->trashed(),
                'conversation_id' => ChatSession::query()->where('lead_id', $lead->id)->value('id'),
            ],
            'stages' => $this->stages(),
            'activities' => $lead->activities()->with('user:id,name')->limit(100)->get()
                ->map(fn (Activity $a) => $a->toTimelineArray()),
            'options' => [
                ...$this->options(),
                'activity_types' => Options::from(Activity::MANUAL_TYPES),
            ],
        ]);
    }

    public function update(LeadRequest $request, Lead $lead): RedirectResponse
    {
        $data = $request->validated();
        unset($data['pipeline_stage_id']); // la etapa cambia solo con «mover»

        $previousAssignee = $lead->assigned_to;
        $lead->update($data);

        if ((int) $previousAssignee !== (int) $lead->assigned_to) {
            $lead->logActivity('system', $lead->assigned_to
                ? 'Asignado a '.$lead->assignee()->value('name').'.'
                : 'Ya no tiene responsable asignado.');
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Prospecto actualizado.']);

        return back();
    }

    /**
     * Cambia la etapa del embudo. Pasar a una etapa «perdido» exige el motivo.
     */
    public function move(Request $request, Lead $lead): RedirectResponse
    {
        $data = $request->validate([
            'pipeline_stage_id' => ['required', 'exists:pipeline_stages,id'],
            'lost_reason' => ['nullable', 'string', 'max:255'],
        ]);

        $stage = PipelineStage::query()->findOrFail($data['pipeline_stage_id']);

        if ($stage->is_lost && blank($data['lost_reason'] ?? null)) {
            throw ValidationException::withMessages(['lost_reason' => 'Indica por qué se perdió este prospecto.']);
        }

        if ($stage->id !== $lead->pipeline_stage_id) {
            $from = $lead->stage->name;
            $lead->update([
                'pipeline_stage_id' => $stage->id,
                'lost_reason' => $stage->is_lost ? $data['lost_reason'] : null,
            ]);
            $lead->logActivity('status_change', "Movido de «{$from}» a «{$stage->name}».".($stage->is_lost ? ' Motivo: '.$data['lost_reason'] : ''));
        }

        return back();
    }

    /**
     * Crea un cliente con los datos del prospecto y los enlaza. No cambia la etapa:
     * convertir en cliente no significa que la venta se haya cerrado.
     */
    public function convert(Request $request, Lead $lead): RedirectResponse
    {
        if ($lead->client_id !== null) {
            return to_route('admin.clients.show', $lead->client_id);
        }

        $client = QuoteAcceptance::clientFromLead($lead, $request->user()->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cliente creado a partir del prospecto.']);

        return to_route('admin.clients.show', $client);
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $lead->delete();
        $lead->logActivity('system', 'Prospecto archivado.');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Prospecto archivado.']);

        return to_route('admin.leads.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function card(Lead $lead): array
    {
        return [
            'id' => $lead->id,
            'name' => $lead->name,
            'company' => $lead->company,
            'source' => $lead->source,
            'need_excerpt' => str($lead->need ?? '')->limit(110)->toString(),
            'pipeline_stage_id' => $lead->pipeline_stage_id,
            'assignee' => $lead->assignee?->only(['id', 'name']),
            'next_follow_up_at' => $lead->next_follow_up_at?->toDateString(),
            'follow_up_overdue' => $lead->isFollowUpOverdue(),
            'is_client' => $lead->client_id !== null,
            'created_at' => $lead->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function stages(): array
    {
        return PipelineStage::query()->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (PipelineStage $s) => $s->only(['id', 'name', 'color', 'is_won', 'is_lost']))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'sources' => Options::from(Lead::SOURCES),
            'users' => User::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])
                ->map(fn (User $u) => ['value' => (string) $u->id, 'label' => $u->name]),
        ];
    }
}
