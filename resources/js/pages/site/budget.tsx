import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calculator,
    Check,
    Globe,
    LayoutDashboard,
    Plus,
    Rocket,
    Sparkles,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { budget as budgetRoute, quote } from '@/routes/site';
import type { Option, SiteProps } from '@/types';

type PlanInfo = {
    slug: string;
    name: string;
    summary: string;
    price: number;
    estimated_time: string | null;
    included: string[];
};

type Result = {
    goal: string;
    budget: number;
    fits: boolean;
    plan: PlanInfo | null;
    modules: {
        id: number;
        name: string;
        description: string | null;
        price: number;
    }[];
    total: number;
    remaining: number;
    shortfall: { plan: PlanInfo; missing: number } | null;
    next: { name: string; kind: 'module' | 'plan'; extra: number } | null;
    alternatives: { goal: string; label: string; plan: PlanInfo }[];
};

type Props = SiteProps & {
    goals: Option[];
    input: { budget: number | null; goal: string | null };
    limits: { min: number; max: number };
    result: Result | null;
    summary: string | null;
};

const ICONS: Record<string, LucideIcon> = {
    landing: Rocket,
    website: Globe,
    management: LayoutDashboard,
    automation: Workflow,
};

const QUICK = [1000000, 3000000, 5000000, 10000000];

const digits = (v: string) => v.replace(/\D/g, '');
const pretty = (v: string) =>
    v ? Number(v).toLocaleString('es-CO', { maximumFractionDigits: 0 }) : '';

/**
 * «Tengo tanto, ¿qué podemos hacer?»: el visitante indica su presupuesto y el tipo de
 * proyecto, y ve el plan y los módulos que le alcanzan con los precios publicados.
 */
