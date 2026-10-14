import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    CheckCircle2,
    Circle,
    Download,
    Eye,
    FileUp,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import { ActivityTimeline } from '@/components/activity-timeline';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { ProgressBar } from '@/components/projects/progress-bar';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import type { ProjectOptions } from '@/components/projects/project-form-dialog';
import { StatusBadge } from '@/components/status-badge';
import { TaskBoard } from '@/components/tasks/task-board';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { TaskSheet } from '@/components/tasks/task-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCan } from '@/hooks/use-can';
import { formatDate, formatMoney, formatRelative } from '@/lib/format';
import {
    PRIORITY_TONE,
    PROJECT_STATUS_TONE,
    formatBytes,
} from '@/lib/project-labels';
import { cn } from '@/lib/utils';
import { show as showClient } from '@/routes/admin/clients';
import { destroy, index, restore, show } from '@/routes/admin/projects';
import {
    destroy as destroyDeliverable,
    store as storeDeliverable,
    update as updateDeliverable,
} from '@/routes/admin/projects/deliverables';
import {
    destroy as destroyFile,
    download as downloadFile,
    store as storeFile,
} from '@/routes/admin/projects/files';
import {
    destroy as destroyMilestone,
    store as storeMilestone,
    update as updateMilestone,
} from '@/routes/admin/projects/milestones';
import { ProjectFinancePanel } from '@/components/finance/project-finance';
import type {
    ProjectFinance,
    ActivityItem,
    DeliverableItem,
    FileItem,
    MilestoneItem,
    Option,
    ProjectDetail,
    TaskCard,
} from '@/types';

type Props = {
    project: ProjectDetail;
    tasks: TaskCard[];
    milestones: MilestoneItem[];
    deliverables: DeliverableItem[];
    files: FileItem[];
    activities: ActivityItem[];
    finance: ProjectFinance | null;
    options: ProjectOptions & {
        users: Option[];
        task_statuses: Option[];
        deliverable_statuses: Option[];
        activity_types: Option[];
    };
};

type Tab =
    | 'tasks'
    | 'milestones'
    | 'deliverables'
    | 'files'
    | 'money'
    | 'history';

