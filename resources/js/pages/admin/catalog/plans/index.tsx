import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { planPriceLabel } from '@/lib/plan-price';
import { reorder } from '@/lib/reorder';
import {
    create,
    edit,
    index,
    reorder as reorderRoute,
} from '@/routes/admin/catalog/plans';

type PlanRow = {
    id: number;
    name: string;
    summary: string;
    price_type: string;
    price: string | null;
    currency: string;
    estimated_time: string | null;
    badge: string | null;
    is_published: boolean;
    features_count: number;
    service: string | null;
    price_ready: boolean;
};

export default function PlansIndex({ plans }: { plans: PlanRow[] }) {
    const ids = plans.map((p) => p.id);

    return (
        <>
            <Head title="Planes" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    El orden de esta lista es el orden en que aparecen en el
                    sitio.
                </p>
                <Button asChild>
                    <Link href={create()}>
                        <Plus className="size-4" />
                        Nuevo plan
                    </Link>
                </Button>
            </div>

            {plans.length === 0 ? (
                <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                    Aún no hay planes.
                </p>
            ) : (
                <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {plans.map((p, i) => (
                        <li
                            key={p.id}
                            className="relative flex flex-col rounded-2xl border bg-card p-5"
                        >
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-muted-foreground">
                                    Plan {i + 1}
                                </span>
                                <div className="flex">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        disabled={i === 0}
                                        aria-label={`Mover ${p.name} antes`}
                                        onClick={() =>
                                            reorder(
                                                reorderRoute().url,
                                                ids,
                                                i,
                                                -1,
                                            )
                                        }
                                    >
                                        <ArrowUp className="size-3.5 md:-rotate-90" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        disabled={i === plans.length - 1}
                                        aria-label={`Mover ${p.name} después`}
                                        onClick={() =>
                                            reorder(
                                                reorderRoute().url,
                                                ids,
                                                i,
                                                1,
                                            )
                                        }
                                    >
                                        <ArrowDown className="size-3.5 md:-rotate-90" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold">{p.name}</h2>
                                {p.badge && (
                                    <span className="rounded bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                                        {p.badge}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 flex-1 text-sm text-muted-foreground">
                                {p.summary}
                            </p>
                            <p
                                className={
                                    p.price_ready
                                        ? 'mt-4 font-display text-lg font-bold'
                                        : 'mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-warning'
                                }
                            >
                                {!p.price_ready && (
                                    <AlertTriangle className="size-4" />
                                )}
                                {planPriceLabel(
                                    p.price_type,
                                    p.price,
                                    p.currency,
                                )}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {p.features_count} funcionalidades
                                {p.service ? ` · ${p.service}` : ''}
                                {p.estimated_time
                                    ? ` · ${p.estimated_time}`
                                    : ''}
                            </p>
                            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                {p.is_published ? (
                                    <StatusBadge tone="success">
                                        Publicado
                                    </StatusBadge>
                                ) : (
                                    <StatusBadge tone="neutral">
                                        Borrador
                                    </StatusBadge>
                                )}
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={edit(p.id)}>Editar</Link>
                                </Button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </>
    );
}

PlansIndex.layout = {
    breadcrumbs: [{ title: 'Catálogo', href: index() }],
};
