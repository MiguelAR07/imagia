import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Minus, Plus, Trash2, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { PublishToggle } from '@/components/publish-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { planPriceLabel } from '@/lib/plan-price';
import { cn } from '@/lib/utils';
import {
    destroy,
    edit,
    index,
    store,
    update,
} from '@/routes/admin/catalog/plans';
import type { Option } from '@/types';

type PlanFeature = {
    feature_id: number;
    kind: 'included' | 'optional';
    extra_price_note: string | null;
};

type PlanData = {
    id: number;
    name: string;
    slug: string;
    summary: string;
    description: string | null;
    service_id: number | null;
    price_type: string;
    price: string | null;
    currency: string;
    estimated_time: string | null;
    limits: string | null;
    exclusions: string | null;
    badge: string | null;
    is_published: boolean;
    addons: { name: string; note: string | null }[];
    features: PlanFeature[];
    faqs: { question: string; answer: string }[];
};

type Props = {
    plan: PlanData | null;
    services: Option[];
    features: { id: number; name: string }[];
    price_types: Option[];
};

export default function PlanForm({
    plan,
    services,
    features,
    price_types,
}: Props) {
    const form = useForm({
        name: plan?.name ?? '',
        summary: plan?.summary ?? '',
        description: plan?.description ?? '',
        service_id: plan?.service_id ? String(plan.service_id) : '',
        price_type: plan?.price_type ?? 'quote',
        price: plan?.price ?? '',
        currency: plan?.currency ?? 'COP',
        estimated_time: plan?.estimated_time ?? '',
        limits: plan?.limits ?? '',
        exclusions: plan?.exclusions ?? '',
        badge: plan?.badge ?? '',
        is_published: plan?.is_published ?? false,
        features: plan?.features ?? ([] as PlanFeature[]),
        addons: plan?.addons ?? [],
        faqs: plan?.faqs ?? [],
    });
    const errors = form.errors as Record<string, string | undefined>;
    const [featureFilter, setFeatureFilter] = useState('');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Catálogo', href: index() },
            {
                title: plan ? plan.name : 'Nuevo plan',
                href: plan ? edit(plan.id) : index(),
            },
        ],
    });

    const kindOf = (id: number) =>
        form.data.features.find((f) => f.feature_id === id)?.kind ?? null;

    const setKind = (id: number, kind: 'included' | 'optional' | null) => {
        const rest = form.data.features.filter((f) => f.feature_id !== id);
        const current = form.data.features.find((f) => f.feature_id === id);
        form.setData(
            'features',
            kind
                ? [
                      ...rest,
                      {
                          feature_id: id,
                          kind,
                          extra_price_note: current?.extra_price_note ?? null,
                      },
                  ]
                : rest,
        );
    };

    const setNote = (id: number, note: string) =>
        form.setData(
            'features',
            form.data.features.map((f) =>
                f.feature_id === id ? { ...f, extra_price_note: note } : f,
            ),
        );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((d) => ({
            ...d,
            features: [
                ...d.features.filter((f) => f.kind === 'included'),
                ...d.features.filter((f) => f.kind === 'optional'),
            ],
        }));

        if (plan) {
            form.put(update(plan.id).url, { preserveScroll: true });
        } else {
            form.post(store().url);
        }
    };

    const name = (id: number) => features.find((f) => f.id === id)?.name ?? '';
    const included = form.data.features.filter((f) => f.kind === 'included');
    const optional = form.data.features.filter((f) => f.kind === 'optional');
    const visibleFeatures = features.filter((f) =>
        f.name.toLowerCase().includes(featureFilter.toLowerCase()),
    );

    return (
        <>
            <Head title={plan ? plan.name : 'Nuevo plan'} />

            <div>
                <Link
                    href={index()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Volver a planes
                </Link>
            </div>

            <form
                onSubmit={submit}
                className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]"
            >
                <div className="space-y-10">
                    <fieldset className="grid gap-5 sm:grid-cols-2">
                        <legend className="mb-4 text-base font-semibold">
                            Presentación
                        </legend>
                        <FormField
                            id="plan-name"
                            label="Nombre del plan"
                            error={errors.name}
                        >
                            <Input
                                id="plan-name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                            />
                        </FormField>
                        <FormField
                            id="plan-badge"
                            label="Etiqueta comercial"
                            hint="Opcional. Ej.: Recomendado, Más vendido"
                            error={errors.badge}
                        >
                            <Input
                                id="plan-badge"
                                value={form.data.badge}
                                maxLength={40}
                                onChange={(e) =>
                                    form.setData('badge', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="plan-summary"
                            label="Para quién es"
                            hint="Una frase corta."
                            error={errors.summary}
                            className="sm:col-span-2"
                        >
                            <Input
                                id="plan-summary"
                                value={form.data.summary}
                                maxLength={300}
                                onChange={(e) =>
                                    form.setData('summary', e.target.value)
                                }
                                required
                            />
                        </FormField>
                        <FormField
                            id="plan-description"
                            label="Descripción"
                            error={errors.description}
                            className="sm:col-span-2"
                        >
                            <Textarea
                                id="plan-description"
                                rows={3}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="plan-service"
                            label="Servicio principal"
                            error={errors.service_id}
                        >
                            <OptionSelect
                                id="plan-service"
                                value={form.data.service_id}
                                options={services}
                                allLabel="Ninguno"
                                onChange={(v) => form.setData('service_id', v)}
                            />
                        </FormField>
                        <FormField
                            id="plan-time"
                            label="Tiempo estimado de desarrollo"
                            hint="Es una estimación, no una garantía. Ej.: 2 a 3 semanas"
                            error={errors.estimated_time}
                        >
                            <Input
                                id="plan-time"
                                value={form.data.estimated_time}
                                onChange={(e) =>
                                    form.setData(
                                        'estimated_time',
                                        e.target.value,
                                    )
                                }
                            />
                        </FormField>
                    </fieldset>

                    <fieldset className="grid gap-5 sm:grid-cols-3">
                        <legend className="mb-4 text-base font-semibold">
                            Precio
                        </legend>
                        <FormField
                            id="plan-price-type"
                            label="Tipo de precio"
                            error={errors.price_type}
                        >
                            <OptionSelect
                                id="plan-price-type"
                                value={form.data.price_type}
                                options={price_types}
                                onChange={(v) => form.setData('price_type', v)}
                            />
                        </FormField>
                        {form.data.price_type !== 'quote' && (
                            <>
                                <FormField
                                    id="plan-price"
                                    label={
                                        form.data.price_type === 'from'
                                            ? 'Desde'
                                            : 'Precio'
                                    }
                                    error={errors.price}
                                >
                                    <Input
                                        id="plan-price"
                                        inputMode="decimal"
                                        value={form.data.price}
                                        onChange={(e) =>
                                            form.setData(
                                                'price',
                                                e.target.value.replace(
                                                    /[^\d.]/g,
                                                    '',
                                                ),
                                            )
                                        }
                                        placeholder="Sin puntos ni comas"
                                    />
                                </FormField>
                                <FormField
                                    id="plan-currency"
                                    label="Moneda"
                                    error={errors.currency}
                                >
                                    <Input
                                        id="plan-currency"
                                        className="uppercase"
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
                            </>
                        )}
                    </fieldset>

                    <fieldset className="space-y-3">
                        <legend className="text-base font-semibold">
                            Funcionalidades
                        </legend>
                        <p className="-mt-1 text-sm text-muted-foreground">
                            Marca cada una como <strong>incluida</strong> u{' '}
                            <strong>opcional</strong>. Las opcionales pueden
                            indicar si tienen costo adicional.
                        </p>
                        <InputError message={errors.features} />
                        <Input
                            aria-label="Filtrar funcionalidades"
                            placeholder="Filtrar funcionalidades…"
                            value={featureFilter}
                            onChange={(e) => setFeatureFilter(e.target.value)}
                            className="max-w-sm"
                        />
                        <ul className="divide-y rounded-xl border">
                            {visibleFeatures.map((f) => {
                                const kind = kindOf(f.id);

                                return (
                                    <li
                                        key={f.id}
                                        className="grid items-center gap-2 p-2.5 sm:grid-cols-[1fr_auto]"
                                    >
                                        <div className="min-w-0">
                                            <p
                                                className={cn(
                                                    'text-sm',
                                                    !kind &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                {f.name}
                                            </p>
                                            {kind === 'optional' && (
                                                <Input
                                                    aria-label={`Nota de precio para ${f.name}`}
                                                    placeholder="Costo adicional (opcional). Ej.: se cotiza aparte"
                                                    className="mt-1.5 h-8 text-xs"
                                                    maxLength={100}
                                                    value={
                                                        form.data.features.find(
                                                            (x) =>
                                                                x.feature_id ===
                                                                f.id,
                                                        )?.extra_price_note ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setNote(
                                                            f.id,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                        <div
                                            role="radiogroup"
                                            aria-label={f.name}
                                            className="flex rounded-lg border p-0.5 text-xs"
                                        >
                                            {(
                                                [
                                                    [null, 'No', X],
                                                    [
                                                        'included',
                                                        'Incluida',
                                                        Check,
                                                    ],
                                                    [
                                                        'optional',
                                                        'Opcional',
                                                        Plus,
                                                    ],
                                                ] as const
                                            ).map(([value, text, Icon]) => (
                                                <button
                                                    key={text}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={
                                                        kind === value
                                                    }
                                                    onClick={() =>
                                                        setKind(f.id, value)
                                                    }
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
                                                        kind === value
                                                            ? value ===
                                                              'included'
                                                                ? 'bg-success/15 text-success'
                                                                : value ===
                                                                    'optional'
                                                                  ? 'bg-primary/15 text-primary dark:text-[#8da3ff]'
                                                                  : 'bg-muted text-foreground'
                                                            : 'text-muted-foreground hover:text-foreground',
                                                    )}
                                                >
                                                    <Icon className="size-3" />
                                                    {text}
                                                </button>
                                            ))}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </fieldset>

                    <fieldset className="grid gap-5 sm:grid-cols-2">
                        <legend className="mb-4 text-base font-semibold">
                            Condiciones
                        </legend>
                        <FormField
                            id="plan-limits"
                            label="Límites"
                            hint="Ej.: hasta 5 secciones, 2 rondas de cambios"
                            error={errors.limits}
                        >
                            <Textarea
                                id="plan-limits"
                                rows={4}
                                value={form.data.limits}
                                onChange={(e) =>
                                    form.setData('limits', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="plan-exclusions"
                            label="No incluye"
                            hint="Dominio, alojamiento, contenidos, licencias…"
                            error={errors.exclusions}
                        >
                            <Textarea
                                id="plan-exclusions"
                                rows={4}
                                value={form.data.exclusions}
                                onChange={(e) =>
                                    form.setData('exclusions', e.target.value)
                                }
                            />
                        </FormField>
                    </fieldset>

                    <fieldset className="space-y-3">
                        <legend className="text-base font-semibold">
                            Servicios adicionales
                        </legend>
                        <p className="-mt-1 text-sm text-muted-foreground">
                            Mantenimiento, soporte, alojamiento, mejoras… se
                            contratan aparte.
                        </p>
                        {form.data.addons.map((a, i) => (
                            <div
                                key={i}
                                className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                            >
                                <div className="grid gap-1">
                                    <Input
                                        aria-label={`Adicional ${i + 1}`}
                                        placeholder="Ej.: Mantenimiento mensual"
                                        value={a.name}
                                        onChange={(e) =>
                                            form.setData(
                                                'addons',
                                                form.data.addons.map((x, j) =>
                                                    j === i
                                                        ? {
                                                              ...x,
                                                              name: e.target
                                                                  .value,
                                                          }
                                                        : x,
                                                ),
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors[`addons.${i}.name`]}
                                    />
                                </div>
                                <Input
                                    aria-label={`Detalle del adicional ${i + 1}`}
                                    placeholder="Detalle o precio (opcional)"
                                    value={a.note ?? ''}
                                    onChange={(e) =>
                                        form.setData(
                                            'addons',
                                            form.data.addons.map((x, j) =>
                                                j === i
                                                    ? {
                                                          ...x,
                                                          note: e.target.value,
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Quitar adicional ${i + 1}`}
                                    onClick={() =>
                                        form.setData(
                                            'addons',
                                            form.data.addons.filter(
                                                (_, j) => j !== i,
                                            ),
                                        )
                                    }
                                >
                                    <Minus className="size-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                form.setData('addons', [
                                    ...form.data.addons,
                                    { name: '', note: '' },
                                ])
                            }
                        >
                            <Plus className="size-4" />
                            Agregar adicional
                        </Button>
                    </fieldset>

                    <fieldset className="space-y-3">
                        <legend className="text-base font-semibold">
                            Preguntas frecuentes del plan
                        </legend>
                        {form.data.faqs.map((q, i) => (
                            <div
                                key={i}
                                className="space-y-2 rounded-lg border p-3"
                            >
                                <div className="flex gap-2">
                                    <Input
                                        aria-label={`Pregunta ${i + 1}`}
                                        placeholder="Pregunta"
                                        value={q.question}
                                        onChange={(e) =>
                                            form.setData(
                                                'faqs',
                                                form.data.faqs.map((x, j) =>
                                                    j === i
                                                        ? {
                                                              ...x,
                                                              question:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : x,
                                                ),
                                            )
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Quitar pregunta ${i + 1}`}
                                        onClick={() =>
                                            form.setData(
                                                'faqs',
                                                form.data.faqs.filter(
                                                    (_, j) => j !== i,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                                <Textarea
                                    aria-label={`Respuesta ${i + 1}`}
                                    placeholder="Respuesta"
                                    rows={2}
                                    value={q.answer}
                                    onChange={(e) =>
                                        form.setData(
                                            'faqs',
                                            form.data.faqs.map((x, j) =>
                                                j === i
                                                    ? {
                                                          ...x,
                                                          answer: e.target
                                                              .value,
                                                      }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        errors[`faqs.${i}.question`] ??
                                        errors[`faqs.${i}.answer`]
                                    }
                                />
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                form.setData('faqs', [
                                    ...form.data.faqs,
                                    { question: '', answer: '' },
                                ])
                            }
                        >
                            <Plus className="size-4" />
                            Agregar pregunta
                        </Button>
                    </fieldset>
                </div>

                {/* Vista previa y publicación */}
                <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                    <div className="rounded-2xl border bg-card p-5">
                        <p className="mb-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                            Vista previa
                        </p>
                        {form.data.badge && (
                            <span className="mb-2 inline-block rounded bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                                {form.data.badge}
                            </span>
                        )}
                        <h2 className="text-xl font-bold">
                            {form.data.name || 'Nombre del plan'}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {form.data.summary || 'Para quién es este plan'}
                        </p>
                        <p className="mt-4 font-display text-xl font-bold">
                            {planPriceLabel(
                                form.data.price_type,
                                form.data.price,
                                form.data.currency,
                            )}
                        </p>
                        {form.data.estimated_time && (
                            <p className="text-xs text-muted-foreground">
                                Tiempo estimado: {form.data.estimated_time}
                            </p>
                        )}
                        {included.length > 0 && (
                            <>
                                <p className="mt-4 mb-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                    Incluye
                                </p>
                                <ul className="space-y-1 text-sm">
                                    {included.map((f) => (
                                        <li
                                            key={f.feature_id}
                                            className="flex gap-2"
                                        >
                                            <Check className="mt-0.5 size-4 shrink-0 text-success" />
                                            {name(f.feature_id)}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {optional.length > 0 && (
                            <>
                                <p className="mt-4 mb-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                    Opcional
                                </p>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    {optional.map((f) => (
                                        <li
                                            key={f.feature_id}
                                            className="flex gap-2"
                                        >
                                            <Plus className="mt-0.5 size-4 shrink-0" />
                                            <span>
                                                {name(f.feature_id)}
                                                {f.extra_price_note && (
                                                    <span className="text-xs">
                                                        {' '}
                                                        · {f.extra_price_note}
                                                    </span>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    <PublishToggle
                        id="plan-published"
                        checked={form.data.is_published}
                        onChange={(v) => form.setData('is_published', v)}
                        hint="Un plan con precio fijo o «desde» necesita el valor para publicarse."
                    />
                    <InputError
                        message={
                            errors.price && form.data.price_type === 'quote'
                                ? errors.price
                                : undefined
                        }
                    />

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="flex-1"
                        >
                            {form.processing
                                ? 'Guardando…'
                                : plan
                                  ? 'Guardar cambios'
                                  : 'Crear plan'}
                        </Button>
                        {plan && (
                            <ConfirmDialog
                                trigger={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        aria-label="Eliminar plan"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                }
                                title={`Eliminar «${plan.name}»`}
                                description="Se eliminará del catálogo con sus preguntas frecuentes. Las cotizaciones que lo usaron se conservan."
                                confirmLabel="Eliminar"
                                destructive
                                onConfirm={(done) =>
                                    router.delete(destroy(plan.id).url, {
                                        onFinish: done,
                                    })
                                }
                            />
                        )}
                    </div>
                    {form.isDirty && !form.processing && (
                        <p className="text-xs text-muted-foreground">
                            Tienes cambios sin guardar.
                        </p>
                    )}
                </aside>
            </form>
        </>
    );
}
