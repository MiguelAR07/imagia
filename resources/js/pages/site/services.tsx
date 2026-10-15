import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { CtaBand } from '@/components/site/cta-band';
import { Explainers } from '@/components/site/explainers';
import { SectionHeading } from '@/components/site/section-heading';
import { serviceIcon } from '@/lib/service-icons';
import { service } from '@/routes/site';
import type { PublicService, SiteProps } from '@/types';

export default function Services({
    services,
    seoTitle,
}: SiteProps & { services: PublicService[] }) {
    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto max-w-6xl space-y-12 px-5 pt-12 pb-10 md:px-8">
                <SectionHeading
                    as="h1"
                    eyebrow="Servicios"
                    title="Soluciones digitales a la medida"
                    description="Desde una página para empezar a recibir clientes hasta sistemas que automatizan tu operación."
                />

                {services.length === 0 ? (
                    <p className="rounded-2xl border bg-card p-8 text-muted-foreground">
                        Estamos actualizando nuestros servicios. Mientras tanto,
                        cuéntanos qué necesitas.
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {services.map((s, i) => {
                            const Icon = serviceIcon(s.icon);

                            return (
                                <li key={s.slug}>
                                    <Link
                                        href={service(s.slug)}
                                        className="group grid items-center gap-6 rounded-2xl border bg-card p-6 transition-colors hover:border-brand-blue/50 md:grid-cols-[auto_1fr_auto] md:p-8"
                                    >
                                        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b5bff] to-[#22d3ee] text-white shadow-[0_10px_30px_rgba(59,91,255,.35)]">
                                            <Icon className="size-6" />
                                        </span>
                                        <div className="space-y-1.5">
                                            <p className="font-mono text-[11px] text-muted-foreground">
                                                {String(i + 1).padStart(2, '0')}
                                            </p>
                                            <h2 className="text-2xl font-bold">
                                                {s.name}
                                            </h2>
                                            <p className="text-muted-foreground">
                                                {s.summary}
                                            </p>
                                        </div>
                                        <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
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
