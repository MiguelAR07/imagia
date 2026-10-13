import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
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
import { move } from '@/routes/admin/leads';
import type { Stage } from '@/types';

/** Pide el motivo antes de mover un prospecto a una etapa de «perdido». */
export function LostReasonDialog({
    leadId,
    stage,
    onClose,
}: {
    leadId: number;
    stage: Stage;
    onClose: () => void;
}) {
    const form = useForm({ pipeline_stage_id: stage.id, lost_reason: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(move(leadId).url, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Mover a «{stage.name}»</DialogTitle>
                        <DialogDescription>
                            Saber por qué se pierden las oportunidades ayuda a
                            mejorar las propuestas.
                        </DialogDescription>
                    </DialogHeader>
                    <FormField
                        id="lost-reason"
                        label="Motivo"
                        error={form.errors.lost_reason}
                    >
                        <Input
                            id="lost-reason"
                            value={form.data.lost_reason}
                            placeholder="Ej.: eligió otra opción, presupuesto insuficiente…"
                            onChange={(e) =>
                                form.setData('lost_reason', e.target.value)
                            }
                            required
                            autoFocus
                        />
                    </FormField>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Mover
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
