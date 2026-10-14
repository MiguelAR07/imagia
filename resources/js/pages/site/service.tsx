import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, Layers } from 'lucide-react';
import { CtaBand } from '@/components/site/cta-band';
import { PlanCard } from '@/components/site/plan-card';
import { SectionHeading } from '@/components/site/section-heading';
import { serviceIcon } from '@/lib/service-icons';
import { quote, services } from '@/routes/site';
import type { PublicPlan, PublicService, SiteProps } from '@/types';

export default function ServicePage({
    service,
    plans,
    seoTitle,
}: SiteProps & { service: PublicService; plans: PublicPlan[] }) {
    const Icon = serviceIcon(service.icon);

    return (
        <>
            <Head title={seoTitle} />

            <section className="relative overflow-hidden border-b">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-40 right-0 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(59,91,255,.3),transparent_65%)] blur-2xl"
                />
                <div className="relative mx-auto max-w-6xl space-y-8 px-5 pt-10 pb-16 md:px-8">
                    <Link
                        href={services()}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Todos los servicios
                    </Link>
                    <div className="flex flex-wrap items-start gap-6">
                        <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b5bff] to-[#22d3ee] text-white shadow-[0_10px_30px_rgba(59,91,255,.35)]">
                            <Icon className="size-7" />
                        </span>
                        <div className="max-w-3xl flex-1 space-y-4">
                            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                                {service.name}
                            </h1>
                            <p className="text-lg text-muted-foreground md:text-xl">
                                {service.summary}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={`${quote().url}?servicio=${service.slug}`}
                        className="inline-block rounded-xl bg-gradient-to-r from-[#3b5bff] to-[#2f57f0] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,91,255,.4)]"
                    >
                        Cotizar {service.name.toLowerCase()}
                    </Link>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-2">
                <div className="space-y-6">
                    {service.description && (
                        <p className="text-lg whitespace-pre-line">
                            {service.description}
                        </p>
                    )}
                    {service.benefits.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">
                                Lo que gana tu negocio
                            </h2>
                            <ul className="space-y-3">
                                {service.benefits.map((b) => (
                                    <li key={b} className="flex gap-3">
                                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15">
                                            <Check className="size-3.5 text-success" />
                                        </span>
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                {service.features.length > 0 && (
                    <div className="rounded-2xl border bg-card p-6">
                        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                            <Layers className="size-5 text-brand-cyan" />
                            Funcionalidades que podemos incluir
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Cada proyecto elige las que necesita: no todas
                            vienen en todos los planes.
                        </p>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {service.features.map((f) => (
                                <li
                                    key={f}
                                    className="rounded-lg bg-muted/60 px-3 py-2 text-sm"
                                >
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {plans.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-6xl space-y-10 px-5 py-16 md:px-8">
                        <SectionHeading
                            eyebrow="Planes"
                            title={`Planes de ${service.name.toLowerCase()}`}
                        />
                        <div className="grid gap-6 pt-3 md:grid-cols-2 xl:grid-cols-3">
                            {plans.map((p) => (
                                <PlanCard key={p.slug} plan={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <CtaBand />
        </>
    );
}
