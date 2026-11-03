import { Head } from '@inertiajs/react';
import { CtaBand } from '@/components/site/cta-band';
import { Explainers } from '@/components/site/explainers';
import { SectionHeading } from '@/components/site/section-heading';
import { WhatWeBuild } from '@/components/site/what-we-build';
import type { PublicPlan, PublicService, SiteProps } from '@/types';

export default function Services({
    services,
    plans,
    seoTitle,
}: SiteProps & { services: PublicService[]; plans: PublicPlan[] }) {
    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto max-w-6xl space-y-12 px-5 pt-12 pb-10 md:px-8">
                <SectionHeading
                    as="h1"
                    eyebrow="Qué hacemos"
                    title="¿Qué necesita tu negocio?"
                    description="Así se ve cada cosa y qué significa."
                />

                {services.length === 0 ? (
                    <p className="rounded-2xl border bg-card p-8 text-muted-foreground">
                        Estamos actualizando nuestros servicios. Mientras tanto,
                        cuéntanos qué necesitas.
                    </p>
                ) : (
                    <WhatWeBuild services={services} plans={plans} />
                )}
            </section>
            <div className="border-t">
                <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
                    <Explainers />
                </div>
            </div>
            <CtaBand />
        </>
    );
}
