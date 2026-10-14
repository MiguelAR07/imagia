import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { store, update } from '@/routes/admin/finance/expenses';
import type { ExpenseRow, Option } from '@/types';

const today = () => new Date().toLocaleDateString('en-CA');

/**
 * Registrar o editar un gasto. Con proyecto cuenta para su rentabilidad;
 * sin proyecto es un gasto general del negocio.
 */
export function ExpenseDialog({
    expense,
    projectId,
    projects = [],
    categories,
    onClose,
}: {
    expense?: ExpenseRow;
    projectId?: number;
    projects?: Option[];
    categories: string[];
    onClose: () => void;
}) {
    const form = useForm({
        description: expense?.description ?? '',
        vendor: expense?.vendor ?? '',
        category: expense?.category ?? '',
        project_id: String(expense?.project_id ?? projectId ?? ''),
        amount: expense?.amount ?? '',
        currency: expense?.currency ?? 'COP',
        spent_on: expense?.spent_on ?? today(),
        is_recurring: expense?.is_recurring ?? false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (expense) {
            form.put(update(expense.id).url, options);
        } else {
            form.post(store().url, options);
        }
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {expense ? 'Editar gasto' : 'Registrar gasto'}
                    </DialogTitle>
                    <DialogDescription>
                        Herramientas, servicios, pagos a terceros… Si es de un
                        proyecto, elígelo para calcular su rentabilidad.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        id="exp-desc"
                        label="Descripción"
                        error={form.errors.description}
                        className="sm:col-span-2"
                    >
                        <Input
                            id="exp-desc"
                            value={form.data.description}
                            placeholder="Ej.: hosting anual, plantilla, diseñador"
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    <FormField
                        id="exp-amount"
                        label="Valor"
                        error={form.errors.amount}
                    >
                        <Input
                            id="exp-amount"
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
                        id="exp-date"
                        label="Fecha"
                        error={form.errors.spent_on}
                    >
                        <Input
                            id="exp-date"
                            type="date"
                            value={form.data.spent_on}
                            onChange={(e) =>
                                form.setData('spent_on', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    {projectId === undefined && (
                        <FormField
                            id="exp-project"
                            label="Proyecto"
                            error={form.errors.project_id}
                        >
                            <OptionSelect
                                id="exp-project"
                                value={form.data.project_id}
                                options={projects}
                                allLabel="Gasto general"
                                onChange={(v) => form.setData('project_id', v)}
                            />
                        </FormField>
                    )}
                    <FormField
                        id="exp-category"
                        label="Categoría"
                        error={form.errors.category}
                        hint="Elige una o escribe una nueva."
                    >
                        <Input
                            id="exp-category"
                            list="expense-categories"
                            value={form.data.category}
                            onChange={(e) =>
                                form.setData('category', e.target.value)
                            }
                        />
                        <datalist id="expense-categories">
                            {categories.map((c) => (
                                <option key={c} value={c} />
                            ))}
                        </datalist>
                    </FormField>
                    <FormField
                        id="exp-vendor"
                        label="Proveedor (opcional)"
                        error={form.errors.vendor}
                    >
                        <Input
                            id="exp-vendor"
                            value={form.data.vendor}
                            onChange={(e) =>
                                form.setData('vendor', e.target.value)
                            }
                        />
                    </FormField>
                    {form.data.project_id === '' && (
                        <FormField
                            id="exp-currency"
                            label="Moneda"
                            error={form.errors.currency}
                        >
                            <Input
                                id="exp-currency"
                                maxLength={3}
                                value={form.data.currency}
                                onChange={(e) =>
                                    form.setData(
                                        'currency',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                            />
                        </FormField>
                    )}
                    <label className="flex items-center gap-3 rounded-lg border p-3 text-sm sm:col-span-2">
                        <Checkbox
                            checked={form.data.is_recurring}
                            onCheckedChange={(c) =>
                                form.setData('is_recurring', c === true)
                            }
                        />
                        Es un gasto recurrente (mensual o anual)
                    </label>

                    <DialogFooter className="sm:col-span-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {expense ? 'Guardar cambios' : 'Registrar gasto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
