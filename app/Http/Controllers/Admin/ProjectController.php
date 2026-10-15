<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProjectRequest;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Deliverable;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\File;
use App\Models\Milestone;
use App\Models\Payment;
use App\Models\PaymentLink;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Payments\Wompi;
use App\Support\Options;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:20'],
            'priority' => ['nullable', Rule::in(array_keys(Project::PRIORITIES))],
            'client' => ['nullable', 'integer'],
        ]);
        $status = $filters['status'] ?? '';

        $projects = Project::query()
            ->with('client:id,name')
            ->withSum('tasks as total_weight', 'weight')
            ->withSum(['tasks as done_weight' => fn (Builder $q) => $q->where('status', 'done')], 'weight')
            ->when($status === 'archived', fn ($q) => $q->onlyTrashed())
            ->when($status === 'open', fn ($q) => $q->whereNotIn('status', Project::CLOSED_STATUSES))
            ->when(array_key_exists($status, Project::STATUSES), fn ($q) => $q->where('status', $status))
            ->when($filters['priority'] ?? null, fn ($q, $p) => $q->where('priority', $p))
            ->when($filters['client'] ?? null, fn ($q, $c) => $q->where('client_id', $c))
            ->search($filters['q'] ?? null)
            ->orderByRaw('due_date is null')
            ->orderBy('due_date')
            ->limit(500)
            ->get();

        return Inertia::render('admin/projects/index', [
            'projects' => $projects->map(fn (Project $p) => $this->summary($p)),
            'milestones' => Milestone::query()
                ->whereIn('project_id', $projects->pluck('id'))
                ->whereNotNull('due_date')
                ->get(['id', 'project_id', 'name', 'due_date', 'completed_at'])
                ->map(fn (Milestone $m) => [
                    'id' => $m->id,
                    'project_id' => $m->project_id,
                    'name' => $m->name,
                    'due_date' => $m->due_date->toDateString(),
                    'completed' => $m->completed_at !== null,
                ]),
            'filters' => [
                'q' => $filters['q'] ?? '',
                'status' => $status,
                'priority' => $filters['priority'] ?? '',
                'client' => isset($filters['client']) ? (string) $filters['client'] : '',
            ],
            'options' => $this->options(),
        ]);
    }

    public function store(ProjectRequest $request): RedirectResponse
    {
        $data = $this->normalize($request->validated());
        $project = Project::query()->create($data);

        $project->logActivity('system', 'Proyecto creado.');
        $project->client->logActivity('system', "Nuevo proyecto: «{$project->name}».");

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto creado.']);

        return to_route('admin.projects.show', $project);
    }

    public function show(Project $project): Response
    {
        $project->load([
            'client:id,name,deleted_at',
            'tasks' => fn ($q) => $q->with('assignee:id,name')->withCount('comments')->orderBy('sort_order')->orderBy('id'),
            'milestones',
            'deliverables',
            'files.uploader:id,name',
        ]);

        return Inertia::render('admin/projects/show', [
            'project' => [
                ...$this->summary($project),
                ...$project->only(['description', 'category', 'currency', 'progress_mode', 'manual_progress', 'observations']),
                'start_date' => $project->start_date?->toDateString(),
                'agreed_amount' => $project->agreed_amount,
                'completed_at' => $project->completed_at?->toIso8601String(),
            ],
            'tasks' => $project->tasks->map(fn (Task $t) => $t->toCardArray()),
            'milestones' => $project->milestones->map(fn (Milestone $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'due_date' => $m->due_date?->toDateString(),
                'completed_at' => $m->completed_at?->toIso8601String(),
                'tasks_total' => $project->tasks->where('milestone_id', $m->id)->count(),
                'tasks_done' => $project->tasks->where('milestone_id', $m->id)->where('status', 'done')->count(),
            ]),
            'deliverables' => $project->deliverables->map(fn (Deliverable $d) => [
                ...$d->only(['id', 'name', 'description', 'status', 'is_visible_to_client']),
                'due_date' => $d->due_date?->toDateString(),
                'delivered_at' => $d->delivered_at?->toIso8601String(),
            ]),
            'files' => $project->files->map(fn (File $f) => [
                'id' => $f->id,
                'name' => $f->original_name,
                'size' => $f->size,
                'mime_type' => $f->mime_type,
                'uploaded_by' => $f->uploader?->name,
                'created_at' => $f->created_at?->toIso8601String(),
            ]),
            'activities' => $project->activities()->with('user:id,name')->limit(100)->get()
                ->map(fn (Activity $a) => $a->toTimelineArray()),
            // Las cifras de dinero solo para quien puede ver finanzas.
            'finance' => request()->user()->can('finanzas.ver') ? [
                ...$project->finance(),
                'payments' => $project->payments()->get()->map(fn (Payment $p) => [
                    ...$p->only(['id', 'project_id', 'amount', 'currency', 'method', 'reference', 'notes']),
                    'paid_on' => $p->paid_on->toDateString(),
                ]),
                'expense_items' => $project->expenses()->with('category:id,name')->get()->map(fn (Expense $e) => [
                    ...$e->only(['id', 'project_id', 'description', 'vendor', 'amount', 'currency', 'is_recurring']),
                    'spent_on' => $e->spent_on->toDateString(),
                    'category' => $e->category?->name,
                ]),
                'methods' => Options::from(Payment::METHODS),
                'categories' => ExpenseCategory::query()->orderBy('name')->pluck('name'),
                'online' => [
                    'enabled' => Wompi::configured(),
                    'sandbox' => Wompi::sandbox(),
                    'links' => $project->paymentLinks()->latest()->get()->map(fn (PaymentLink $l) => [
                        ...$l->only(['id', 'amount', 'currency', 'description', 'status', 'last_transaction_status', 'payment_method_type']),
                        'url' => route('site.pay', $l),
                        'paid_at' => $l->paid_at?->toIso8601String(),
                        'created_at' => $l->created_at?->toIso8601String(),
                    ]),
                ],
            ] : null,
            'options' => [
                ...$this->options(),
                'task_statuses' => Options::from(Task::STATUSES),
                'deliverable_statuses' => Options::from(Deliverable::STATUSES),
                'activity_types' => Options::from(Activity::MANUAL_TYPES),
            ],
        ]);
    }

    public function update(ProjectRequest $request, Project $project): RedirectResponse
    {
        $project->fill($this->normalize($request->validated()));
        $changes = $this->describeChanges($project);
        $project->save();

        foreach ($changes as $change) {
            $project->logActivity('status_change', $change);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto actualizado.']);

        return back();
    }

    /** Cambio rápido de estado (tablero Kanban). */
    public function updateStatus(Request $request, Project $project): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(array_keys(Project::STATUSES))]]);

        $project->fill($this->normalize($data));
        $changes = $this->describeChanges($project);
        $project->save();

        foreach ($changes as $change) {
            $project->logActivity('status_change', $change);
        }

        return back();
    }

    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();
        $project->logActivity('system', 'Proyecto archivado.');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Proyecto archivado.']);

        return to_route('admin.projects.index');
    }

    public function restore(Project $project): RedirectResponse
    {
        $project->restore();
        $project->logActivity('system', 'Proyecto restaurado.');

        return to_route('admin.projects.show', $project);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        if (($data['progress_mode'] ?? null) === 'tasks') {
            $data['manual_progress'] = null;
        }

        return $data;
    }

    /**
     * Describe en palabras los cambios importantes, para el historial. También fija
     * la fecha de finalización al marcar el proyecto como entregado.
     *
     * @return list<string>
     */
    private function describeChanges(Project $project): array
    {
        $changes = [];

        if ($project->isDirty('status')) {
            $changes[] = 'Estado: «'.Project::STATUSES[$project->getOriginal('status')].'» → «'.Project::STATUSES[$project->status].'».';
            $project->completed_at = $project->status === 'delivered' ? now() : null;
        }

        if ($project->isDirty('due_date')) {
            $before = $project->getOriginal('due_date')?->format('d/m/Y') ?? 'sin fecha';
            $after = $project->due_date?->format('d/m/Y') ?? 'sin fecha';
            $changes[] = "Fecha de entrega: {$before} → {$after}.";
        }

        if ($project->isDirty('priority')) {
            $changes[] = 'Prioridad: '.Project::PRIORITIES[$project->priority].'.';
        }

        if ($project->isDirty('agreed_amount')) {
            $changes[] = 'Valor contratado actualizado.';
        }

        return $changes;
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Project $project): array
    {
        $total = (int) ($project->total_weight ?? $project->tasks->sum('weight'));
        $done = (int) ($project->done_weight ?? $project->tasks->where('status', 'done')->sum('weight'));

        return [
            'id' => $project->id,
            'name' => $project->name,
            'client' => $project->client?->only(['id', 'name']),
            'status' => $project->status,
            'priority' => $project->priority,
            'category' => $project->category,
            'due_date' => $project->due_date?->toDateString(),
            'progress' => $project->progress_mode === 'manual'
                ? (int) $project->manual_progress
                : ($total > 0 ? (int) round($done * 100 / $total) : 0),
            'progress_is_manual' => $project->progress_mode === 'manual',
            'overdue' => $project->isOverdue(),
            'archived' => $project->trashed(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'statuses' => Options::from(Project::STATUSES),
            'priorities' => Options::from(Project::PRIORITIES),
            'categories' => Options::from(Project::CATEGORIES),
            'clients' => Client::query()->orderBy('name')->get(['id', 'name'])
                ->map(fn (Client $c) => ['value' => (string) $c->id, 'label' => $c->name]),
            'users' => User::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])
                ->map(fn (User $u) => ['value' => (string) $u->id, 'label' => $u->name]),
        ];
    }
}
