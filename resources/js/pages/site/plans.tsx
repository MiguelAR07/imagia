import { Head } from '@inertiajs/react';
import { CtaBand } from '@/components/site/cta-band';
import { FaqList } from '@/components/site/faq-list';
import { PlanCard } from '@/components/site/plan-card';
import { SectionHeading } from '@/components/site/section-heading';
import type { PublicPlan, SiteProps } from '@/types';

export default function Plans({
    plans,
    faqs,
    seoTitle,
}: SiteProps & {
    plans: PublicPlan[];
    faqs: { question: string; answer: string }[];
}) {
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
                {plans.length === 0 ? (
                    <p className="rounded-2xl border bg-card p-8 text-muted-foreground">
                        Estamos preparando nuestros planes. Solicita una
                        cotización y te enviamos una propuesta personalizada.
                    </p>
                ) : (
                    <div className="grid gap-6 pt-3 md:grid-cols-2 xl:grid-cols-4">
                        {plans.map((p) => (
                            <PlanCard key={p.slug} plan={p} />
                        ))}
                    </div>
                )}
            </section>

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
