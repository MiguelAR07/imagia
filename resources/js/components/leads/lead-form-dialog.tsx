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
import { store, update } from '@/routes/admin/leads';
import type { LeadDetail, Option, Stage } from '@/types';

type Props = {
    open: boolean;
    onClose: () => void;
    lead?: LeadDetail;
    stages: Stage[];
    initialStageId?: number;
    options: { sources: Option[]; users: Option[] };
};

/** Crear o editar un prospecto. La etapa solo se elige al crearlo. */
export function LeadFormDialog({
    open,
    onClose,
    lead,
    stages,
    initialStageId,
    options,
}: Props) {
    const form = useForm({
        name: lead?.name ?? '',
        company: lead?.company ?? '',
        email: lead?.email ?? '',
        phone: lead?.phone ?? '',
        source: lead?.source ?? 'manual',
        need: lead?.need ?? '',
        budget_range: lead?.budget_range ?? '',
        urgency: lead?.urgency ?? '',
        pipeline_stage_id: String(
            lead?.pipeline_stage_id ?? initialStageId ?? stages[0]?.id ?? '',
        ),
        assigned_to: lead?.assigned_to ? String(lead.assigned_to) : '',
        next_follow_up_at: lead?.next_follow_up_at ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                if (!lead) {
                    form.reset();
                }
                onClose();
            },
        };

        if (lead) {
            form.put(update(lead.id).url, opts);
        } else {
            form.post(store().url, opts);
        }
    };

    const stageOptions = stages.map((s) => ({
        value: String(s.id),
        label: s.name,
    }));

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>
                            {lead ? 'Editar prospecto' : 'Nuevo prospecto'}
                        </DialogTitle>
                        <DialogDescription>
                            Registra lo que sabes ahora. Lo demás lo completas
                            mientras avanza la conversación.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                            id="lead-name"
                            label="Nombre"
                            error={form.errors.name}
                        >
                            <Input
                                id="lead-name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                                autoFocus
                            />
                        </FormField>
                        <FormField
                            id="lead-company"
                            label="Empresa"
                            error={form.errors.company}
                        >
                            <Input
                                id="lead-company"
                                value={form.data.company}
                                onChange={(e) =>
                                    form.setData('company', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="lead-email"
                            label="Correo"
                            error={form.errors.email}
                        >
                            <Input
                                id="lead-email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="lead-phone"
                            label="Teléfono"
                            error={form.errors.phone}
                        >
                            <Input
                                id="lead-phone"
                                type="tel"
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="lead-source"
                            label="¿Cómo llegó?"
                            error={form.errors.source}
                        >
                            <OptionSelect
                                id="lead-source"
                                value={form.data.source}
                                options={options.sources}
                                onChange={(v) => form.setData('source', v)}
                            />
                        </FormField>
                        {lead ? (
                            <div />
                        ) : (
                            <FormField
                                id="lead-stage"
                                label="Etapa"
                                error={form.errors.pipeline_stage_id}
                            >
                                <OptionSelect
                                    id="lead-stage"
                                    value={form.data.pipeline_stage_id}
                                    options={stageOptions}
                                    onChange={(v) =>
                                        form.setData('pipeline_stage_id', v)
                                    }
                                />
                            </FormField>
                        )}
                        <FormField
                            id="lead-need"
                            label="¿Qué necesita?"
                            error={form.errors.need}
                            className="sm:col-span-2"
                        >
                            <Textarea
                                id="lead-need"
                                value={form.data.need}
                                onChange={(e) =>
                                    form.setData('need', e.target.value)
                                }
                                rows={3}
                            />
                        </FormField>
                        <FormField
                            id="lead-budget"
                            label="Presupuesto aproximado"
                            error={form.errors.budget_range}
                        >
                            <Input
                                id="lead-budget"
                                value={form.data.budget_range}
                                placeholder="Ej.: entre 2 y 4 millones"
                                onChange={(e) =>
                                    form.setData('budget_range', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="lead-urgency"
                            label="¿Para cuándo?"
                            error={form.errors.urgency}
                        >
                            <Input
                                id="lead-urgency"
                                value={form.data.urgency}
                                placeholder="Ej.: este mes"
                                onChange={(e) =>
                                    form.setData('urgency', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="lead-assigned"
                            label="Responsable"
                            error={form.errors.assigned_to}
                        >
                            <OptionSelect
                                id="lead-assigned"
                                value={form.data.assigned_to}
                                options={options.users}
                                allLabel="Sin asignar"
                                onChange={(v) => form.setData('assigned_to', v)}
                            />
                        </FormField>
                        <FormField
                            id="lead-follow"
                            label="Próximo seguimiento"
                            error={form.errors.next_follow_up_at}
                        >
                            <Input
                                id="lead-follow"
                                type="date"
                                value={form.data.next_follow_up_at}
                                onChange={(e) =>
                                    form.setData(
                                        'next_follow_up_at',
                                        e.target.value,
                                    )
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
                                : lead
                                  ? 'Guardar cambios'
                                  : 'Crear prospecto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
