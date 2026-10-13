import { Head, Link, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatMoney } from '@/lib/format';
import { previewTotals } from '@/lib/quote-labels';
import { cn } from '@/lib/utils';
import { index, show, store, update } from '@/routes/admin/quotes';
import type { Option, TaxOption } from '@/types';

type Item = {
    description: string;
    details: string;
    quantity: string;
    unit_price: string;
    discount_percent: string;
    tax_rate_id: string;
};

type PlanOption = Option & {
    price: string | null;
    price_type: string;
    features: string[];
    exclusions: string | null;
};

type QuoteData = {
    id: number;
    number: string;
    title: string;
    scope: string | null;
    currency: string;
    payment_terms: string | null;
    exclusions: string | null;
    notes: string | null;
    client_id: string;
    lead_id: string;
    plan_id: string;
    valid_until: string | null;
    items: {
        description: string;
        details: string | null;
        quantity: string;
        unit_price: string;
        discount_percent: string;
        tax_rate_id: string;
    }[];
};

type Props = {
    quote: QuoteData | null;
    prefill: { client_id: string; lead_id: string } | null;
    clients: Option[];
    leads: Option[];
    plans: PlanOption[];
    tax_rates: TaxOption[];
};

const in30Days = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);

    return d.toISOString().slice(0, 10);
};

