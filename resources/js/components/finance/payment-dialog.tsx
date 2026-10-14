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
import { formatMoney } from '@/lib/format';
import { store, update } from '@/routes/admin/finance/payments';
import type { FinanceProjectOption, Option, PaymentRow } from '@/types';

const today = () => new Date().toLocaleDateString('en-CA');

/**
 * Registrar o editar un pago recibido. Con `projectId` el proyecto queda fijo
 * (desde la ficha del proyecto); si no, se elige en la lista.
 */
export function PaymentDialog({
    payment,
    projectId,
    pending,
    currency = 'COP',
    projects = [],
    methods,
    onClose,
}: {
    payment?: PaymentRow;
    projectId?: number;
    pending?: number | null;
    currency?: string;
    projects?: FinanceProjectOption[];
    methods: Option[];
    onClose: () => void;
}) {
    const form = useForm({
        project_id: String(payment?.project_id ?? projectId ?? ''),
        amount: payment?.amount ?? '',
        paid_on: payment?.paid_on ?? today(),
        method: payment?.method ?? 'transfer',
        reference: payment?.reference ?? '',
        notes: payment?.notes ?? '',
    });

    const selected = projects.find((p) => p.value === form.data.project_id);
    const balance = selected ? selected.pending : pending;
    const money = selected?.currency ?? payment?.currency ?? currency;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (payment) {
            form.put(update(payment.id).url, options);
        } else {
            form.post(store().url, options);
        }
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {payment ? 'Editar pago' : 'Registrar pago recibido'}
                    </DialogTitle>
                    <DialogDescription>
                        Registra solo dinero que ya recibiste. Las cotizaciones
                        no cuentan como pagos.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    {!payment && projectId === undefined && (
                        <FormField
                            id="pay-project"
                            label="Proyecto"
                            error={form.errors.project_id}
                            className="sm:col-span-2"
                        >
                            <OptionSelect
                                id="pay-project"
                                value={form.data.project_id}
                                options={projects}
                                placeholder="Elige el proyecto"
                                onChange={(v) => form.setData('project_id', v)}
                            />
                        </FormField>
                    )}
                    <FormField
                        id="pay-amount"
                        label={`Valor (${money})`}
                        error={form.errors.amount}
                        hint={
                            balance !== null &&
                            balance !== undefined &&
                            !payment
                                ? `Falta por cobrar: ${formatMoney(balance, money)}`
                                : undefined
                        }
                    >
                        <Input
                            id="pay-amount"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={form.data.amount}
                            onChange={(e) =>
                                form.setData('amount', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    <FormField
                        id="pay-date"
                        label="Fecha en que lo recibiste"
                        error={form.errors.paid_on}
                    >
                        <Input
                            id="pay-date"
                            type="date"
                            max={today()}
                            value={form.data.paid_on}
                            onChange={(e) =>
                                form.setData('paid_on', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    <FormField
                        id="pay-method"
                        label="Medio de pago"
                        error={form.errors.method}
                    >
                        <OptionSelect
                            id="pay-method"
                            value={form.data.method}
                            options={methods}
                            onChange={(v) => form.setData('method', v)}
                        />
                    </FormField>
                    <FormField
                        id="pay-ref"
                        label="Referencia (opcional)"
                        error={form.errors.reference}
                    >
                        <Input
                            id="pay-ref"
                            value={form.data.reference}
                            placeholder="Número de la transacción"
                            onChange={(e) =>
                                form.setData('reference', e.target.value)
                            }
                        />
                    </FormField>
                    <FormField
                        id="pay-notes"
                        label="Notas (opcional)"
                        error={form.errors.notes}
                        className="sm:col-span-2"
                    >
                        <Textarea
                            id="pay-notes"
                            rows={2}
                            value={form.data.notes}
                            onChange={(e) =>
                                form.setData('notes', e.target.value)
                            }
                        />
                    </FormField>

                    <DialogFooter className="sm:col-span-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {payment ? 'Guardar cambios' : 'Registrar pago'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
