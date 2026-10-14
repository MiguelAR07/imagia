<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Support\Notify;
use App\Support\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /**
     * Todas las tareas, con filtros por vencimiento, estado, proyecto y responsable.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:20'],
            'project' => ['nullable', 'integer'],
            'assignee' => ['nullable', 'string', 'max:10'],
            'due' => ['nullable', Rule::in(['overdue', 'today', 'week', 'none'])],
        ]);
        $status = $filters['status'] ?? 'pending';

        $tasks = Task::query()
            ->with(['assignee:id,name', 'project:id,name,deleted_at'])
            ->withCount('comments')
            // Excluye tareas de proyectos archivados (la relación incluye archivados a propósito).
            ->whereHas('project', fn ($q) => $q->whereNull('projects.deleted_at'))
            ->when($status === 'pending', fn ($q) => $q->where('status', '!=', 'done'))
            ->when(array_key_exists($status, Task::STATUSES), fn ($q) => $q->where('status', $status))
            ->when($filters['project'] ?? null, fn ($q, $p) => $q->where('project_id', $p))
            ->when($filters['assignee'] ?? null, fn ($q, $a) => match ($a) {
                'me' => $q->where('assignee_id', $request->user()->id),
                'none' => $q->whereNull('assignee_id'),
                default => $q->where('assignee_id', (int) $a),
            })
            ->when($filters['due'] ?? null, fn ($q, $due) => match ($due) {
                'overdue' => $q->where('status', '!=', 'done')->whereDate('due_date', '<', today()),
                'today' => $q->whereDate('due_date', today()),
                'week' => $q->whereBetween('due_date', [today(), today()->addDays(7)]),
                'none' => $q->whereNull('due_date'),
            })
            ->when(trim((string) ($filters['q'] ?? '')) !== '', fn ($q) => $q->where('title', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], trim($filters['q'])).'%'))
            ->orderByRaw('due_date is null')
            ->orderBy('due_date')
            ->orderByDesc('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (Task $t) => [
                ...$t->toCardArray(),
                'project' => $t->project?->only(['id', 'name']),
            ]);

        return Inertia::render('admin/tasks/index', [
            'tasks' => $tasks,
            'filters' => [
                'q' => $filters['q'] ?? '',
                'status' => $status,
                'project' => isset($filters['project']) ? (string) $filters['project'] : '',
                'assignee' => $filters['assignee'] ?? '',
                'due' => $filters['due'] ?? '',
            ],
            'options' => [
                'statuses' => Options::from(Task::STATUSES),
                'priorities' => Options::from(Project::PRIORITIES),
                'projects' => Project::query()->orderBy('name')->get(['id', 'name'])
                    ->map(fn (Project $p) => ['value' => (string) $p->id, 'label' => $p->name]),
                'users' => User::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])
                    ->map(fn (User $u) => ['value' => (string) $u->id, 'label' => $u->name]),
            ],
        ]);
    }

    public function store(TaskRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $project = Project::query()->findOrFail($data['project_id']);

        $task = $project->tasks()->create([
            ...collect($data)->except('project_id')->all(),
            'sort_order' => (int) $project->tasks()->max('sort_order') + 1,
        ]);
        $this->notifyAssignee($task, null, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tarea creada.']);

        return back();
    }

    /**
     * Detalle de una tarea con sus comentarios (se abre en un panel lateral).
     */
    public function show(Task $task): array
    {
        $task->load(['assignee:id,name', 'comments.user:id,name', 'project:id,name,deleted_at']);

        return [
            ...$task->toCardArray(),
            'project' => $task->project?->only(['id', 'name']),
            'comments' => $task->comments->map(fn (TaskComment $c) => [
                'id' => $c->id,
                'body' => $c->body,
                'user' => $c->user?->only(['id', 'name']),
                'created_at' => $c->created_at?->toIso8601String(),
            ]),
        ];
    }

    public function update(TaskRequest $request, Task $task): RedirectResponse
    {
        $previousAssignee = $task->assignee_id;
        $task->update($request->validated());
        $this->notifyAssignee($task, $previousAssignee, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tarea actualizada.']);

        return back();
    }

    /**
     * Avisa al nuevo responsable (no si se la asignó a sí mismo).
     */
    private function notifyAssignee(Task $task, ?int $previousAssignee, User $by): void
    {
        if ($task->assignee_id === null || $task->assignee_id === $previousAssignee || $task->assignee_id === $by->id) {
            return;
        }

        $assignee = User::query()->find($task->assignee_id);

        if ($assignee !== null) {
            Notify::user($assignee, new TaskAssigned($task->loadMissing('project:id,name'), $by));
        }
    }

    /** Cambio rápido de estado (tablero o casilla de «hecha»). */
    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(array_keys(Task::STATUSES))]]);
        $task->update($data);

        return back();
    }

    public function destroy(Task $task): RedirectResponse
    {
        $task->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tarea eliminada.']);

        return back();
    }

    public function storeComment(Request $request, Task $task): RedirectResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);
        $task->comments()->create([...$data, 'user_id' => $request->user()->id]);

        return back();
    }

    public function destroyComment(Request $request, TaskComment $comment): RedirectResponse
    {
        $user = $request->user();
        abort_unless($comment->user_id === $user->id || $user->hasRole('administrador'), 403);

        $comment->delete();

        return back();
    }
}
