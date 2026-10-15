import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    Check,
    Clock,
    Globe,
    LayoutDashboard,
    Plus,
    Rocket,
    Sparkles,
    Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { quote } from '@/routes/site';
import type { PublicPlan } from '@/types';

/** Ícono y color de cada línea del catálogo. */
export const PLAN_LINES: Record<
    string,
    { icon: LucideIcon; gradient: string; glow: string; short: string }
> = {
    'landing-pages': {
        icon: Rocket,
        gradient: 'from-[#3b5bff] to-[#22d3ee]',
        glow: 'rgba(34,211,238,.35)',
        short: 'Landing',
    },
    'paginas-web': {
        icon: Globe,
        gradient: 'from-[#7c5cff] to-[#3b5bff]',
        glow: 'rgba(124,92,255,.35)',
        short: 'Página web',
    },
    'software-de-gestion': {
        icon: LayoutDashboard,
        gradient: 'from-[#22d3ee] to-[#10b981]',
        glow: 'rgba(16,185,129,.3)',
        short: 'Gestión',
    },
    'automatizacion-empresarial': {
        icon: Workflow,
        gradient: 'from-[#c084fc] to-[#6366f1]',
        glow: 'rgba(192,132,252,.3)',
        short: 'Automatización',
    },
};

const FALLBACK_LINE = {
    icon: Sparkles,
    gradient: 'from-[#3b5bff] to-[#22d3ee]',
    glow: 'rgba(59,91,255,.35)',
    short: 'Plan',
};

const VISIBLE_FEATURES = 5;

/**
 * Tarjeta de un plan publicado. El precio se muestra tal como se configuró en el panel:
 * «desde», fijo o «según cotización».
 */
export function PlanCard({
    plan,
    highlighted = false,
}: {
    plan: PublicPlan;
    highlighted?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const featured = highlighted || !!plan.badge;
    const line =
        (plan.service && PLAN_LINES[plan.service.slug]) || FALLBACK_LINE;
    const Icon = line.icon;
    const features = expanded
        ? plan.included
        : plan.included.slice(0, VISIBLE_FEATURES);
    const hidden = plan.included.length - VISIBLE_FEATURES;
    const hasPrice = plan.price_type !== 'quote' && plan.price !== null;

    return (
        <article
            className={cn(
                'group relative flex h-full flex-col rounded-3xl p-px transition-transform duration-300 motion-safe:hover:-translate-y-1',
                featured
                    ? `bg-gradient-to-b ${line.gradient}`
                    : 'bg-border hover:bg-gradient-to-b hover:from-brand-blue/60 hover:to-border',
            )}
            style={
                featured
                    ? { boxShadow: `0 25px 70px -30px ${line.glow}` }
                    : undefined
            }
        >
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-card">
                {/* Brillo del color de la línea */}
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-gradient-to-br opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-35',
                        line.gradient,
                    )}
                />

                <div className="relative flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                        <span
                            className={cn(
                                'flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                                line.gradient,
                            )}
                        >
                            <Icon className="size-5" />
                        </span>
                        {plan.badge ? (
                            <span
                                className={cn(
                                    'rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase',
                                    line.gradient,
                                )}
                            >
                                ★ {plan.badge}
                            </span>
                        ) : (
                            <span className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">
                                {line.short}
                            </span>
                        )}
                    </div>

                    <h3 className="mt-5 text-2xl leading-tight font-black tracking-tight">
                        {plan.name}
                    </h3>
                    <p className="mt-2 min-h-[3.75rem] text-sm text-muted-foreground">
                        {plan.summary}
                    </p>

                    {/* Precio */}
                    <div className="mt-5 rounded-2xl border bg-background/40 p-4">
                        {hasPrice ? (
                            <>
                                {plan.price_type === 'from' && (
                                    <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                        Desde
                                    </p>
                                )}
                                <p className="font-display text-3xl font-black tabular-nums">
                                    {formatMoney(plan.price, plan.currency)}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                    Precio
                                </p>
                                <p className="font-display text-2xl font-black">
                                    Según cotización
                                </p>
                            </>
                        )}
                        {plan.estimated_time && (
                            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                <Clock className="size-3.5" />
                                {plan.estimated_time}
                            </p>
                        )}
                    </div>

                    {/* Lo que incluye */}
                    {plan.included.length > 0 && (
                        <div className="mt-6">
                            <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Incluye
                            </p>
                            <ul className="space-y-2.5 text-sm">
                                {features.map((f) => (
                                    <li key={f} className="flex gap-2.5">
                                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success/15">
                                            <Check className="size-3 text-success" />
                                        </span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            {hidden > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setExpanded((v) => !v)}
                                    aria-expanded={expanded}
                                    className="mt-3 text-xs font-semibold text-brand-cyan hover:underline"
                                >
                                    {expanded
                                        ? 'Ver menos'
                                        : `+${hidden} ${hidden === 1 ? 'funcionalidad más' : 'funcionalidades más'}`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Extras */}
                    {plan.optional.length > 0 && (
                        <div className="mt-5">
                            <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Puedes agregar
                            </p>
                            <ul className="flex flex-wrap gap-1.5">
                                {plan.optional.map((f) => (
                                    <li
                                        key={f.name}
                                        title={f.note ?? undefined}
                                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                                    >
                                        <Plus className="size-3" />
                                        {f.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-auto pt-7">
                        <Link
                            href={`${quote().url}?plan=${plan.slug}`}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                                featured
                                    ? `bg-gradient-to-r text-white shadow-lg motion-safe:hover:brightness-110 ${line.gradient}`
                                    : 'border hover:border-brand-cyan hover:bg-accent',
                            )}
                        >
                            {hasPrice ? 'Quiero este plan' : 'Pedir cotización'}
                            <ArrowRight className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
