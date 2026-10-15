import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Calculator } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { budget } from '@/routes/site';
import { CtaBand } from '@/components/site/cta-band';
import { Explainers } from '@/components/site/explainers';
import { FaqList } from '@/components/site/faq-list';
import { PLAN_LINES, PlanCard } from '@/components/site/plan-card';
import { SectionHeading } from '@/components/site/section-heading';
import type { PublicPlan, SiteProps } from '@/types';

export default function Plans({
    plans,
    faqs,
    seoTitle,
    site,
}: SiteProps & {
    plans: PublicPlan[];
    faqs: { question: string; answer: string }[];
}) {
    const [tab, setTab] = useState('all');

    // Planes agrupados por línea, en el orden de los servicios publicados.
    const groups = useMemo(() => {
        const map = new Map<
            string,
            { slug: string; name: string; plans: PublicPlan[] }
        >();

        for (const s of site.services) {
            map.set(s.slug, { slug: s.slug, name: s.name, plans: [] });
        }

        for (const p of plans) {
            const key = p.service?.slug ?? 'otros';

            if (!map.has(key)) {
                map.set(key, {
                    slug: key,
                    name: p.service?.name ?? 'Otros planes',
                    plans: [],
                });
            }

            map.get(key)!.plans.push(p);
        }

        return [...map.values()].filter((g) => g.plans.length > 0);
    }, [plans, site.services]);

    const visibleGroups =
        tab === 'all' ? groups : groups.filter((g) => g.slug === tab);

    const withDetails = plans.filter(
        (p) =>
            p.limits ||
            p.exclusions ||
            p.addons.length > 0 ||
            p.faqs.length > 0,
    );

    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto max-w-6xl space-y-12 px-5 pt-12 pb-10 md:px-8">
                <SectionHeading
                    as="h1"
                    eyebrow="Planes"
                    title="Elige cómo empezar"
                    description="Los valores son de referencia: cada proyecto se confirma con una cotización escrita. Si lo que necesitas no encaja en un plan, lo cotizamos a la medida."
                />
                <Link
                    href={budget()}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-cyan/40 bg-brand-cyan/5 p-4 text-sm transition-colors hover:border-brand-cyan"
                >
                    <Calculator className="size-5 text-brand-cyan" />
                    <span className="flex-1">
                        <strong>¿Tienes un presupuesto definido?</strong> Dinos
                        cuánto quieres invertir y te mostramos qué podemos
                        construir con eso.
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-cyan">
                        Calcular
                        <ArrowRight className="size-4" />
                    </span>
                </Link>
                {plans.length === 0 ? (
                    <p className="rounded-2xl border bg-card p-8 text-muted-foreground">
                        Estamos preparando nuestros planes. Solicita una
                        cotización y te enviamos una propuesta personalizada.
                    </p>
                ) : (
                    <div className="space-y-10">
                        {groups.length > 1 && (
                            <div
                                role="tablist"
                                aria-label="Líneas de servicio"
                                className="flex gap-2 overflow-x-auto pb-1"
                            >
                                {[
                                    { slug: 'all', name: 'Todos' },
                                    ...groups,
                                ].map((g) => {
                                    const line = PLAN_LINES[g.slug];
                                    const Icon = line?.icon;

                                    return (
                                        <button
                                            key={g.slug}
                                            type="button"
                                            role="tab"
                                            aria-selected={tab === g.slug}
                                            onClick={() => setTab(g.slug)}
                                            className={cn(
                                                'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                                                tab === g.slug
                                                    ? 'border-transparent bg-foreground text-background'
                                                    : 'text-muted-foreground hover:border-brand-cyan hover:text-foreground',
                                            )}
                                        >
                                            {Icon && (
                                                <Icon className="size-4" />
                                            )}
                                            {g.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {visibleGroups.map((g) => {
                            const line = PLAN_LINES[g.slug];
                            const Icon = line?.icon;

                            return (
                                <div key={g.slug} className="space-y-5">
                                    {(groups.length > 1 || tab !== 'all') && (
                                        <div className="flex items-center gap-3">
                                            {Icon && (
                                                <span
                                                    className={cn(
                                                        'flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                                                        line.gradient,
                                                    )}
                                                >
                                                    <Icon className="size-4" />
                                                </span>
                                            )}
                                            <h2 className="text-xl font-bold">
                                                {g.name}
                                            </h2>
                                            <span className="h-px flex-1 bg-border" />
                                            <span className="text-xs text-muted-foreground">
                                                {g.plans.length}{' '}
                                                {g.plans.length === 1
                                                    ? 'plan'
                                                    : 'planes'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                        {g.plans.map((p) => (
                                            <PlanCard key={p.slug} plan={p} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
                <Explainers />
            </div>

            {withDetails.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-6xl space-y-10 px-5 py-16 md:px-8">
                        <SectionHeading
                            eyebrow="Detalles"
                            title="Lo que conviene saber de cada plan"
                        />
                        <div className="grid gap-6 lg:grid-cols-2">
                            {withDetails.map((p) => (
                                <div
                                    key={p.slug}
                                    className="space-y-4 rounded-2xl border bg-card p-6"
                                >
                                    <h3 className="text-xl font-bold">
                                        {p.name}
                                    </h3>
                                    {p.limits && (
                                        <Detail
                                            title="Límites"
                                            text={p.limits}
                                        />
                                    )}
                                    {p.exclusions && (
                                        <Detail
                                            title="No incluye"
                                            text={p.exclusions}
                                        />
                                    )}
                                    {p.addons.length > 0 && (
                                        <div>
                                            <p className="mb-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                                Servicios adicionales
                                            </p>
                                            <ul className="space-y-1 text-sm">
                                                {p.addons.map((a) => (
                                                    <li key={a.name}>
                                                        {a.name}
                                                        {a.note && (
                                                            <span className="text-muted-foreground">
                                                                {' '}
                                                                · {a.note}
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {p.faqs.length > 0 && (
                                        <FaqList faqs={p.faqs} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {faqs.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-3xl space-y-8 px-5 py-16 md:px-8">
                        <SectionHeading
                            eyebrow="Preguntas frecuentes"
                            title="Dudas comunes"
                            align="center"
                        />
                        <FaqList faqs={faqs} />
                    </div>
                </section>
            )}

            <CtaBand />
        </>
    );
}

function Detail({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <p className="mb-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                {title}
            </p>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
                {text}
            </p>
        </div>
    );
}
