import { Link } from '@inertiajs/react';
import { ArrowRight, Check, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { quote } from '@/routes/site';
import type { PublicPlan } from '@/types';

/** Color de acento de cada línea del catálogo (un solo punto, nada más). */
export const PLAN_LINES: Record<string, { dot: string; label: string }> = {
    'landing-pages': { dot: 'bg-[#22d3ee]', label: 'Landing' },
    'paginas-web': { dot: 'bg-[#7c5cff]', label: 'Página web' },
    'software-de-gestion': { dot: 'bg-[#10b981]', label: 'Gestión' },
    'automatizacion-empresarial': {
        dot: 'bg-[#c084fc]',
        label: 'Automatización',
    },
};

const KEY_FEATURES = 3;

/** «Entrega en 3 a 4 semanas», o el texto tal cual si no es un plazo («Según el alcance»). */
const deliveryLabel = (time: string) =>
    /^\d/.test(time) ? `Entrega en ${time}` : time;

function priceParts(plan: PublicPlan) {
    if (plan.price_type === 'quote' || plan.price === null) {
        return { prefix: null, amount: 'A la medida' };
    }

    return {
        prefix: plan.price_type === 'from' ? 'Desde' : null,
        amount: formatMoney(plan.price, plan.currency),
    };
}

/**
 * Tarjeta de un plan, limpia: lo esencial a la vista y el resto en «Ver detalles».
 * El precio se muestra tal como se configuró en el panel.
 */
export function PlanCard({
    plan,
    highlighted = false,
}: {
    plan: PublicPlan;
    highlighted?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const featured = highlighted || !!plan.badge;
    const line = plan.service ? PLAN_LINES[plan.service.slug] : undefined;
    const price = priceParts(plan);
    const quoteUrl = `${quote().url}?plan=${plan.slug}`;

    return (
        <>
            <article
                className={cn(
                    'relative flex h-full flex-col rounded-2xl border bg-card p-7 transition-colors hover:border-foreground/25',
                    featured && 'border-foreground/20',
                )}
            >
                {featured && (
                    <span
                        aria-hidden="true"
                        className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent"
                    />
                )}

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                        {line && (
                            <span
                                className={cn(
                                    'size-1.5 rounded-full',
                                    line.dot,
                                )}
                            />
                        )}
                        {line?.label ?? 'Plan'}
                    </span>
                    {plan.badge && (
                        <span className="font-medium text-foreground">
                            {plan.badge}
                        </span>
                    )}
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight">
                    {plan.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {plan.summary}
                </p>

                <div className="mt-7">
                    {price.prefix && (
                        <span className="text-xs text-muted-foreground">
                            {price.prefix}{' '}
                        </span>
                    )}
                    <p className="font-display text-3xl font-bold tracking-tight tabular-nums">
                        {price.amount}
                    </p>
                    {plan.estimated_time && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {deliveryLabel(plan.estimated_time)}
                        </p>
                    )}
                </div>

                {plan.included.length > 0 && (
                    <ul className="mt-7 space-y-3 border-t pt-6 text-sm">
                        {plan.included.slice(0, KEY_FEATURES).map((f) => (
                            <li key={f} className="flex gap-3">
                                <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                {f}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-8">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Ver detalles
                    </button>
                    <Link
                        href={quoteUrl}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                            featured
                                ? 'bg-foreground text-background hover:bg-foreground/85'
                                : 'border hover:bg-accent',
                        )}
                    >
                        {plan.price_type === 'quote' ? 'Cotizar' : 'Elegir'}
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>
            </article>

            <PlanDetails
                plan={plan}
                open={open}
                onOpenChange={setOpen}
                quoteUrl={quoteUrl}
            />
        </>
    );
}

/** Todo lo del plan: qué incluye, extras, límites y lo que no incluye. */
function PlanDetails({
    plan,
    open,
    onOpenChange,
    quoteUrl,
}: {
    plan: PublicPlan;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteUrl: string;
}) {
    const price = priceParts(plan);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{plan.name}</DialogTitle>
                    <DialogDescription>{plan.summary}</DialogDescription>
                </DialogHeader>

                <p className="text-sm">
                    {price.prefix && (
                        <span className="text-muted-foreground">
                            {price.prefix}{' '}
                        </span>
                    )}
                    <span className="font-display text-2xl font-bold tabular-nums">
                        {price.amount}
                    </span>
                    {plan.estimated_time && (
                        <span className="text-muted-foreground">
                            {' '}
                            · {deliveryLabel(plan.estimated_time).toLowerCase()}
                        </span>
                    )}
                </p>

                {plan.included.length > 0 && (
                    <DetailList title="Incluye">
                        {plan.included.map((f) => (
                            <li key={f} className="flex gap-3">
                                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                                {f}
                            </li>
                        ))}
                    </DetailList>
                )}

                {(plan.optional.length > 0 || plan.addons.length > 0) && (
                    <DetailList title="Puedes agregar">
                        {[...plan.optional, ...plan.addons].map((f) => (
                            <li key={f.name} className="flex gap-3">
                                <Plus className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                <span>
                                    {f.name}
                                    {f.note && (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            · {f.note}
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </DetailList>
                )}

                {plan.limits && (
                    <DetailText title="Alcance">{plan.limits}</DetailText>
                )}
                {plan.exclusions && (
                    <DetailText title="No incluye">
                        <span className="flex gap-3">
                            <Minus className="mt-0.5 size-4 shrink-0" />
                            {plan.exclusions}
                        </span>
                    </DetailText>
                )}

                {plan.faqs.length > 0 && (
                    <DetailList title="Preguntas frecuentes">
                        {plan.faqs.map((f) => (
                            <li key={f.question}>
                                <p className="font-medium">{f.question}</p>
                                <p className="text-muted-foreground">
                                    {f.answer}
                                </p>
                            </li>
                        ))}
                    </DetailList>
                )}

                <Link
                    href={quoteUrl}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/85"
                >
                    {plan.price_type === 'quote'
                        ? 'Pedir cotización'
                        : 'Quiero este plan'}
                    <ArrowRight className="size-4" />
                </Link>
                <p className="text-center text-xs text-muted-foreground">
                    Valor de referencia: se confirma en una cotización escrita.
                </p>
            </DialogContent>
        </Dialog>
    );
}

function DetailList({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {title}
            </p>
            <ul className="space-y-2.5 text-sm">{children}</ul>
        </div>
    );
}

function DetailText({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {title}
            </p>
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    );
}