export default function ProjectShow({
    project,
    tasks,
    milestones,
    deliverables,
    files,
    activities,
    finance,
    options,
}: Props) {
    const can = useCan();
    const canManage = can('proyectos.gestionar') && !project.archived;
    const canTasks = can('tareas.gestionar') && !project.archived;
    const [tab, setTab] = useState<Tab>('tasks');
    const [editing, setEditing] = useState(false);
    const [taskForm, setTaskForm] = useState<{
        task?: TaskCard;
        status?: string;
    } | null>(null);
    const [openTask, setOpenTask] = useState<number | null>(null);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Proyectos', href: index() },
            { title: project.name, href: show(project.id) },
        ],
    });

    const label = (list: Option[], v: string | null) =>
        list.find((o) => o.value === v)?.label ?? '—';
    const taskOptions = {
        statuses: options.task_statuses,
        priorities: options.priorities,
        users: options.users,
        milestones: milestones.map((m) => ({
            value: String(m.id),
            label: m.name,
        })),
    };
    const pendingTasks = tasks.filter((t) => t.status !== 'done').length;

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'tasks', label: 'Tareas', count: tasks.length },
        { id: 'milestones', label: 'Hitos', count: milestones.length },
        {
            id: 'deliverables',
            label: 'Entregables',
            count: deliverables.length,
        },
        { id: 'files', label: 'Archivos', count: files.length },
        ...(finance
            ? [
                  {
                      id: 'money' as Tab,
                      label: 'Pagos y gastos',
                      count: finance.payments.length,
                  },
              ]
            : []),
        { id: 'history', label: 'Historial' },
    ];

    return (
        <>
            <Head title={project.name} />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                {project.archived && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                        Este proyecto está archivado.
                        {can('proyectos.gestionar') && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    router.post(restore(project.id).url)
                                }
                            >
                                <ArchiveRestore className="size-4" />
                                Restaurar
                            </Button>
                        )}
                    </div>
                )}

                <PageHeader
                    eyebrow={label(options.categories, project.category)}
                    title={project.name}
                    description={
                        project.client && (
                            <Link
                                href={showClient(project.client.id)}
                                className="hover:underline"
                            >
                                {project.client.name}
                            </Link>
                        )
                    }
                    actions={
                        canManage && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(true)}
                                >
                                    <Pencil className="size-4" />
                                    Editar
                                </Button>
                                <ConfirmDialog
                                    trigger={
                                        <Button variant="ghost">
                                            <Archive className="size-4" />
                                            Archivar
                                        </Button>
                                    }
                                    title={`Archivar «${project.name}»`}
                                    description="Saldrá de los listados y sus tareas no aparecerán en la vista general. Todo se conserva y puedes restaurarlo."
                                    confirmLabel="Archivar"
                                    onConfirm={(done) =>
                                        router.delete(destroy(project.id).url, {
                                            onFinish: done,
                                        })
                                    }
                                />
                            </>
                        )
                    }
                />

                <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-5">
                    <Stat label="Estado">
                        <StatusBadge
                            tone={
                                PROJECT_STATUS_TONE[project.status] ?? 'neutral'
                            }
                        >
                            {label(options.statuses, project.status)}
                        </StatusBadge>
                    </Stat>
                    <Stat label="Prioridad">
                        <StatusBadge
                            tone={PRIORITY_TONE[project.priority] ?? 'neutral'}
                        >
                            {label(options.priorities, project.priority)}
                        </StatusBadge>
                    </Stat>
                    <Stat label="Entrega estimada">
                        <span
                            className={cn(
                                project.overdue &&
                                    'font-semibold text-destructive-foreground',
                            )}
                        >
                            {formatDate(project.due_date)}
                            {project.overdue && ' · vencida'}
                        </span>
                    </Stat>
                    <Stat label="Valor contratado">
                        {formatMoney(project.agreed_amount, project.currency)}
                    </Stat>
                    <Stat
                        label={
                            project.progress_is_manual
                                ? 'Avance (manual)'
                                : `Avance · ${pendingTasks} pendientes`
                        }
                    >
                        <ProgressBar
                            value={project.progress}
                            manual={project.progress_is_manual}
                        />
                    </Stat>
                </section>

                {(project.description || project.observations) && (
                    <section className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
                        {project.description && (
                            <div>
                                <h2 className="mb-1 text-sm font-semibold">
                                    Descripción y alcance
                                </h2>
                                <p className="text-sm whitespace-pre-line text-muted-foreground">
                                    {project.description}
                                </p>
                            </div>
                        )}
                        {project.observations && (
                            <div>
                                <h2 className="mb-1 text-sm font-semibold">
                                    Observaciones internas
                                </h2>
                                <p className="text-sm whitespace-pre-line text-muted-foreground">
                                    {project.observations}
                                </p>
                            </div>
                        )}
                    </section>
                )}

                <div>
                    <div
                        role="tablist"
                        aria-label="Secciones del proyecto"
                        className="mb-5 flex gap-1 overflow-x-auto border-b"
                    >
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                type="button"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    '-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                                    tab === t.id
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {t.label}
                                {t.count !== undefined && (
                                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {tab === 'tasks' &&
                        (canTasks ? (
                            <TaskBoard
                                tasks={tasks}
                                statuses={options.task_statuses}
                                priorities={options.priorities}
                                onOpen={(t) => setOpenTask(t.id)}
                                onCreate={(status) => setTaskForm({ status })}
                            />
                        ) : (
                            <ul className="divide-y rounded-xl border bg-card">
                                {tasks.length === 0 && (
                                    <li className="p-4 text-sm text-muted-foreground">
                                        Sin tareas.
                                    </li>
                                )}
                                {tasks.map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex items-center justify-between gap-3 p-3 text-sm"
                                    >
                                        {t.title}
                                        <span className="text-muted-foreground">
                                            {label(
                                                options.task_statuses,
                                                t.status,
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ))}

                    {tab === 'milestones' && (
                        <Milestones
                            projectId={project.id}
                            milestones={milestones}
                            canManage={canManage}
                        />
                    )}
                    {tab === 'deliverables' && (
                        <Deliverables
                            projectId={project.id}
                            deliverables={deliverables}
                            statuses={options.deliverable_statuses}
                            canManage={canManage}
                        />
                    )}
                    {tab === 'files' && (
                        <Files
                            projectId={project.id}
                            files={files}
                            canManage={canManage}
                        />
                    )}
                    {tab === 'money' && finance && (
                        <ProjectFinancePanel
                            projectId={project.id}
                            currency={project.currency}
                            finance={finance}
                            canManage={
                                can('finanzas.gestionar') && !project.archived
                            }
                        />
                    )}
                    {tab === 'history' && (
                        <div className="max-w-3xl rounded-xl border bg-card p-5">
                            <ActivityTimeline
                                subjectType="proyectos"
                                subjectId={project.id}
                                activities={activities}
                                types={options.activity_types}
                                canWrite={canManage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {editing && (
                <ProjectFormDialog
                    open
                    project={project}
                    options={options}
                    onClose={() => setEditing(false)}
                />
            )}
            {taskForm && (
                <TaskFormDialog
                    key={taskForm.task?.id ?? `new-${taskForm.status}`}
                    task={taskForm.task}
                    projectId={project.id}
                    initialStatus={taskForm.status}
                    options={taskOptions}
                    onClose={() => setTaskForm(null)}
                />
            )}
            {openTask !== null && (
                <TaskSheet
                    taskId={openTask}
                    labels={{
                        statuses: options.task_statuses,
                        priorities: options.priorities,
                    }}
                    onClose={() => setOpenTask(null)}
                    onEdit={(t) => {
                        setOpenTask(null);
                        setTaskForm({ task: t });
                    }}
                />
            )}
        </>
    );
}

function Stat({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5 bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="text-sm">{children}</div>
        </div>
    );
}

function Milestones({
    projectId,
    milestones,
    canManage,
}: {
    projectId: number;
    milestones: MilestoneItem[];
    canManage: boolean;
}) {
    const form = useForm({ name: '', due_date: '' });

    const add = (event: FormEvent) => {
        event.preventDefault();
        form.post(storeMilestone(projectId).url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const toggle = (m: MilestoneItem) =>
        router.put(
            updateMilestone({ project: projectId, milestone: m.id }).url,
            {
                name: m.name,
                due_date: m.due_date ?? '',
                completed: !m.completed_at,
            },
            { preserveScroll: true },
        );

    return (
        <div className="max-w-3xl space-y-4">
            {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Divide el proyecto en hitos para ver el cronograma y agrupar
                    tareas.
                </p>
            ) : (
                <ol className="relative space-y-1 border-l pl-6">
                    {milestones.map((m) => {
                        const done = !!m.completed_at;
                        const overdue =
                            !done &&
                            m.due_date &&
                            new Date(`${m.due_date}T23:59:59`) < new Date();

                        return (
                            <li
                                key={m.id}
                                className="relative flex items-center justify-between gap-3 rounded-lg py-2 pr-2"
                            >
                                <button
                                    type="button"
                                    disabled={!canManage}
                                    onClick={() => toggle(m)}
                                    aria-label={
                                        done
                                            ? `Marcar «${m.name}» como pendiente`
                                            : `Marcar «${m.name}» como cumplido`
                                    }
                                    className="absolute top-2.5 -left-[35px] rounded-full bg-background"
                                >
                                    {done ? (
                                        <CheckCircle2 className="size-5 text-success" />
                                    ) : (
                                        <Circle className="size-5 text-muted-foreground" />
                                    )}
                                </button>
                                <div>
                                    <p
                                        className={cn(
                                            'text-sm font-medium',
                                            done &&
                                                'text-muted-foreground line-through decoration-1',
                                        )}
                                    >
                                        {m.name}
                                    </p>
                                    <p
                                        className={cn(
                                            'text-xs',
                                            overdue
                                                ? 'text-destructive-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {m.due_date
                                            ? formatDate(m.due_date)
                                            : 'Sin fecha'}
                                        {m.tasks_total > 0 &&
                                            ` · ${m.tasks_done}/${m.tasks_total} tareas`}
                                    </p>
                                </div>
                                {canManage && (
                                    <ConfirmDialog
                                        trigger={
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Eliminar «${m.name}»`}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        }
                                        title="Eliminar hito"
                                        description="Las tareas del hito se conservan, pero quedarán sin hito."
                                        confirmLabel="Eliminar"
                                        destructive
                                        onConfirm={(close) =>
                                            router.delete(
                                                destroyMilestone({
                                                    project: projectId,
                                                    milestone: m.id,
                                                }).url,
                                                {
                                                    preserveScroll: true,
                                                    onFinish: close,
                                                },
                                            )
                                        }
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
            {canManage && (
                <form
                    onSubmit={add}
                    className="flex flex-wrap items-start gap-2 rounded-lg border border-dashed p-3"
                >
                    <div className="grid min-w-52 flex-1 gap-1">
                        <Input
                            aria-label="Nombre del hito"
                            placeholder="Nuevo hito, ej.: Diseño aprobado"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <Input
                        aria-label="Fecha del hito"
                        type="date"
                        className="w-44"
                        value={form.data.due_date}
                        onChange={(e) =>
                            form.setData('due_date', e.target.value)
                        }
                    />
                    <Button type="submit" disabled={form.processing}>
                        <Plus className="size-4" />
                        Agregar
                    </Button>
                </form>
            )}
        </div>
    );
}

function Deliverables({
    projectId,
    deliverables,
    statuses,
    canManage,
}: {
    projectId: number;
    deliverables: DeliverableItem[];
    statuses: Option[];
    canManage: boolean;
}) {
    const form = useForm({
        name: '',
        description: '',
        due_date: '',
        status: 'pending',
        is_visible_to_client: false,
    });

    const add = (event: FormEvent) => {
        event.preventDefault();
        form.post(storeDeliverable(projectId).url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const setStatus = (d: DeliverableItem, status: string) =>
        router.put(
            updateDeliverable({ project: projectId, deliverable: d.id }).url,
            {
                name: d.name,
                description: d.description ?? '',
                due_date: d.due_date ?? '',
                status,
                is_visible_to_client: d.is_visible_to_client,
            },
            { preserveScroll: true },
        );

    return (
        <div className="max-w-4xl space-y-4">
            {deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Registra lo que entregarás al cliente: diseños, versiones,
                    manuales, accesos…
                </p>
            ) : (
                <ul className="divide-y rounded-xl border bg-card">
                    {deliverables.map((d) => (
                        <li
                            key={d.id}
                            className="flex flex-wrap items-center gap-3 p-4"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{d.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {d.due_date
                                        ? `Para el ${formatDate(d.due_date)}`
                                        : 'Sin fecha'}
                                    {d.delivered_at &&
                                        ` · entregado ${formatRelative(d.delivered_at)}`}
                                    {d.is_visible_to_client &&
                                        ' · visible para el cliente'}
                                </p>
                                {d.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {d.description}
                                    </p>
                                )}
                            </div>
                            {canManage ? (
                                <>
                                    <OptionSelect
                                        value={d.status}
                                        options={statuses}
                                        onChange={(v) => setStatus(d, v)}
                                        className="w-36"
                                    />
                                    <ConfirmDialog
                                        trigger={
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Eliminar «${d.name}»`}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        }
                                        title="Eliminar entregable"
                                        description={`Se eliminará «${d.name}».`}
                                        confirmLabel="Eliminar"
                                        destructive
                                        onConfirm={(close) =>
                                            router.delete(
                                                destroyDeliverable({
                                                    project: projectId,
                                                    deliverable: d.id,
                                                }).url,
                                                {
                                                    preserveScroll: true,
                                                    onFinish: close,
                                                },
                                            )
                                        }
                                    />
                                </>
                            ) : (
                                <StatusBadge
                                    tone={
                                        d.status === 'pending'
                                            ? 'neutral'
                                            : 'success'
                                    }
                                >
                                    {
                                        statuses.find(
                                            (s) => s.value === d.status,
                                        )?.label
                                    }
                                </StatusBadge>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {canManage && (
                <form
                    onSubmit={add}
                    className="grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-[1fr_170px_auto]"
                >
                    <div className="grid gap-1">
                        <Input
                            aria-label="Nombre del entregable"
                            placeholder="Nuevo entregable"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <Input
                        aria-label="Fecha de entrega"
                        type="date"
                        value={form.data.due_date}
                        onChange={(e) =>
                            form.setData('due_date', e.target.value)
                        }
                    />
                    <Button type="submit" disabled={form.processing}>
                        <Plus className="size-4" />
                        Agregar
                    </Button>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-3">
                        <input
                            type="checkbox"
                            checked={form.data.is_visible_to_client}
                            onChange={(e) =>
                                form.setData(
                                    'is_visible_to_client',
                                    e.target.checked,
                                )
                            }
                        />
                        <Eye className="size-3.5" />
                        Mostrarlo al cliente cuando se habilite el portal de
                        clientes
                    </label>
                </form>
            )}
        </div>
    );
}

function Files({
    projectId,
    files,
    canManage,
}: {
    projectId: number;
    files: FileItem[];
    canManage: boolean;
}) {
    const input = useRef<HTMLInputElement>(null);
    const form = useForm<{ file: File | null }>({ file: null });

    const upload = (file: File) => {
        form.setData('file', file);
        form.transform(() => ({ file }));
        form.post(storeFile(projectId).url, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => {
                form.reset();
                if (input.current) {
                    input.current.value = '';
                }
            },
        });
    };

    return (
        <div className="max-w-4xl space-y-4">
            {canManage && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4">
                    <input
                        ref={input}
                        id="project-file"
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                                upload(f);
                            }
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={form.processing}
                        onClick={() => input.current?.click()}
                    >
                        <FileUp className="size-4" />
                        {form.processing
                            ? `Subiendo… ${form.progress?.percentage ?? 0}%`
                            : 'Subir archivo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Hasta 20 MB. Documentos, imágenes, comprimidos y video.
                        Los archivos son privados.
                    </p>
                    <InputError message={form.errors.file} className="w-full" />
                </div>
            )}
            {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Aún no hay archivos en este proyecto.
                </p>
            ) : (
                <ul className="divide-y rounded-xl border bg-card">
                    {files.map((f) => (
                        <li key={f.id} className="flex items-center gap-3 p-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {f.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatBytes(f.size)} ·{' '}
                                    {f.uploaded_by ?? 'Usuario'} ·{' '}
                                    {formatRelative(f.created_at)}
                                </p>
                            </div>
                            <Button size="icon" variant="ghost" asChild>
                                <a
                                    href={
                                        downloadFile({
                                            project: projectId,
                                            file: f.id,
                                        }).url
                                    }
                                    aria-label={`Descargar ${f.name}`}
                                >
                                    <Download className="size-4" />
                                </a>
                            </Button>
                            {canManage && (
                                <ConfirmDialog
                                    trigger={
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label={`Eliminar ${f.name}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    }
                                    title="Eliminar archivo"
                                    description={`«${f.name}» se borrará definitivamente.`}
                                    confirmLabel="Eliminar"
                                    destructive
                                    onConfirm={(close) =>
                                        router.delete(
                                            destroyFile({
                                                project: projectId,
                                                file: f.id,
                                            }).url,
                                            {
                                                preserveScroll: true,
                                                onFinish: close,
                                            },
                                        )
                                    }
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
