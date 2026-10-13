import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/admin/tasks';
import type { Option, TaskCard } from '@/types';

export type TaskOptions = {
    statuses: Option[];
    priorities: Option[];
    users: Option[];
    /** Solo al crear desde la vista general de tareas. */
    projects?: Option[];
    /** Hitos del proyecto, si se crea dentro de él. */
    milestones?: Option[];
};

/** Crear o editar una tarea. */
export function TaskFormDialog({
    onClose,
    task,
    projectId,
    initialStatus = 'todo',
    options,
}: {
    onClose: () => void;
    task?: TaskCard;
    projectId?: number;
    initialStatus?: string;
    options: TaskOptions;
}) {
    const form = useForm({
        project_id: String(task?.project_id ?? projectId ?? ''),
        milestone_id: task?.milestone_id ? String(task.milestone_id) : '',
        title: task?.title ?? '',
        description: task?.description ?? '',
        status: task?.status ?? initialStatus,
        priority: task?.priority ?? 'medium',
        assignee_id: task?.assignee_id ? String(task.assignee_id) : '',
        due_date: task?.due_date ?? '',
        weight: String(task?.weight ?? 1),
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };

        if (task) {
            form.transform(({ project_id: _ignored, ...rest }) => rest);
            form.put(update(task.id).url, opts);
        } else {
            form.post(store().url, opts);
        }
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {task ? 'Editar tarea' : 'Nueva tarea'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                            id="task-title"
                            label="Qué hay que hacer"
                            error={form.errors.title}
                            className="sm:col-span-2"
                        >
                            <Input
                                id="task-title"
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                required
                                autoFocus
                            />
                        </FormField>
                        {!task && options.projects && (
                            <FormField
                                id="task-project"
                                label="Proyecto"
                                error={form.errors.project_id}
                                className="sm:col-span-2"
                            >
                                <OptionSelect
                                    id="task-project"
                                    value={form.data.project_id}
                                    options={options.projects}
                                    placeholder="Elige un proyecto"
                                    onChange={(v) =>
                                        form.setData('project_id', v)
                                    }
                                />
                            </FormField>
                        )}
                        <FormField
                            id="task-status"
                            label="Estado"
                            error={form.errors.status}
                        >
                            <OptionSelect
                                id="task-status"
                                value={form.data.status}
                                options={options.statuses}
                                onChange={(v) => form.setData('status', v)}
                            />
                        </FormField>
                        <FormField
                            id="task-priority"
                            label="Prioridad"
                            error={form.errors.priority}
                        >
                            <OptionSelect
                                id="task-priority"
                                value={form.data.priority}
                                options={options.priorities}
                                onChange={(v) => form.setData('priority', v)}
                            />
                        </FormField>
                        <FormField
                            id="task-assignee"
                            label="Responsable"
                            error={form.errors.assignee_id}
                        >
                            <OptionSelect
                                id="task-assignee"
                                value={form.data.assignee_id}
                                options={options.users}
                                allLabel="Sin asignar"
                                onChange={(v) => form.setData('assignee_id', v)}
                            />
                        </FormField>
                        <FormField
                            id="task-due"
                            label="Fecha límite"
                            error={form.errors.due_date}
                        >
                            <Input
                                id="task-due"
                                type="date"
                                value={form.data.due_date}
                                onChange={(e) =>
                                    form.setData('due_date', e.target.value)
                                }
                            />
                        </FormField>
                        {options.milestones &&
                            options.milestones.length > 0 && (
                                <FormField
                                    id="task-milestone"
                                    label="Hito"
                                    error={form.errors.milestone_id}
                                >
                                    <OptionSelect
                                        id="task-milestone"
                                        value={form.data.milestone_id}
                                        options={options.milestones}
                                        allLabel="Sin hito"
                                        onChange={(v) =>
                                            form.setData('milestone_id', v)
                                        }
                                    />
                                </FormField>
                            )}
                        <FormField
                            id="task-weight"
                            label="Peso en el avance"
                            hint="1 = pequeña · 10 = muy grande"
                            error={form.errors.weight}
                        >
                            <Input
                                id="task-weight"
                                type="number"
                                min={1}
                                max={10}
                                value={form.data.weight}
                                onChange={(e) =>
                                    form.setData('weight', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="task-description"
                            label="Detalle"
                            error={form.errors.description}
                            className="sm:col-span-2"
                        >
                            <Textarea
                                id="task-description"
                                rows={3}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Guardando…'
                                : task
                                  ? 'Guardar'
                                  : 'Crear tarea'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
