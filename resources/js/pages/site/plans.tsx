import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CtaBand } from '@/components/site/cta-band';
import { Explainers } from '@/components/site/explainers';
import { FaqList } from '@/components/site/faq-list';
import { PLAN_LINES, PlanCard } from '@/components/site/plan-card';
import { SectionHeading } from '@/components/site/section-heading';
import { cn } from '@/lib/utils';
import { budget } from '@/routes/site';
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

    // Líneas que tienen planes, en el orden de los servicios publicados.
    const lines = useMemo(
        () =>
            site.services.filter((s) =>
                plans.some((p) => p.service?.slug === s.slug),
            ),
        [plans, site.services],
    );

    const visible = useMemo(() => {
        const order = (p: PublicPlan) => {
            const i = lines.findIndex((l) => l.slug === p.service?.slug);

            return i === -1 ? lines.length : i;
        };

        return [...plans]
            .filter((p) => tab === 'all' || p.service?.slug === tab)
            .sort((a, b) => order(a) - order(b));
    }, [plans, lines, tab]);

    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 md:px-8">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <SectionHeading
                        as="h1"
                        eyebrow="Planes"
                        title="Elige cómo empezar"
                        description="Precios de referencia. Cada proyecto se confirma con una cotización escrita."
                    />
                    <Link
                        href={budget()}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        ¿Tienes un presupuesto? Calcula qué puedes hacer
                        <ArrowRight className="size-4" />
                    </Link>
                </div>

                {plans.length === 0 ? (
                    <p className="mt-12 rounded-2xl border bg-card p-8 text-muted-foreground">
                        Estamos preparando nuestros planes. Solicita una
                        cotización y te enviamos una propuesta personalizada.
                    </p>
                ) : (
                    <>
                        {lines.length > 1 && (
                            <div
                                role="tablist"
                                aria-label="Líneas de servicio"
                                className="mt-12 flex gap-6 overflow-x-auto border-b"
                            >
                                {[{ slug: 'all', name: 'Todos' }, ...lines].map(
                                    (l) => (
                                        <button
                                            key={l.slug}
                                            type="button"
                                            role="tab"
                                            aria-selected={tab === l.slug}
                                            onClick={() => setTab(l.slug)}
                                            className={cn(
                                                '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm transition-colors',
                                                tab === l.slug
                                                    ? 'border-foreground font-medium text-foreground'
                                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {PLAN_LINES[l.slug] && (
                                                <span
                                                    className={cn(
                                                        'size-1.5 rounded-full',
                                                        PLAN_LINES[l.slug].dot,
                                                    )}
                                                />
                                            )}
                                            {l.name}
                                        </button>
                                    ),
                                )}
                            </div>
                        )}

                        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {visible.map((p) => (
                                <PlanCard key={p.slug} plan={p} />
                            ))}
                        </div>
                    </>
                )}
            </section>

            <div className="border-t">
                <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
                    <Explainers />
                </div>
            </div>

            {faqs.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-3xl space-y-8 px-5 py-20 md:px-8">
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
