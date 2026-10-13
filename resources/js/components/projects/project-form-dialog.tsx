import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/admin/projects';
import type { Option, ProjectDetail } from '@/types';

export type ProjectOptions = {
    statuses: Option[];
    priorities: Option[];
    categories: Option[];
    clients: Option[];
};

const PROGRESS_MODES: Option[] = [
    { value: 'tasks', label: 'Calcular según las tareas' },
    { value: 'manual', label: 'Fijarlo a mano' },
];

/** Crear o editar un proyecto. */
export function ProjectFormDialog({
    open,
    onClose,
    project,
    clientId,
    options,
}: {
    open: boolean;
    onClose: () => void;
    project?: ProjectDetail;
    clientId?: number;
    options: ProjectOptions;
}) {
    const form = useForm({
        client_id: String(project?.client?.id ?? clientId ?? ''),
        name: project?.name ?? '',
        description: project?.description ?? '',
        category: project?.category ?? '',
        status: project?.status ?? 'planning',
        priority: project?.priority ?? 'medium',
        start_date: project?.start_date ?? '',
        due_date: project?.due_date ?? '',
        agreed_amount: project?.agreed_amount ?? '',
        currency: project?.currency ?? 'COP',
        progress_mode: project?.progress_mode ?? 'tasks',
        manual_progress: project?.manual_progress?.toString() ?? '',
        observations: project?.observations ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                if (!project) {
                    form.reset();
                }
                onClose();
            },
        };

        if (project) {
            form.put(update(project.id).url, opts);
        } else {
            form.post(store().url, opts);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>
                            {project ? 'Editar proyecto' : 'Nuevo proyecto'}
                        </DialogTitle>
                        <DialogDescription>
                            El valor contratado es lo acordado con el cliente.
                            Los pagos recibidos se registran aparte.
                        </DialogDescription>
                    </DialogHeader>

                    {options.clients.length === 0 ? (
                        <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                            Primero registra un cliente: todo proyecto pertenece
                            a uno.
                        </p>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2">
                            <FormField
                                id="project-name"
                                label="Nombre del proyecto"
                                error={form.errors.name}
                                className="sm:col-span-2"
                            >
                                <Input
                                    id="project-name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    required
                                    autoFocus
                                />
                            </FormField>
                            <FormField
                                id="project-client"
                                label="Cliente"
                                error={form.errors.client_id}
                            >
                                <OptionSelect
                                    id="project-client"
                                    value={form.data.client_id}
                                    options={options.clients}
                                    placeholder="Elige un cliente"
                                    onChange={(v) =>
                                        form.setData('client_id', v)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="project-category"
                                label="Tipo de proyecto"
                                error={form.errors.category}
                            >
                                <OptionSelect
                                    id="project-category"
                                    value={form.data.category}
                                    options={options.categories}
                                    allLabel="Sin definir"
                                    onChange={(v) =>
                                        form.setData('category', v)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="project-status"
                                label="Estado"
                                error={form.errors.status}
                            >
                                <OptionSelect
                                    id="project-status"
                                    value={form.data.status}
                                    options={options.statuses}
                                    onChange={(v) => form.setData('status', v)}
                                />
                            </FormField>
                            <FormField
                                id="project-priority"
                                label="Prioridad"
                                error={form.errors.priority}
                            >
                                <OptionSelect
                                    id="project-priority"
                                    value={form.data.priority}
                                    options={options.priorities}
                                    onChange={(v) =>
                                        form.setData('priority', v)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="project-start"
                                label="Inicio"
                                error={form.errors.start_date}
                            >
                                <Input
                                    id="project-start"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'start_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                id="project-due"
                                label="Entrega estimada"
                                error={form.errors.due_date}
                            >
                                <Input
                                    id="project-due"
                                    type="date"
                                    value={form.data.due_date}
                                    onChange={(e) =>
                                        form.setData('due_date', e.target.value)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="project-amount"
                                label="Valor contratado"
                                hint="Opcional. Sin puntos ni comas."
                                error={form.errors.agreed_amount}
                            >
                                <div className="flex gap-2">
                                    <Input
                                        id="project-amount"
                                        inputMode="decimal"
                                        value={form.data.agreed_amount}
                                        onChange={(e) =>
                                            form.setData(
                                                'agreed_amount',
                                                e.target.value.replace(
                                                    /[^\d.]/g,
                                                    '',
                                                ),
                                            )
                                        }
                                    />
                                    <Input
                                        aria-label="Moneda"
                                        className="w-20 uppercase"
                                        maxLength={3}
                                        value={form.data.currency}
                                        onChange={(e) =>
                                            form.setData(
                                                'currency',
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                    />
                                </div>
                            </FormField>
                            <FormField
                                id="project-progress-mode"
                                label="Avance"
                                error={form.errors.progress_mode}
                            >
                                <OptionSelect
                                    id="project-progress-mode"
                                    value={form.data.progress_mode}
                                    options={PROGRESS_MODES}
                                    onChange={(v) =>
                                        form.setData(
                                            'progress_mode',
                                            v as 'tasks' | 'manual',
                                        )
                                    }
                                />
                            </FormField>
                            {form.data.progress_mode === 'manual' && (
                                <FormField
                                    id="project-manual"
                                    label="Porcentaje de avance"
                                    error={form.errors.manual_progress}
                                >
                                    <Input
                                        id="project-manual"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={form.data.manual_progress}
                                        onChange={(e) =>
                                            form.setData(
                                                'manual_progress',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </FormField>
                            )}
                            <FormField
                                id="project-description"
                                label="Descripción y alcance"
                                error={form.errors.description}
                                className="sm:col-span-2"
                            >
                                <Textarea
                                    id="project-description"
                                    rows={3}
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                id="project-observations"
                                label="Observaciones internas"
                                error={form.errors.observations}
                                className="sm:col-span-2"
                            >
                                <Textarea
                                    id="project-observations"
                                    rows={2}
                                    value={form.data.observations}
                                    onChange={(e) =>
                                        form.setData(
                                            'observations',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing || options.clients.length === 0
                            }
                        >
                            {form.processing
                                ? 'Guardando…'
                                : project
                                  ? 'Guardar cambios'
                                  : 'Crear proyecto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
