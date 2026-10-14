import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { ContactFields } from '@/components/site/contact-fields';
import type { ContactData } from '@/components/site/contact-fields';
import { SectionHeading } from '@/components/site/section-heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { store } from '@/routes/site/quote';
import type { Option, SiteProps } from '@/types';

type Props = SiteProps & {
    plans: Option[];
    services: Option[];
    needs: Option[];
    budgets: string[];
    timeframes: string[];
    selectedPlan: string | null;
    selectedService: string | null;
};

const STEPS = ['Qué necesitas', 'Tu proyecto', 'Tus datos'];

/** Qué campos pertenecen a cada paso (para volver al paso con error). */
const STEP_FIELDS: string[][] = [
    ['need', 'service', 'plan'],
    ['business', 'description', 'budget', 'timeframe'],
    ['name', 'company', 'email', 'phone', 'consent', 'form'],
];

export default function QuotePage({
    plans,
    services,
    needs,
    budgets,
    timeframes,
    selectedPlan,
    selectedService,
    seoTitle,
}: Props) {
    const [step, setStep] = useState(0);
    const form = useForm({
        need: selectedPlan || selectedService ? 'website' : '',
        service: selectedService ?? '',
        plan: selectedPlan ?? '',
        business: '',
        description: '',
        budget: '',
        timeframe: '',
        name: '',
        company: '',
        email: '',
        phone: '',
        wants_meeting: false,
        consent: false,
        website: '',
    });
    const errors = form.errors as Record<string, string | undefined>;

    const canNext =
        step === 0
            ? form.data.need !== ''
            : step === 1
              ? form.data.business.trim() !== '' &&
                form.data.description.trim().length >= 10
              : true;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (step < 2) {
            if (canNext) {
                setStep(step + 1);
            }

            return;
        }

        form.post(store().url, {
            preserveScroll: true,
            onError: (errs) => {
                const first = STEP_FIELDS.findIndex((fields) =>
                    fields.some((f) => f in errs),
                );
                setStep(first >= 0 ? first : 2);
            },
        });
    };

    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto max-w-3xl space-y-10 px-5 pt-12 pb-20 md:px-8">
                <SectionHeading
                    as="h1"
                    eyebrow="Cotización"
                    title="Cuéntanos tu idea"
                    description="Te tomará unos 2 minutos. Con esto preparamos una propuesta personalizada, sin compromiso."
                />

                <ol className="grid grid-cols-3 gap-2" aria-label="Pasos">
                    {STEPS.map((label, i) => (
                        <li
                            key={label}
                            aria-current={i === step ? 'step' : undefined}
                            className="space-y-2"
                        >
                            <div
                                className={cn(
                                    'h-1 rounded-full transition-colors',
                                    i <= step
                                        ? 'bg-gradient-to-r from-[#3b5bff] to-[#22d3ee]'
                                        : 'bg-muted',
                                )}
                            />
                            <p
                                className={cn(
                                    'text-xs',
                                    i === step
                                        ? 'font-semibold text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {i + 1}. {label}
                            </p>
                        </li>
                    ))}
                </ol>

                <form
                    onSubmit={submit}
                    className="relative space-y-8 rounded-2xl border bg-card p-6 md:p-8"
                >
                    {step === 0 && (
                        <fieldset className="space-y-6">
                            <legend className="text-xl font-bold">
                                ¿Qué te gustaría conseguir?
                            </legend>
                            <div
                                role="radiogroup"
                                aria-label="Objetivo"
                                className="grid gap-3 sm:grid-cols-2"
                            >
                                {needs.map((n) => (
                                    <button
                                        key={n.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={
                                            form.data.need === n.value
                                        }
                                        onClick={() =>
                                            form.setData('need', n.value)
                                        }
                                        className={cn(
                                            'flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors',
                                            form.data.need === n.value
                                                ? 'border-brand-blue bg-brand-blue/10'
                                                : 'hover:border-brand-blue/50',
                                        )}
                                    >
                                        {n.label}
                                        {form.data.need === n.value && (
                                            <Check className="size-4 text-brand-cyan" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <InputError message={errors.need} />
                            {(services.length > 0 || plans.length > 0) && (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {services.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="q-service">
                                                Servicio de interés (opcional)
                                            </Label>
                                            <OptionSelect
                                                id="q-service"
                                                value={form.data.service}
                                                options={services}
                                                allLabel="No estoy seguro"
                                                onChange={(v) =>
                                                    form.setData('service', v)
                                                }
                                            />
                                        </div>
                                    )}
                                    {plans.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="q-plan">
                                                Plan (opcional)
                                            </Label>
                                            <OptionSelect
                                                id="q-plan"
                                                value={form.data.plan}
                                                options={plans}
                                                allLabel="Aún no lo sé"
                                                onChange={(v) =>
                                                    form.setData('plan', v)
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </fieldset>
                    )}

                    {step === 1 && (
                        <fieldset className="space-y-5">
                            <legend className="text-xl font-bold">
                                Háblanos de tu proyecto
                            </legend>
                            <div className="grid gap-2">
                                <Label htmlFor="q-business">
                                    ¿A qué se dedica tu negocio?
                                </Label>
                                <Input
                                    id="q-business"
                                    placeholder="Ej.: spa con 4 terapeutas"
                                    value={form.data.business}
                                    onChange={(e) =>
                                        form.setData('business', e.target.value)
                                    }
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.business} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="q-description">
                                    ¿Qué te gustaría resolver o mejorar?
                                </Label>
                                <Textarea
                                    id="q-description"
                                    rows={5}
                                    placeholder="Ej.: hoy agendamos citas por WhatsApp y se nos cruzan los horarios…"
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="q-budget">
                                        Presupuesto aproximado (opcional)
                                    </Label>
                                    <OptionSelect
                                        id="q-budget"
                                        value={form.data.budget}
                                        options={budgets.map((b) => ({
                                            value: b,
                                            label: b,
                                        }))}
                                        allLabel="Prefiero no decirlo"
                                        onChange={(v) =>
                                            form.setData('budget', v)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="q-timeframe">
                                        ¿Para cuándo lo necesitas?
                                    </Label>
                                    <OptionSelect
                                        id="q-timeframe"
                                        value={form.data.timeframe}
                                        options={timeframes.map((t) => ({
                                            value: t,
                                            label: t,
                                        }))}
                                        allLabel="Sin definir"
                                        onChange={(v) =>
                                            form.setData('timeframe', v)
                                        }
                                    />
                                </div>
                            </div>
                        </fieldset>
                    )}

                    {step === 2 && (
                        <fieldset className="space-y-5">
                            <legend className="text-xl font-bold">
                                ¿Cómo te contactamos?
                            </legend>
                            <ContactFields
                                data={form.data as unknown as ContactData}
                                errors={errors}
                                set={(k, v) => form.setData(k, v as never)}
                            />
                            {errors.form && (
                                <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                                    {errors.form}
                                </p>
                            )}
                        </fieldset>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t pt-6">
                        {step > 0 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(step - 1)}
                            >
                                <ArrowLeft className="size-4" />
                                Atrás
                            </Button>
                        ) : (
                            <span />
                        )}
                        <Button
                            type="submit"
                            disabled={!canNext || form.processing}
                            className="bg-gradient-to-r from-[#3b5bff] to-[#2f57f0]"
                        >
                            {step < 2 ? (
                                <>
                                    Continuar
                                    <ArrowRight className="size-4" />
                                </>
                            ) : form.processing ? (
                                'Enviando…'
                            ) : (
                                'Enviar solicitud'
                            )}
                        </Button>
                    </div>
                </form>
            </section>
        </>
    );
}
