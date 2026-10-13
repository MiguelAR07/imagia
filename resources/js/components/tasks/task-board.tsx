import { router } from '@inertiajs/react';
import { CalendarDays, MessageSquare, Plus } from 'lucide-react';
import type { DragEvent } from 'react';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/format';
import { PRIORITY_TONE } from '@/lib/project-labels';
import { cn } from '@/lib/utils';
import { status as updateStatus } from '@/routes/admin/tasks';
import type { Option, TaskCard } from '@/types';

/** Tablero de tareas por estado, con arrastrar y soltar. */
export function TaskBoard({
    tasks,
    statuses,
    priorities,
    onOpen,
    onCreate,
}: {
    tasks: TaskCard[];
    statuses: Option[];
    priorities: Option[];
    onOpen: (task: TaskCard) => void;
    onCreate: (status: string) => void;
}) {
    const [dragging, setDragging] = useState<number | null>(null);
    const [over, setOver] = useState<string | null>(null);

    const drop = (event: DragEvent, status: string) => {
        event.preventDefault();
        const id = Number(event.dataTransfer.getData('text/plain'));
        const task = tasks.find((t) => t.id === id);
        setDragging(null);
        setOver(null);

        if (task && task.status !== status) {
            router.patch(
                updateStatus(id).url,
                { status },
                { preserveScroll: true, preserveState: true },
            );
        }
    };

    const priorityLabel = (v: string) =>
        priorities.find((p) => p.value === v)?.label ?? v;

    return (
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
            <div className="grid min-w-[880px] grid-cols-4 gap-3">
                {statuses.map((status) => {
                    const items = tasks.filter(
                        (t) => t.status === status.value,
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
                                'flex flex-col rounded-xl border bg-muted/40 transition-colors',
                                over === status.value &&
                                    dragging !== null &&
                                    'border-primary bg-primary/5',
                            )}
                        >
                            <header className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold">
                                {status.label}
                                <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
                                    {items.length}
                                </span>
                            </header>
                            <div className="flex min-h-20 flex-1 flex-col gap-2 px-2 pb-2">
                                {items.map((task) => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData(
                                                'text/plain',
                                                String(task.id),
                                            );
                                            setDragging(task.id);
                                        }}
                                        onDragEnd={() => {
                                            setDragging(null);
                                            setOver(null);
                                        }}
                                        onClick={() => onOpen(task)}
                                        className={cn(
                                            'cursor-grab rounded-lg border bg-card p-3 text-left shadow-xs transition-all hover:border-primary/40 active:cursor-grabbing',
                                            dragging === task.id &&
                                                'opacity-40',
                                            task.status === 'done' &&
                                                'opacity-70',
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                'text-sm leading-snug font-medium',
                                                task.status === 'done' &&
                                                    'line-through decoration-1',
                                            )}
                                        >
                                            {task.title}
                                        </p>
                                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                            {task.priority !== 'medium' && (
                                                <StatusBadge
                                                    tone={
                                                        PRIORITY_TONE[
                                                            task.priority
                                                        ] ?? 'neutral'
                                                    }
                                                    className="px-1.5 text-[10px]"
                                                >
                                                    {priorityLabel(
                                                        task.priority,
                                                    )}
                                                </StatusBadge>
                                            )}
                                            {task.due_date && (
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]',
                                                        task.overdue
                                                            ? 'bg-destructive/15 text-destructive-foreground'
                                                            : 'bg-muted text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarDays className="size-3" />
                                                    {formatDate(task.due_date)}
                                                </span>
                                            )}
                                            {!!task.comments_count && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <MessageSquare className="size-3" />
                                                    {task.comments_count}
                                                </span>
                                            )}
                                            {task.assignee && (
                                                <span
                                                    title={task.assignee.name}
                                                    className="ml-auto flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
                                                >
                                                    {task.assignee.name
                                                        .split(' ')
                                                        .map((p) => p[0])
                                                        .slice(0, 2)
                                                        .join('')}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => onCreate(status.value)}
                                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                >
                                    <Plus className="size-3.5" />
                                    Agregar tarea
                                </button>
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
