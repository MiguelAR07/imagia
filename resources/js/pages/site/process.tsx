import { Head } from '@inertiajs/react';
import { CtaBand } from '@/components/site/cta-band';
import { FaqList } from '@/components/site/faq-list';
import { ProcessSteps } from '@/components/site/process-steps';
import { SectionHeading } from '@/components/site/section-heading';
import type { ProcessStep, SiteProps } from '@/types';

export default function Process({
    process,
    faqs,
    seoTitle,
}: SiteProps & {
    process: ProcessStep[];
    faqs: { question: string; answer: string }[];
}) {
    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto max-w-6xl space-y-12 px-5 pt-12 pb-16 md:px-8">
                <SectionHeading
                    as="h1"
                    eyebrow="Cómo trabajamos"
                    title="De tu idea a algo que funciona"
                    description="Sabes en todo momento en qué etapa va tu proyecto, qué sigue y qué necesitamos de ti."
                />
                <ProcessSteps steps={process} />
            </section>
            {faqs.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-3xl space-y-8 px-5 py-16 md:px-8">
                        <SectionHeading
                            eyebrow="Preguntas frecuentes"
                            title="Lo que suelen preguntarnos"
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
