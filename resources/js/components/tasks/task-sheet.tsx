import { router, usePage } from '@inertiajs/react';
import { CalendarDays, Pencil, Trash2, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatRelative } from '@/lib/format';
import { PRIORITY_TONE, TASK_STATUS_TONE } from '@/lib/project-labels';
import { destroy, show } from '@/routes/admin/tasks';
import {
    destroy as destroyComment,
    store as storeComment,
} from '@/routes/admin/tasks/comments';
import type { Option, TaskDetail } from '@/types';

/** Panel lateral con el detalle de una tarea y sus comentarios. */
export function TaskSheet({
    taskId,
    onClose,
    onEdit,
    labels,
}: {
    taskId: number;
    onClose: () => void;
    onEdit: (task: TaskDetail) => void;
    labels: { statuses: Option[]; priorities: Option[] };
}) {
    const { auth } = usePage().props;
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [error, setError] = useState(false);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    const load = useCallback(() => {
        fetch(show(taskId).url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data: TaskDetail) => setTask(data))
            .catch(() => setError(true));
    }, [taskId]);

    useEffect(load, [load]);

    const label = (list: Option[], v: string) =>
        list.find((o) => o.value === v)?.label ?? v;

    const comment = (event: FormEvent) => {
        event.preventDefault();
        setSending(true);
        router.post(
            storeComment(taskId).url,
            { body },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setBody('');
                    load();
                },
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <Sheet open onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                {error ? (
                    <p className="p-6 text-sm text-muted-foreground">
                        No se pudo cargar la tarea. Cierra el panel e intenta de
                        nuevo.
                    </p>
                ) : !task ? (
                    <div className="flex justify-center p-10">
                        <Spinner />
                    </div>
                ) : (
                    <>
                        <SheetHeader>
                            <SheetTitle className="pr-6 text-left text-lg">
                                {task.title}
                            </SheetTitle>
                            <SheetDescription className="text-left">
                                {task.project?.name}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="space-y-6 px-4 pb-6">
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge
                                    tone={
                                        TASK_STATUS_TONE[task.status] ??
                                        'neutral'
                                    }
                                >
                                    {label(labels.statuses, task.status)}
                                </StatusBadge>
                                <StatusBadge
                                    tone={
                                        PRIORITY_TONE[task.priority] ??
                                        'neutral'
                                    }
                                >
                                    Prioridad{' '}
                                    {label(
                                        labels.priorities,
                                        task.priority,
                                    ).toLowerCase()}
                                </StatusBadge>
                                {task.overdue && (
                                    <StatusBadge tone="danger">
                                        Vencida
                                    </StatusBadge>
                                )}
                            </div>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="size-4 text-muted-foreground" />
                                    <dt className="sr-only">Responsable</dt>
                                    <dd>
                                        {task.assignee?.name ?? 'Sin asignar'}
                                    </dd>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="size-4 text-muted-foreground" />
                                    <dt className="sr-only">Fecha límite</dt>
                                    <dd>
                                        {task.due_date
                                            ? formatDate(task.due_date)
                                            : 'Sin fecha'}
                                    </dd>
                                </div>
                            </dl>
                            {task.description && (
                                <p className="text-sm whitespace-pre-line">
                                    {task.description}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(task)}
                                >
                                    <Pencil className="size-4" />
                                    Editar
                                </Button>
                                <ConfirmDialog
                                    trigger={
                                        <Button variant="ghost" size="sm">
                                            <Trash2 className="size-4" />
                                            Eliminar
                                        </Button>
                                    }
                                    title="Eliminar tarea"
                                    description="Se eliminará con sus comentarios. Esta acción no se puede deshacer."
                                    confirmLabel="Eliminar"
                                    destructive
                                    onConfirm={(done) =>
                                        router.delete(destroy(task.id).url, {
                                            preserveScroll: true,
                                            onSuccess: onClose,
                                            onFinish: done,
                                        })
                                    }
                                />
                            </div>

                            <section className="space-y-3 border-t pt-5">
                                <h3 className="text-sm font-semibold">
                                    Comentarios
                                </h3>
                                {task.comments.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Aún no hay comentarios.
                                    </p>
                                )}
                                <ul className="space-y-3">
                                    {task.comments.map((c) => (
                                        <li
                                            key={c.id}
                                            className="rounded-lg bg-muted/60 p-3 text-sm"
                                        >
                                            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {c.user?.name ?? 'Usuario'}
                                                </span>
                                                <span>
                                                    ·{' '}
                                                    {formatRelative(
                                                        c.created_at,
                                                    )}
                                                </span>
                                                {(c.user?.id === auth.user.id ||
                                                    auth.roles.includes(
                                                        'administrador',
                                                    )) && (
                                                    <button
                                                        type="button"
                                                        className="ml-auto rounded p-1 hover:bg-background"
                                                        aria-label="Eliminar comentario"
                                                        onClick={() =>
                                                            router.delete(
                                                                destroyComment(
                                                                    c.id,
                                                                ).url,
                                                                {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                    onSuccess:
                                                                        load,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="whitespace-pre-line">
                                                {c.body}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                <form onSubmit={comment} className="space-y-2">
                                    <Textarea
                                        aria-label="Nuevo comentario"
                                        placeholder="Escribe un comentario…"
                                        rows={2}
                                        value={body}
                                        onChange={(e) =>
                                            setBody(e.target.value)
                                        }
                                        maxLength={5000}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={sending || !body.trim()}
                                        >
                                            Comentar
                                        </Button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
