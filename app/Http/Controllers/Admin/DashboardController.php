<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Quote;
use App\Models\Task;
use App\Models\User;
use App\Support\Finance;
use App\Support\Settings;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inicio del panel: indicadores reales y lo que requiere atención hoy.
 * Cada bloque aparece solo si el usuario tiene permiso para ver ese módulo.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $brand = Settings::get(Settings::BRAND);
        $today = CarbonImmutable::today();

        return Inertia::render('admin/dashboard', [
            'story' => [
                'origin' => $brand['origin'],
                'logo_parts' => $brand['logo_parts'],
            ],
            'commercial' => $user->can('prospectos.gestionar') ? $this->commercial($today, $user) : null,
            'operation' => $user->can('proyectos.ver') ? $this->operation($today) : null,
            'myTasks' => $user->can('tareas.gestionar') ? $this->myTasks($today, $user) : null,
            'finance' => $user->can('finanzas.ver') ? $this->finance() : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function commercial(CarbonImmutable $today, User $user): array
    {
        $open = fn (): Builder => Lead::query()->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false));

        return [
            'new_leads' => Lead::query()->where('created_at', '>=', $today->startOfMonth())->count(),
            'open_leads' => $open()->count(),
            'new_conversations' => $user->can('conversaciones.ver')
                ? ChatSession::query()->where('attention_status', 'new')->whereHas('messages', fn ($q) => $q->where('role', 'user'))->count()
                : null,
            'open_quotes' => $user->can('cotizaciones.gestionar')
                ? Quote::query()->whereIn('status', Quote::EDITABLE_STATUSES)->count()
                : null,
            'follow_ups' => $open()->whereNotNull('next_follow_up_at')
                ->where('next_follow_up_at', '<=', $today->endOfDay())
                ->orderBy('next_follow_up_at')->limit(5)->get(['id', 'name', 'company', 'next_follow_up_at'])
                ->map(fn (Lead $l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'detail' => $l->company,
                    'date' => $l->next_follow_up_at?->toDateString(),
                    'overdue' => $l->next_follow_up_at?->isBefore($today) ?? false,
                ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function operation(CarbonImmutable $today): array
    {
        $active = fn (): Builder => Project::query()->whereNotIn('status', Project::CLOSED_STATUSES);

        return [
            'active_projects' => $active()->count(),
            'overdue_projects' => $active()->where('due_date', '<', $today->toDateString())->count(),
            // Entregas vencidas o de los próximos 14 días.
            'upcoming' => $active()->with('client:id,name')
                ->whereNotNull('due_date')->where('due_date', '<=', $today->addDays(14)->toDateString())
                ->orderBy('due_date')->limit(5)->get(['id', 'name', 'client_id', 'due_date', 'status'])
                ->map(fn (Project $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'detail' => $p->client?->name,
                    'date' => $p->due_date?->toDateString(),
                    'overdue' => $p->isOverdue(),
                ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function myTasks(CarbonImmutable $today, User $user): array
    {
        $mine = fn (): Builder => Task::query()->where('assignee_id', $user->id)->where('status', '!=', 'done')
            ->whereHas('project', fn ($q) => $q->whereNull('projects.deleted_at'));

        return [
            'open' => $mine()->count(),
            'overdue' => $mine()->where('due_date', '<', $today->toDateString())->count(),
            'items' => $mine()->with('project:id,name')
                ->orderByRaw('due_date is null')->orderBy('due_date')->limit(6)
                ->get(['id', 'title', 'project_id', 'due_date', 'status'])
                ->map(fn (Task $t) => [
                    'id' => $t->id,
                    'name' => $t->title,
                    'detail' => $t->project?->name,
                    'project_id' => $t->project_id,
                    'date' => $t->due_date?->toDateString(),
                    'overdue' => $t->isOverdue(),
                ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function finance(): array
    {
        [$from, $to] = Finance::range('mes');
        $currency = Finance::defaultCurrency();

        return [
            ...collect(Finance::summary($from, $to))->firstWhere('currency', $currency),
            'monthly' => array_slice(Finance::monthly($currency), -6),
        ];
    }
}
