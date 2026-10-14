import { Link } from '@inertiajs/react';
import { Check, Plus } from 'lucide-react';
import { planPriceLabel } from '@/lib/plan-price';
import { cn } from '@/lib/utils';
import { quote } from '@/routes/site';
import type { PublicPlan } from '@/types';

/** Tarjeta de un plan publicado. Muestra el precio tal como se configuró en el panel. */
export function PlanCard({
    plan,
    highlighted = false,
}: {
    plan: PublicPlan;
    highlighted?: boolean;
}) {
    const featured = highlighted || !!plan.badge;

    return (
        <article
            className={cn(
                'relative flex flex-col rounded-2xl border p-6',
                featured
                    ? 'border-brand-blue/60 bg-[linear-gradient(180deg,rgba(59,91,255,.14),transparent_45%)] shadow-[0_20px_60px_-25px_rgba(59,91,255,.6)]'
                    : 'bg-card',
            )}
        >
            {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-[#3b5bff] to-[#22d3ee] px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                </span>
            )}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
            <p className="mt-5 font-display text-2xl font-extrabold">
                {planPriceLabel(plan.price_type, plan.price, plan.currency)}
            </p>
            {plan.estimated_time && (
                <p className="mt-1 text-xs text-muted-foreground">
                    Tiempo estimado: {plan.estimated_time}
                </p>
            )}

            {plan.included.length > 0 && (
                <ul className="mt-6 space-y-2 text-sm">
                    {plan.included.map((f) => (
                        <li key={f} className="flex gap-2.5">
                            <Check className="mt-0.5 size-4 shrink-0 text-success" />
                            {f}
                        </li>
                    ))}
                </ul>
            )}
            {plan.optional.length > 0 && (
                <>
                    <p className="mt-5 mb-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                        Opcional
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {plan.optional.map((f) => (
                            <li key={f.name} className="flex gap-2.5">
                                <Plus className="mt-0.5 size-4 shrink-0" />
                                <span>
                                    {f.name}
                                    {f.note && (
                                        <span className="text-xs">
                                            {' '}
                                            · {f.note}
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <div className="mt-auto pt-7">
                <Link
                    href={`${quote().url}?plan=${plan.slug}`}
                    className={cn(
                        'block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors',
                        featured
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'border hover:border-brand-blue hover:bg-accent',
                    )}
                >
                    {plan.price_type === 'quote'
                        ? 'Pedir cotización'
                        : 'Quiero este plan'}
                </Link>
            </div>
        </article>
    );
}
