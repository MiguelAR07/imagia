import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    Columns3,
    FolderKanban,
    Plus,
    Search,
    Table2,
} from 'lucide-react';
import type { DragEvent } from 'react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { MonthCalendar } from '@/components/month-calendar';
import type { CalendarEvent } from '@/components/month-calendar';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { ProgressBar } from '@/components/projects/progress-bar';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import type { ProjectOptions } from '@/components/projects/project-form-dialog';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCan } from '@/hooks/use-can';
import { useFilters } from '@/hooks/use-filters';
import { formatDate } from '@/lib/format';
import { PRIORITY_TONE, PROJECT_STATUS_TONE } from '@/lib/project-labels';
import { cn } from '@/lib/utils';
import { index, show, status as updateStatus } from '@/routes/admin/projects';
import type { Option, ProjectSummary } from '@/types';

type Milestone = {
    id: number;
    project_id: number;
    name: string;
    due_date: string;
    completed: boolean;
};

type Props = {
    projects: ProjectSummary[];
    milestones: Milestone[];
    filters: { q: string; status: string; priority: string; client: string };
    options: ProjectOptions & { users: Option[] };
};

type View = 'table' | 'board' | 'calendar';
const VIEW_KEY = 'imagia:projects-view';

export default function ProjectsIndex({
    projects,
    milestones,
    filters,
    options,
}: Props) {
    const can = useCan();
    const canManage = can('proyectos.gestionar');
    const { filters: current, set } = useFilters(index().url, filters);
    const [creating, setCreating] = useState(false);
    const [view, setView] = useState<View>(() => {
        try {
            return (localStorage.getItem(VIEW_KEY) as View) ?? 'table';
        } catch {
            return 'table';
        }
    });

    const statusFilters: Option[] = [
        { value: 'open', label: 'En curso (sin cerrar)' },
        ...options.statuses,
        { value: 'archived', label: 'Archivados' },
    ];

    const label = (list: Option[], v: string | null) =>
        list.find((o) => o.value === v)?.label ?? '—';

    const changeView = (v: View) => {
        setView(v);
        try {
            localStorage.setItem(VIEW_KEY, v);
        } catch {
            // Sin almacenamiento local: se usa la vista por defecto al recargar.
        }
    };

    const events = useMemo<CalendarEvent[]>(() => {
        const names = new Map(projects.map((p) => [p.id, p.name]));

        return [
            ...projects
                .filter((p) => p.due_date)
                .map((p) => ({
                    id: `p${p.id}`,
                    date: p.due_date as string,
                    label: `Entrega: ${p.name}`,
                    href: show(p.id).url,
                    tone: (p.status === 'delivered'
                        ? 'done'
                        : p.overdue
                          ? 'overdue'
                          : 'project') as CalendarEvent['tone'],
                })),
            ...milestones.map((m) => ({
                id: `m${m.id}`,
                date: m.due_date,
                label: `${m.name} · ${names.get(m.project_id) ?? ''}`,
                href: show(m.project_id).url,
                tone: (m.completed
                    ? 'done'
                    : 'milestone') as CalendarEvent['tone'],
            })),
        ];
    }, [projects, milestones]);

    return (
        <>
            <Head title="Proyectos" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Proyectos"
                    description="El avance se calcula con el peso de las tareas terminadas, salvo que se fije a mano (*)."
                    actions={
                        canManage && (
                            <Button onClick={() => setCreating(true)}>
                                <Plus className="size-4" />
                                Nuevo proyecto
                            </Button>
                        )
                    }
                />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-56 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Buscar proyectos"
                            placeholder="Buscar por proyecto o cliente"
                            className="pl-9"
                            value={current.q}
                            onChange={(e) => set('q', e.target.value, true)}
                        />
                    </div>
                    <OptionSelect
                        value={current.status}
                        options={statusFilters}
                        allLabel="Todos los estados"
                        onChange={(v) => set('status', v)}
                        className="w-52"
                    />
                    <OptionSelect
                        value={current.priority}
                        options={options.priorities}
                        allLabel="Cualquier prioridad"
                        onChange={(v) => set('priority', v)}
                        className="w-44"
                    />
                    <OptionSelect
                        value={current.client}
                        options={options.clients}
                        allLabel="Todos los clientes"
                        onChange={(v) => set('client', v)}
                        className="w-48"
                    />
                    <div
                        role="group"
                        aria-label="Vista"
                        className="flex rounded-lg border p-0.5"
                    >
                        {(
                            [
                                ['table', Table2, 'Tabla'],
                                ['board', Columns3, 'Tablero'],
                                ['calendar', CalendarDays, 'Calendario'],
                            ] as const
                        ).map(([v, Icon, text]) => (
                            <button
                                key={v}
                                type="button"
                                aria-pressed={view === v}
                                onClick={() => changeView(v)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                                    view === v
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Icon className="size-4" />
                                {text}
                            </button>
                        ))}
                    </div>
                </div>

                {view === 'calendar' ? (
                    <MonthCalendar events={events} />
                ) : projects.length === 0 ? (
                    <div className="rounded-xl border bg-card">
                        <EmptyState
                            icon={FolderKanban}
                            title={
                                filters.q ||
                                filters.status ||
                                filters.priority ||
                                filters.client
                                    ? 'Ningún proyecto coincide con los filtros'
                                    : 'Aún no tienes proyectos'
                            }
                            description="Crea un proyecto para organizar tareas, hitos, entregables y archivos."
                            action={
                                canManage && (
                                    <Button
                                        size="sm"
                                        onClick={() => setCreating(true)}
                                    >
                                        <Plus className="size-4" />
                                        Nuevo proyecto
                                    </Button>
                                )
                            }
                        />
                    </div>
                ) : view === 'board' ? (
                    <ProjectBoard
                        projects={projects}
                        statuses={options.statuses}
                        canManage={canManage}
                    />
                ) : (
                    <div className="overflow-x-auto rounded-xl border bg-card">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead>
                                <tr className="border-b text-left font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                    <th className="px-4 py-3 font-medium">
                                        Proyecto
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Prioridad
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Entrega
                                    </th>
                                    <th className="w-48 px-4 py-3 font-medium">
                                        Avance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-b last:border-0 hover:bg-accent/40"
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={show(p.id)}
                                                className="font-medium hover:underline"
                                            >
                                                {p.name}
                                            </Link>
                                            <div className="text-muted-foreground">
                                                {p.client?.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.archived ? (
                                                <StatusBadge tone="neutral">
                                                    Archivado
                                                </StatusBadge>
                                            ) : (
                                                <StatusBadge
                                                    tone={
                                                        PROJECT_STATUS_TONE[
                                                            p.status
                                                        ] ?? 'neutral'
                                                    }
                                                >
                                                    {label(
                                                        options.statuses,
                                                        p.status,
                                                    )}
                                                </StatusBadge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                tone={
                                                    PRIORITY_TONE[p.priority] ??
                                                    'neutral'
                                                }
                                            >
                                                {label(
                                                    options.priorities,
                                                    p.priority,
                                                )}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.overdue ? (
                                                <StatusBadge tone="danger">
                                                    Vencido ·{' '}
                                                    {formatDate(p.due_date)}
                                                </StatusBadge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {formatDate(p.due_date)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ProgressBar
                                                value={p.progress}
                                                manual={p.progress_is_manual}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ProjectFormDialog
                open={creating}
                onClose={() => setCreating(false)}
                options={options}
            />
        </>
    );
}

function ProjectBoard({
    projects,
    statuses,
    canManage,
}: {
    projects: ProjectSummary[];
    statuses: Option[];
    canManage: boolean;
}) {
    const [dragging, setDragging] = useState<number | null>(null);
    const [over, setOver] = useState<string | null>(null);
    const active = projects.filter((p) => !p.archived);

    const drop = (event: DragEvent, status: string) => {
        event.preventDefault();
        const id = Number(event.dataTransfer.getData('text/plain'));
        setDragging(null);
        setOver(null);

        if (canManage && active.find((p) => p.id === id)?.status !== status) {
            router.patch(
                updateStatus(id).url,
                { status },
                { preserveScroll: true, preserveState: true },
            );
        }
    };

    return (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
            <div className="flex min-w-max gap-4">
                {statuses.map((status) => {
                    const items = active.filter(
                        (p) => p.status === status.value,
                    );

                    return (
                        <section
                            key={status.value}
                            aria-label={status.label}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setOver(status.value);
                            }}
                            onDragLeave={() =>
                                setOver((o) => (o === status.value ? null : o))
                            }
                            onDrop={(e) => drop(e, status.value)}
                            className={cn(
                                'flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40',
                                over === status.value &&
                                    dragging !== null &&
                                    'border-primary bg-primary/5',
                            )}
                        >
                            <header className="flex items-center justify-between px-3 py-2.5">
                                <StatusBadge
                                    tone={
                                        PROJECT_STATUS_TONE[status.value] ??
                                        'neutral'
                                    }
                                >
                                    {status.label}
                                </StatusBadge>
                                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                    {items.length}
                                </span>
                            </header>
                            <div className="flex min-h-24 flex-col gap-2 px-2 pb-2">
                                {items.map((p) => (
                                    <article
                                        key={p.id}
                                        draggable={canManage}
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData(
                                                'text/plain',
                                                String(p.id),
                                            );
                                            setDragging(p.id);
                                        }}
                                        onDragEnd={() => {
                                            setDragging(null);
                                            setOver(null);
                                        }}
                                        className={cn(
                                            'rounded-lg border bg-card p-3 shadow-xs',
                                            canManage &&
                                                'cursor-grab active:cursor-grabbing',
                                            dragging === p.id && 'opacity-40',
                                        )}
                                    >
                                        <Link
                                            href={show(p.id)}
                                            className="block space-y-1"
                                        >
                                            <p className="text-sm font-semibold hover:underline">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {p.client?.name}
                                            </p>
                                        </Link>
                                        <ProgressBar
                                            value={p.progress}
                                            manual={p.progress_is_manual}
                                            className="mt-3"
                                        />
                                        {p.due_date && (
                                            <p
                                                className={cn(
                                                    'mt-2 text-xs',
                                                    p.overdue
                                                        ? 'text-destructive-foreground'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {p.overdue
                                                    ? 'Vencido · '
                                                    : 'Entrega · '}
                                                {formatDate(p.due_date)}
                                            </p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

ProjectsIndex.layout = {
    breadcrumbs: [{ title: 'Proyectos', href: index() }],
};