export default function BudgetPage({
    goals,
    input,
    limits,
    result,
    summary,
    seoTitle,
}: Props) {
    const [goal, setGoal] = useState(input.goal ?? '');
    const [amount, setAmount] = useState(
        input.budget ? String(input.budget) : '',
    );
    const [error, setError] = useState<string | null>(null);
    const money = (v: number) => formatMoney(v, 'COP');

    const calculate = (g = goal, a = amount) => {
        if (!g) {
            setError('Elige qué te gustaría construir.');

            return;
        }

        if (!a || Number(a) < limits.min) {
            setError(`El presupuesto mínimo es ${money(limits.min)}.`);

            return;
        }

        setError(null);
        router.get(
            budgetRoute({ query: { objetivo: g, presupuesto: a } }).url,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        calculate();
    };

    const quoteUrl =
        result && summary
            ? quote({
                  query: {
                      plan: result.plan?.slug ?? result.shortfall?.plan.slug,
                      objetivo: result.goal,
                      presupuesto: String(result.budget),
                      detalle: summary,
                  },
              }).url
            : quote().url;

    return (
        <>
            <Head title={seoTitle} />

            <section className="mx-auto max-w-5xl px-5 pt-12 pb-10 md:px-8">
                <p className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.16em] text-brand-cyan uppercase">
                    <Calculator className="size-4" />
                    Calculadora de proyecto
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
                    Dinos cuánto quieres invertir,{' '}
                    <span className="text-brand-gradient">
                        te decimos qué podemos construir
                    </span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                    Con los precios de nuestros planes y módulos armamos una
                    propuesta a la medida de tu presupuesto.
                </p>

                <form
                    onSubmit={submit}
                    className="mt-10 space-y-8 rounded-3xl border bg-card p-6 md:p-8"
                >
                    <fieldset>
                        <legend className="mb-3 font-semibold">
                            1. ¿Qué te gustaría construir?
                        </legend>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {goals.map((g) => {
                                const Icon = ICONS[g.value] ?? Sparkles;
                                const active = goal === g.value;

                                return (
                                    <button
                                        key={g.value}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setGoal(g.value)}
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-colors',
                                            active
                                                ? 'border-brand-blue bg-brand-blue/10'
                                                : 'hover:border-brand-cyan/60',
                                        )}
                                    >
                                        <Icon className="size-5 shrink-0 text-brand-cyan" />
                                        {g.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="mb-3 font-semibold">
                            2. ¿Cuánto quieres invertir?
                        </legend>
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="relative min-w-60 flex-1">
                                <span className="sr-only">
                                    Presupuesto en pesos
                                </span>
                                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                                    $
                                </span>
                                <input
                                    inputMode="numeric"
                                    value={pretty(amount)}
                                    onChange={(e) =>
                                        setAmount(
                                            digits(e.target.value).slice(0, 9),
                                        )
                                    }
                                    placeholder="3.000.000"
                                    className="h-14 w-full rounded-xl border bg-background pr-16 pl-8 font-display text-2xl font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">
                                    COP
                                </span>
                            </label>
                            <button
                                type="submit"
                                className="inline-flex h-14 items-center gap-2 rounded-xl bg-gradient-to-r from-[#3b5bff] to-[#22d3ee] px-6 font-semibold text-white shadow-[0_10px_30px_rgba(59,91,255,.4)] transition-transform motion-safe:hover:-translate-y-0.5"
                            >
                                Ver qué puedo hacer
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {QUICK.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => {
                                        setAmount(String(q));
                                        if (goal) {
                                            calculate(goal, String(q));
                                        }
                                    }}
                                    className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-brand-cyan hover:text-foreground"
                                >
                                    {money(q)}
                                </button>
                            ))}
                        </div>
                        {error && (
                            <p
                                role="alert"
                                className="mt-3 text-sm text-destructive"
                            >
                                {error}
                            </p>
                        )}
                    </fieldset>
                </form>
            </section>

            {result && (
                <section
                    aria-live="polite"
                    className="mx-auto max-w-5xl px-5 pb-20 md:px-8"
                >
                    {result.fits && result.plan ? (
                        <div className="overflow-hidden rounded-3xl border border-brand-blue/40 bg-[linear-gradient(180deg,rgba(59,91,255,.10),transparent_40%)]">
                            <div className="grid gap-8 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                                            Con {money(result.budget)} podemos
                                            hacer
                                        </p>
                                        <h2 className="mt-1 text-3xl font-black">
                                            {result.plan.name}
                                        </h2>
                                        <p className="mt-1 text-muted-foreground">
                                            {result.plan.summary}
                                        </p>
                                    </div>

                                    {result.plan.included.length > 0 && (
                                        <ul className="grid gap-2 text-sm sm:grid-cols-2">
                                            {result.plan.included.map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex gap-2"
                                                >
                                                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {result.modules.length > 0 && (
                                        <div>
                                            <p className="mb-3 font-semibold">
                                                Y te alcanza para agregar:
                                            </p>
                                            <ul className="space-y-2">
                                                {result.modules.map((m) => (
                                                    <li
                                                        key={m.id}
                                                        className="flex items-start gap-3 rounded-xl border bg-card p-3 text-sm"
                                                    >
                                                        <Plus className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium">
                                                                {m.name}
                                                            </p>
                                                            {m.description && (
                                                                <p className="text-muted-foreground">
                                                                    {
                                                                        m.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="shrink-0 font-mono tabular-nums">
                                                            {money(m.price)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <aside className="space-y-4 rounded-2xl border bg-card p-5 md:self-start">
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-muted-foreground">
                                                {result.plan.name}
                                            </dt>
                                            <dd className="font-mono tabular-nums">
                                                {money(result.plan.price)}
                                            </dd>
                                        </div>
                                        {result.modules.length > 0 && (
                                            <div className="flex justify-between gap-3">
                                                <dt className="text-muted-foreground">
                                                    {result.modules.length}{' '}
                                                    {result.modules.length === 1
                                                        ? 'módulo'
                                                        : 'módulos'}
                                                </dt>
                                                <dd className="font-mono tabular-nums">
                                                    {money(
                                                        result.total -
                                                            result.plan.price,
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between gap-3 border-t pt-2 text-base font-bold">
                                            <dt>Total estimado</dt>
                                            <dd className="font-mono tabular-nums">
                                                {money(result.total)}
                                            </dd>
                                        </div>
                                        {result.remaining > 0 && (
                                            <div className="flex justify-between gap-3 text-success">
                                                <dt>Te sobran</dt>
                                                <dd className="font-mono tabular-nums">
                                                    {money(result.remaining)}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                    {result.plan.estimated_time && (
                                        <p className="text-xs text-muted-foreground">
                                            Tiempo estimado:{' '}
                                            {result.plan.estimated_time}
                                        </p>
                                    )}
                                    {result.next && result.next.extra > 0 && (
                                        <p className="rounded-xl bg-brand-cyan/10 p-3 text-sm">
                                            💡 Con{' '}
                                            <strong>
                                                {money(result.next.extra)}
                                            </strong>{' '}
                                            más{' '}
                                            {result.next.kind === 'plan'
                                                ? 'podrías tener el plan'
                                                : 'podrías agregar'}{' '}
                                            <strong>{result.next.name}</strong>.
                                        </p>
                                    )}
                                    <Link
                                        href={quoteUrl}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3b5bff] to-[#22d3ee] px-5 py-3 font-semibold text-white"
                                    >
                                        Quiero esta propuesta
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                        Es un valor de referencia: el alcance y
                                        el precio final se confirman en una
                                        cotización escrita, sin compromiso.
                                    </p>
                                </aside>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 rounded-3xl border bg-card p-6 md:p-8">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Todavía no alcanza para esta opción
                                </h2>
                                {result.shortfall && (
                                    <p className="mt-2 text-muted-foreground">
                                        El plan{' '}
                                        <strong className="text-foreground">
                                            {result.shortfall.plan.name}
                                        </strong>{' '}
                                        empieza en{' '}
                                        {money(result.shortfall.plan.price)}: te
                                        faltarían{' '}
                                        <strong className="text-foreground">
                                            {money(result.shortfall.missing)}
                                        </strong>
                                        . Puedes pagarlo en dos partes (50 % al
                                        iniciar y 50 % al entregar).
                                    </p>
                                )}
                            </div>
                            {result.alternatives.length > 0 && (
                                <div>
                                    <p className="mb-3 font-semibold">
                                        Con {money(result.budget)} sí puedes
                                        empezar con:
                                    </p>
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                        {result.alternatives.map((a) => (
                                            <li key={a.goal}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setGoal(a.goal);
                                                        calculate(
                                                            a.goal,
                                                            String(
                                                                result.budget,
                                                            ),
                                                        );
                                                    }}
                                                    className="w-full rounded-xl border p-4 text-left transition-colors hover:border-brand-cyan"
                                                >
                                                    <p className="text-sm text-muted-foreground">
                                                        {a.label}
                                                    </p>
                                                    <p className="font-semibold">
                                                        {a.plan.name} ·{' '}
                                                        {money(a.plan.price)}
                                                    </p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <Link
                                href={quoteUrl}
                                className="inline-flex items-center gap-2 font-semibold text-brand-cyan hover:underline"
                            >
                                Cuéntanos tu caso y buscamos la mejor opción
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    )}
                </section>
            )}
        </>
    );
}
