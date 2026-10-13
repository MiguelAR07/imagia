import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, Circle, ListChecks, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { TaskSheet } from '@/components/tasks/task-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFilters } from '@/hooks/use-filters';
import { formatDate } from '@/lib/format';
import { PRIORITY_TONE, TASK_STATUS_TONE } from '@/lib/project-labels';
import { cn } from '@/lib/utils';
import { show as showProject } from '@/routes/admin/projects';
import { index, status as updateStatus } from '@/routes/admin/tasks';
import type { Option, Paginated, TaskCard } from '@/types';

type Props = {
    tasks: Paginated<TaskCard>;
    filters: {
        q: string;
        status: string;
        project: string;
        assignee: string;
        due: string;
    };
    options: {
        statuses: Option[];
        priorities: Option[];
        projects: Option[];
        users: Option[];
    };
};

const DUE_FILTERS: Option[] = [
    { value: 'overdue', label: 'Vencidas' },
    { value: 'today', label: 'Vencen hoy' },
    { value: 'week', label: 'Próximos 7 días' },
    { value: 'none', label: 'Sin fecha' },
];

export default function TasksIndex({ tasks, filters, options }: Props) {
    const { filters: current, set } = useFilters(index().url, filters);
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<TaskCard | null>(null);
    const [openTask, setOpenTask] = useState<number | null>(null);

    const statusFilters: Option[] = [
        { value: 'pending', label: 'Pendientes' },
        ...options.statuses,
        { value: 'all', label: 'Todas' },
    ];
    const assigneeFilters: Option[] = [
        { value: 'me', label: 'Asignadas a mí' },
        { value: 'none', label: 'Sin asignar' },
        ...options.users,
    ];
    const label = (list: Option[], v: string) =>
        list.find((o) => o.value === v)?.label ?? v;

    const toggleDone = (task: TaskCard) =>
        router.patch(
            updateStatus(task.id).url,
            { status: task.status === 'done' ? 'todo' : 'done' },
            { preserveScroll: true, preserveState: true },
        );

    return (
        <>
            <Head title="Tareas" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Tareas"
                    description="Todas las tareas de los proyectos activos."
                    actions={
                        <Button
                            onClick={() => setCreating(true)}
                            disabled={options.projects.length === 0}
                        >
                            <Plus className="size-4" />
                            Nueva tarea
                        </Button>
                    }
                />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-56 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Buscar tareas"
                            placeholder="Buscar tareas"
                            className="pl-9"
                            value={current.q}
                            onChange={(e) => set('q', e.target.value, true)}
                        />
                    </div>
                    <OptionSelect
                        value={current.due}
                        options={DUE_FILTERS}
                        allLabel="Cualquier fecha"
                        onChange={(v) => set('due', v)}
                        className="w-44"
                    />
                    <OptionSelect
                        value={current.status}
                        options={statusFilters}
                        onChange={(v) => set('status', v)}
                        className="w-40"
                    />
                    <OptionSelect
                        value={current.project}
                        options={options.projects}
                        allLabel="Todos los proyectos"
                        onChange={(v) => set('project', v)}
                        className="w-48"
                    />
                    <OptionSelect
                        value={current.assignee}
                        options={assigneeFilters}
                        allLabel="Cualquier responsable"
                        onChange={(v) => set('assignee', v)}
                        className="w-48"
                    />
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    {tasks.data.length === 0 ? (
                        <EmptyState
                            icon={ListChecks}
                            title="No hay tareas con estos filtros"
                            description="Cambia los filtros o crea una tarea nueva."
                        />
                    ) : (
                        <ul className="divide-y">
                            {tasks.data.map((task) => (
                                <li
                                    key={task.id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleDone(task)}
                                        aria-label={
                                            task.status === 'done'
                                                ? `Marcar «${task.title}» como pendiente`
                                                : `Marcar «${task.title}» como hecha`
                                        }
                                        className="shrink-0 rounded-full"
                                    >
                                        {task.status === 'done' ? (
                                            <CheckCircle2 className="size-5 text-success" />
                                        ) : (
                                            <Circle className="size-5 text-muted-foreground hover:text-primary" />
                                        )}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <button
                                            type="button"
                                            onClick={() => setOpenTask(task.id)}
                                            className={cn(
                                                'text-left text-sm font-medium hover:underline',
                                                task.status === 'done' &&
                                                    'text-muted-foreground line-through decoration-1',
                                            )}
                                        >
                                            {task.title}
                                        </button>
                                        {task.project && (
                                            <Link
                                                href={showProject(
                                                    task.project.id,
                                                )}
                                                className="block text-xs text-muted-foreground hover:underline"
                                            >
                                                {task.project.name}
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden flex-wrap items-center justify-end gap-2 sm:flex">
                                        {task.status !== 'todo' &&
                                            task.status !== 'done' && (
                                                <StatusBadge
                                                    tone={
                                                        TASK_STATUS_TONE[
                                                            task.status
                                                        ] ?? 'neutral'
                                                    }
                                                >
                                                    {label(
                                                        options.statuses,
                                                        task.status,
                                                    )}
                                                </StatusBadge>
                                            )}
                                        {(task.priority === 'high' ||
                                            task.priority === 'urgent') && (
                                            <StatusBadge
                                                tone={
                                                    PRIORITY_TONE[task.priority]
                                                }
                                            >
                                                {label(
                                                    options.priorities,
                                                    task.priority,
                                                )}
                                            </StatusBadge>
                                        )}
                                        {task.assignee && (
                                            <span className="text-xs text-muted-foreground">
                                                {task.assignee.name}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            'w-28 shrink-0 text-right text-xs tabular-nums',
                                            task.overdue
                                                ? 'font-semibold text-destructive-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {task.due_date
                                            ? formatDate(task.due_date)
                                            : 'Sin fecha'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <Pagination page={tasks} />
            </div>

            {creating && (
                <TaskFormDialog
                    options={options}
                    onClose={() => setCreating(false)}
                />
            )}
            {editing && (
                <TaskFormDialog
                    key={editing.id}
                    task={editing}
                    options={options}
                    onClose={() => setEditing(null)}
                />
            )}
            {openTask !== null && (
                <TaskSheet
                    taskId={openTask}
                    labels={{
                        statuses: options.statuses,
                        priorities: options.priorities,
                    }}
                    onClose={() => setOpenTask(null)}
                    onEdit={(t) => {
                        setOpenTask(null);
                        setEditing(t);
                    }}
                />
            )}
        </>
    );
}

TasksIndex.layout = {
    breadcrumbs: [{ title: 'Tareas', href: index() }],
};