export default function QuoteForm({
    quote,
    prefill,
    clients,
    leads,
    plans,
    tax_rates,
}: Props) {
    const defaultTax = tax_rates.find((t) => t.is_default)?.value ?? '';
    const emptyItem = (): Item => ({
        description: '',
        details: '',
        quantity: '1',
        unit_price: '',
        discount_percent: '0',
        tax_rate_id: defaultTax,
    });

    const form = useForm({
        client_id: quote?.client_id ?? prefill?.client_id ?? '',
        lead_id: quote?.lead_id ?? prefill?.lead_id ?? '',
        plan_id: quote?.plan_id ?? '',
        title: quote?.title ?? '',
        scope: quote?.scope ?? '',
        currency: quote?.currency ?? 'COP',
        payment_terms:
            quote?.payment_terms ?? '50 % al iniciar y 50 % a la entrega.',
        valid_until: quote?.valid_until ?? in30Days(),
        exclusions: quote?.exclusions ?? '',
        notes: quote?.notes ?? '',
        items: (quote?.items.map((i) => ({
            ...i,
            details: i.details ?? '',
        })) ?? [emptyItem()]) as Item[],
    });
    const errors = form.errors as Record<string, string | undefined>;
    const [recipientType, setRecipientType] = useState<'client' | 'lead'>(
        form.data.lead_id && !form.data.client_id ? 'lead' : 'client',
    );

    setLayoutProps({
        breadcrumbs: [
            { title: 'Cotizaciones', href: index() },
            {
                title: quote ? quote.number : 'Nueva cotización',
                href: quote ? show(quote.id) : index(),
            },
        ],
    });

    const rates = useMemo(
        () => Object.fromEntries(tax_rates.map((t) => [t.value, t.rate])),
        [tax_rates],
    );
    const totals = previewTotals(form.data.items, rates);

    const setItem = (i: number, data: Partial<Item>) =>
        form.setData(
            'items',
            form.data.items.map((it, j) => (j === i ? { ...it, ...data } : it)),
        );

    const usePlan = (planId: string) => {
        form.setData('plan_id', planId);
        const plan = plans.find((p) => p.value === planId);

        if (!plan) {
            return;
        }

        const planItem: Item = {
            ...emptyItem(),
            description: `Plan ${plan.label}`,
            details: plan.features.length
                ? `Incluye: ${plan.features.join(', ')}.`
                : '',
            unit_price:
                plan.price_type !== 'quote' && plan.price
                    ? String(Number(plan.price))
                    : '',
        };
        const onlyEmpty =
            form.data.items.length === 1 && !form.data.items[0].description;

        form.setData((d) => ({
            ...d,
            plan_id: planId,
            title: d.title || `Propuesta: ${plan.label}`,
            exclusions: d.exclusions || (plan.exclusions ?? ''),
            items: onlyEmpty ? [planItem] : [...d.items, planItem],
        }));
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((d) => ({
            ...d,
            client_id: recipientType === 'client' ? d.client_id : '',
            lead_id: recipientType === 'lead' ? d.lead_id : '',
        }));

        if (quote) {
            form.put(update(quote.id).url);
        } else {
            form.post(store().url);
        }
    };

    return (
        <>
            <Head
                title={quote ? `Editar ${quote.number}` : 'Nueva cotización'}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <Link
                    href={quote ? show(quote.id) : index()}
                    className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    {quote
                        ? `Volver a ${quote.number}`
                        : 'Volver a cotizaciones'}
                </Link>

                <form
                    onSubmit={submit}
                    className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]"
                >
                    <div className="space-y-10">
                        <fieldset className="grid gap-5 sm:grid-cols-2">
                            <legend className="mb-4 text-base font-semibold">
                                Para quién
                            </legend>
                            <div className="sm:col-span-2">
                                <div
                                    role="radiogroup"
                                    aria-label="Tipo de destinatario"
                                    className="inline-flex rounded-lg border p-0.5"
                                >
                                    {(
                                        [
                                            ['client', 'Cliente'],
                                            ['lead', 'Prospecto'],
                                        ] as const
                                    ).map(([v, text]) => (
                                        <button
                                            key={v}
                                            type="button"
                                            role="radio"
                                            aria-checked={recipientType === v}
                                            onClick={() => setRecipientType(v)}
                                            className={cn(
                                                'rounded-md px-3 py-1.5 text-sm transition-colors',
                                                recipientType === v
                                                    ? 'bg-accent text-accent-foreground'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {recipientType === 'client' ? (
                                <FormField
                                    id="q-client"
                                    label="Cliente"
                                    error={errors.client_id}
                                >
                                    <OptionSelect
                                        id="q-client"
                                        value={form.data.client_id}
                                        options={clients}
                                        placeholder="Elige un cliente"
                                        onChange={(v) =>
                                            form.setData('client_id', v)
                                        }
                                    />
                                </FormField>
                            ) : (
                                <FormField
                                    id="q-lead"
                                    label="Prospecto"
                                    hint="Solo prospectos que aún no son clientes."
                                    error={errors.lead_id ?? errors.client_id}
                                >
                                    <OptionSelect
                                        id="q-lead"
                                        value={form.data.lead_id}
                                        options={leads}
                                        placeholder="Elige un prospecto"
                                        onChange={(v) =>
                                            form.setData('lead_id', v)
                                        }
                                    />
                                </FormField>
                            )}
                            <FormField
                                id="q-plan"
                                label="Partir de un plan"
                                hint="Agrega el plan como concepto con su precio y funcionalidades."
                                error={errors.plan_id}
                            >
                                <OptionSelect
                                    id="q-plan"
                                    value={form.data.plan_id}
                                    options={plans}
                                    allLabel="Sin plan"
                                    onChange={(v) =>
                                        v
                                            ? usePlan(v)
                                            : form.setData('plan_id', '')
                                    }
                                />
                            </FormField>
                        </fieldset>

                        <fieldset className="grid gap-5">
                            <legend className="mb-4 text-base font-semibold">
                                Propuesta
                            </legend>
                            <FormField
                                id="q-title"
                                label="Título"
                                error={errors.title}
                            >
                                <Input
                                    id="q-title"
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData('title', e.target.value)
                                    }
                                    placeholder="Ej.: Sistema de agenda para Spa Andrea"
                                    required
                                />
                            </FormField>
                            <FormField
                                id="q-scope"
                                label="Alcance"
                                hint="Qué se va a construir y qué resultado obtiene el cliente."
                                error={errors.scope}
                            >
                                <Textarea
                                    id="q-scope"
                                    rows={4}
                                    value={form.data.scope}
                                    onChange={(e) =>
                                        form.setData('scope', e.target.value)
                                    }
                                />
                            </FormField>
                        </fieldset>

                        <fieldset className="space-y-3">
                            <legend className="text-base font-semibold">
                                Conceptos
                            </legend>
                            <InputError message={errors.items} />
                            {tax_rates.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No hay impuestos configurados. Puedes
                                    agregarlos desde «Cotizaciones → Impuestos».
                                </p>
                            )}
                            <ol className="space-y-3">
                                {form.data.items.map((item, i) => {
                                    const line = previewTotals([item], rates);

                                    return (
                                        <li
                                            key={i}
                                            className="space-y-3 rounded-xl border p-4"
                                        >
                                            <div className="flex gap-2">
                                                <span className="mt-2 w-5 shrink-0 font-mono text-xs text-muted-foreground">
                                                    {i + 1}
                                                </span>
                                                <div className="grid flex-1 gap-2">
                                                    <Input
                                                        aria-label={`Concepto ${i + 1}`}
                                                        placeholder="Concepto, ej.: Módulo de citas"
                                                        value={item.description}
                                                        onChange={(e) =>
                                                            setItem(i, {
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `items.${i}.description`
                                                            ]
                                                        }
                                                    />
                                                    <Textarea
                                                        aria-label={`Detalle del concepto ${i + 1}`}
                                                        placeholder="Detalle (opcional)"
                                                        rows={2}
                                                        value={item.details}
                                                        onChange={(e) =>
                                                            setItem(i, {
                                                                details:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={
                                                        form.data.items
                                                            .length === 1
                                                    }
                                                    aria-label={`Quitar concepto ${i + 1}`}
                                                    onClick={() =>
                                                        form.setData(
                                                            'items',
                                                            form.data.items.filter(
                                                                (_, j) =>
                                                                    j !== i,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                            <div className="grid gap-2 pl-7 sm:grid-cols-[90px_1fr_100px_1fr_auto] sm:items-end">
                                                <LabeledInput
                                                    label="Cantidad"
                                                    value={item.quantity}
                                                    onChange={(v) =>
                                                        setItem(i, {
                                                            quantity: v,
                                                        })
                                                    }
                                                    error={
                                                        errors[
                                                            `items.${i}.quantity`
                                                        ]
                                                    }
                                                />
                                                <LabeledInput
                                                    label="Precio unitario"
                                                    value={item.unit_price}
                                                    onChange={(v) =>
                                                        setItem(i, {
                                                            unit_price: v,
                                                        })
                                                    }
                                                    error={
                                                        errors[
                                                            `items.${i}.unit_price`
                                                        ]
                                                    }
                                                />
                                                <LabeledInput
                                                    label="Desc. %"
                                                    value={
                                                        item.discount_percent
                                                    }
                                                    onChange={(v) =>
                                                        setItem(i, {
                                                            discount_percent: v,
                                                        })
                                                    }
                                                    error={
                                                        errors[
                                                            `items.${i}.discount_percent`
                                                        ]
                                                    }
                                                />
                                                <div className="grid gap-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        Impuesto
                                                    </span>
                                                    <OptionSelect
                                                        value={item.tax_rate_id}
                                                        options={tax_rates}
                                                        allLabel="Sin impuesto"
                                                        onChange={(v) =>
                                                            setItem(i, {
                                                                tax_rate_id: v,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <p className="pb-2 text-right font-mono text-sm tabular-nums">
                                                    {formatMoney(
                                                        line.total,
                                                        form.data.currency,
                                                    )}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    form.setData('items', [
                                        ...form.data.items,
                                        emptyItem(),
                                    ])
                                }
                            >
                                <Plus className="size-4" />
                                Agregar concepto
                            </Button>
                        </fieldset>

                        <fieldset className="grid gap-5 sm:grid-cols-2">
                            <legend className="mb-4 text-base font-semibold">
                                Condiciones
                            </legend>
                            <FormField
                                id="q-terms"
                                label="Forma de pago"
                                error={errors.payment_terms}
                            >
                                <Textarea
                                    id="q-terms"
                                    rows={3}
                                    value={form.data.payment_terms}
                                    onChange={(e) =>
                                        form.setData(
                                            'payment_terms',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                id="q-exclusions"
                                label="No incluye"
                                error={errors.exclusions}
                            >
                                <Textarea
                                    id="q-exclusions"
                                    rows={3}
                                    value={form.data.exclusions}
                                    onChange={(e) =>
                                        form.setData(
                                            'exclusions',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                id="q-valid"
                                label="Válida hasta"
                                error={errors.valid_until}
                            >
                                <Input
                                    id="q-valid"
                                    type="date"
                                    value={form.data.valid_until}
                                    onChange={(e) =>
                                        form.setData(
                                            'valid_until',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                id="q-currency"
                                label="Moneda"
                                error={errors.currency}
                            >
                                <Input
                                    id="q-currency"
                                    className="w-24 uppercase"
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
                            <FormField
                                id="q-notes"
                                label="Observaciones"
                                hint="Aparecen al final del documento."
                                error={errors.notes}
                                className="sm:col-span-2"
                            >
                                <Textarea
                                    id="q-notes"
                                    rows={2}
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData('notes', e.target.value)
                                    }
                                />
                            </FormField>
                        </fieldset>
                    </div>

                    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                        <div className="rounded-2xl border bg-card p-5">
                            <p className="mb-4 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                Resumen
                            </p>
                            <dl className="space-y-2 text-sm">
                                <Row
                                    label="Subtotal"
                                    value={formatMoney(
                                        totals.subtotal,
                                        form.data.currency,
                                    )}
                                />
                                <Row
                                    label="Descuentos"
                                    value={
                                        totals.discount > 0
                                            ? `− ${formatMoney(totals.discount, form.data.currency)}`
                                            : formatMoney(0, form.data.currency)
                                    }
                                />
                                <Row
                                    label="Impuestos"
                                    value={formatMoney(
                                        totals.tax,
                                        form.data.currency,
                                    )}
                                />
                                <div className="flex items-baseline justify-between border-t pt-3">
                                    <dt className="font-semibold">Total</dt>
                                    <dd className="font-display text-2xl font-bold tabular-nums">
                                        {formatMoney(
                                            totals.total,
                                            form.data.currency,
                                        )}
                                    </dd>
                                </div>
                            </dl>
                            <p className="mt-3 flex gap-1.5 text-xs text-muted-foreground">
                                <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                                Vista previa. El total definitivo lo calcula el
                                sistema al guardar.
                            </p>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'Guardando…'
                                : quote
                                  ? 'Guardar cambios'
                                  : 'Guardar como borrador'}
                        </Button>
                        {form.isDirty && !form.processing && (
                            <p className="text-xs text-muted-foreground">
                                Tienes cambios sin guardar.
                            </p>
                        )}
                    </aside>
                </form>
            </div>
        </>
    );
}

function LabeledInput({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Input
                inputMode="decimal"
                value={value}
                onChange={(e) =>
                    onChange(e.target.value.replace(/[^\d.]/g, ''))
                }
            />
            <InputError message={error} />
        </label>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono tabular-nums">{value}</dd>
        </div>
    );
}
