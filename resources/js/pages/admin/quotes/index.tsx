import { Head, Link, router, useForm } from '@inertiajs/react';
import { FileText, Percent, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useFilters } from '@/hooks/use-filters';
import { formatDate, formatMoney } from '@/lib/format';
import { QUOTE_STATUS_TONE } from '@/lib/quote-labels';
import { create, index, show } from '@/routes/admin/quotes';
import {
    destroy as destroyTax,
    store as storeTax,
} from '@/routes/admin/quotes/taxes';
import type { Option, Paginated, QuoteListItem } from '@/types';

type Props = {
    quotes: Paginated<QuoteListItem>;
    pending: { currency: string; amount: string; count: number }[];
    filters: { q: string; status: string };
    statuses: Option[];
    taxRates: TaxRateRow[];
};

type TaxRateRow = {
    id: number;
    name: string;
    rate: string;
    is_default: boolean;
};

export default function QuotesIndex({
    quotes,
    pending,
    filters,
    statuses,
    taxRates,
}: Props) {
    const { filters: current, set } = useFilters(index().url, filters);
    const [taxes, setTaxes] = useState(false);
    const label = (v: string) =>
        statuses.find((s) => s.value === v)?.label ?? v;

    return (
        <>
            <Head title="Cotizaciones" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Cotizaciones"
                    description={
                        pending.length > 0
                            ? `Propuestas abiertas: ${pending.map((p) => `${p.count} por ${formatMoney(p.amount, p.currency)}`).join(' · ')}. Es valor cotizado, no dinero recibido.`
                            : 'Propuestas para clientes y prospectos. Una cotización nunca registra pagos.'
                    }
                    actions={
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setTaxes(true)}
                            >
                                <Percent className="size-4" />
                                Impuestos
                            </Button>
                            <Button asChild>
                                <Link href={create()}>
                                    <Plus className="size-4" />
                                    Nueva cotización
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-56 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Buscar cotizaciones"
                            placeholder="Buscar por número, título, cliente o prospecto"
                            className="pl-9"
                            value={current.q}
                            onChange={(e) => set('q', e.target.value, true)}
                        />
                    </div>
                    <OptionSelect
                        value={current.status}
                        options={statuses}
                        allLabel="Todos los estados"
                        onChange={(v) => set('status', v)}
                        className="w-48"
                    />
                </div>

                <div className="overflow-x-auto rounded-xl border bg-card">
                    {quotes.data.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No hay cotizaciones"
                            description="Crea una propuesta con conceptos, descuentos e impuestos, y descárgala en PDF."
                        />
                    ) : (
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="border-b text-left font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                    <th className="px-4 py-3 font-medium">
                                        Número
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Propuesta
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Válida hasta
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.data.map((q) => (
                                    <tr
                                        key={q.id}
                                        className="border-b last:border-0 hover:bg-accent/40"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs">
                                            <Link
                                                href={show(q.id)}
                                                className="hover:underline"
                                            >
                                                {q.number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={show(q.id)}
                                                className="font-medium hover:underline"
                                            >
                                                {q.title}
                                            </Link>
                                            <div className="text-muted-foreground">
                                                {q.recipient}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                tone={
                                                    QUOTE_STATUS_TONE[
                                                        q.status
                                                    ] ?? 'neutral'
                                                }
                                            >
                                                {label(q.status)}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {q.past_validity ? (
                                                <StatusBadge tone="warning">
                                                    Venció ·{' '}
                                                    {formatDate(q.valid_until)}
                                                </StatusBadge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {formatDate(q.valid_until)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                                            {formatMoney(q.total, q.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Pagination page={quotes} />
            </div>

            {taxes && (
                <TaxesDialog rates={taxRates} onClose={() => setTaxes(false)} />
            )}
        </>
    );
}

/** Impuestos disponibles para los conceptos de las cotizaciones. */
function TaxesDialog({
    rates,
    onClose,
}: {
    rates: TaxRateRow[];
    onClose: () => void;
}) {
    const form = useForm({ name: '', rate: '', is_default: false });

    const add = (event: FormEvent) => {
        event.preventDefault();
        form.post(storeTax().url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Impuestos</DialogTitle>
                    <DialogDescription>
                        Se eligen en cada concepto de la cotización. El
                        predeterminado se aplica a los conceptos nuevos.
                    </DialogDescription>
                </DialogHeader>
                {rates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Aún no hay impuestos. Agrega los que apliquen a tu
                        negocio.
                    </p>
                ) : (
                    <ul className="divide-y rounded-lg border">
                        {rates.map((r) => (
                            <li
                                key={r.id}
                                className="flex items-center justify-between gap-2 p-2.5 text-sm"
                            >
                                <span>
                                    {r.name} ({r.rate} %)
                                    {r.is_default && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (predeterminado)
                                        </span>
                                    )}
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Eliminar ${r.name}`}
                                    onClick={() =>
                                        router.delete(destroyTax(r.id).url, {
                                            preserveScroll: true,
                                            preserveState: true,
                                        })
                                    }
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <form
                    onSubmit={add}
                    className="grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-[1fr_100px_auto]"
                >
                    <div className="grid gap-1">
                        <Input
                            aria-label="Nombre del impuesto"
                            placeholder="Ej.: IVA"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-1">
                        <Input
                            aria-label="Porcentaje"
                            placeholder="%"
                            inputMode="decimal"
                            value={form.data.rate}
                            onChange={(e) =>
                                form.setData(
                                    'rate',
                                    e.target.value.replace(/[^\d.]/g, ''),
                                )
                            }
                            required
                        />
                        <InputError message={form.errors.rate} />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        Agregar
                    </Button>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-3">
                        <Checkbox
                            checked={form.data.is_default}
                            onCheckedChange={(c) =>
                                form.setData('is_default', c === true)
                            }
                        />
                        Usar como predeterminado
                    </label>
                </form>
            </DialogContent>
        </Dialog>
    );
}

QuotesIndex.layout = {
    breadcrumbs: [{ title: 'Cotizaciones', href: index() }],
};
