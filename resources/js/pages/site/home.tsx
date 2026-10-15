import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { CtaBand } from '@/components/site/cta-band';
import { HeroVisual } from '@/components/site/hero-visual';
import { PlanCard } from '@/components/site/plan-card';
import { ProcessSteps } from '@/components/site/process-steps';
import { ProjectCard } from '@/components/site/project-card';
import { SectionHeading } from '@/components/site/section-heading';
import { openAssistant } from '@/lib/assistant';
import { serviceIcon } from '@/lib/service-icons';
import {
    plans as plansRoute,
    process as processRoute,
    projects as projectsRoute,
    quote,
    service,
} from '@/routes/site';
import type {
    ProcessStep,
    PublicPlan,
    PublicProjectCard,
    PublicService,
    SiteProps,
} from '@/types';

type Props = SiteProps & {
    services: PublicService[];
    projects: PublicProjectCard[];
    plans: PublicPlan[];
    process: ProcessStep[];
};

export default function Home({
    services,
    projects,
    plans,
    process,
    seoTitle,
}: Props) {
    const { brand, site } = usePage<Props>().props;
    const [taglineA, taglineB] = splitTagline(brand.tagline);

    return (
        <>
            <Head title={seoTitle} />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(141,163,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(141,163,255,.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_60%_40%,#000_20%,transparent_70%)] bg-[size:48px_48px]"
                />
                <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-20 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16 lg:pb-28">
                    <div className="space-y-7">
                        <p className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase backdrop-blur">
                            <span className="size-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_var(--brand-cyan)]" />
                            {brand.descriptor}
                        </p>
                        <h1 className="text-5xl leading-[0.95] font-black tracking-tight md:text-7xl">
                            {taglineA}
                            {taglineB && (
                                <>
                                    <br />
                                    <span className="text-brand-gradient">
                                        {taglineB}
                                    </span>
                                </>
                            )}
                        </h1>
                        <p className="max-w-lg text-lg text-muted-foreground">
                            Desarrollamos páginas web, sistemas de gestión y
                            automatizaciones a la medida de lo que tu negocio
                            necesita de verdad.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#soluciones"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3b5bff] to-[#2f57f0] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,91,255,.4)] transition-transform hover:-translate-y-0.5"
                            >
                                Explorar soluciones
                                <ArrowRight className="size-4" />
                            </a>
                            <Link
                                href={quote()}
                                className="rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-cyan hover:bg-accent"
                            >
                                Solicitar cotización
                            </Link>
                        </div>
                        {site.assistant && (
                            <button
                                type="button"
                                onClick={openAssistant}
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                            >
                                <Sparkles className="size-4 text-brand-cyan" />
                                ¿No sabes qué necesitas? Responde unas preguntas
                                y te orientamos
                            </button>
                        )}
                    </div>
                    <HeroVisual />
                </div>
            </section>

            {/* Servicios */}
            {services.length > 0 && (
                <section id="soluciones" className="scroll-mt-20 border-t">
                    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1fr_2fr]">
                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <SectionHeading
                                eyebrow="Soluciones"
                                title="Lo que podemos construir para ti"
                                description="Cada proyecto empieza por entender tu negocio. Estas son las soluciones que más desarrollamos."
                            />
                        </div>
                        <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
                            {services.map((s) => {
                                const Icon = serviceIcon(s.icon);

                                return (
                                    <li key={s.slug} className="bg-card">
                                        <Link
                                            href={service(s.slug)}
                                            className="group flex h-full flex-col gap-4 p-6 transition-colors hover:bg-accent/40"
                                        >
                                            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b5bff]/20 to-[#22d3ee]/20 ring-1 ring-brand-blue/30">
                                                <Icon className="size-5 text-brand-cyan" />
                                            </span>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold">
                                                    {s.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {s.summary}
                                                </p>
                                            </div>
                                            {s.benefits.length > 0 && (
                                                <ul className="space-y-1.5 text-sm">
                                                    {s.benefits
                                                        .slice(0, 3)
                                                        .map((b) => (
                                                            <li
                                                                key={b}
                                                                className="flex gap-2"
                                                            >
                                                                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                                                                {b}
                                                            </li>
                                                        ))}
                                                </ul>
                                            )}
                                            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-brand-cyan">
                                                Ver más
                                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </section>
            )}

            {/* Proyectos */}
            {projects.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-6xl space-y-10 px-5 py-20 md:px-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <SectionHeading
                                eyebrow="Proyectos"
                                title="Trabajos que ya están funcionando"
                            />
                            <Link
                                href={projectsRoute()}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:underline"
                            >
                                Ver todos los proyectos
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map((p) => (
                                <ProjectCard key={p.slug} item={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Por qué IMAGIA */}
            <section className="border-t">
                <div className="mx-auto max-w-6xl space-y-10 px-5 py-20 md:px-8">
                    <SectionHeading
                        eyebrow={`Por qué ${brand.name}`}
                        title="Cada letra es algo que hacemos por tu negocio"
                    />
                    <ol className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
                        {brand.acronym.map((item, i) => (
                            <li
                                key={`${item.letter}-${i}`}
                                className="flex gap-4 bg-card p-6"
                            >
                                <span
                                    className={`font-display text-5xl leading-none font-black ${i >= brand.acronym.length - 2 ? 'text-brand-gradient' : ''}`}
                                >
                                    {item.letter}
                                </span>
                                <div className="space-y-1">
                                    <p className="font-semibold">{item.word}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Cómo trabajamos */}
            <section className="border-t">
                <div className="mx-auto max-w-6xl space-y-10 px-5 py-20 md:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <SectionHeading
                            eyebrow="Cómo trabajamos"
                            title="Un proceso claro, de la idea a la entrega"
                        />
                        <Link
                            href={processRoute()}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:underline"
                        >
                            Conocer el proceso
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    <ProcessSteps steps={process} />
                </div>
            </section>

            {/* Planes */}
            {plans.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-6xl space-y-10 px-5 py-20 md:px-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <SectionHeading
                                eyebrow="Planes"
                                title="Empieza con la opción que encaja"
                                description="Los proyectos más complejos se cotizan a la medida."
                            />
                            <Link
                                href={plansRoute()}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:underline"
                            >
                                Comparar planes
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 pt-3 md:grid-cols-2 xl:grid-cols-4">
                            {/* Un plan de entrada por línea; el resto en «Comparar planes». */}
                            {plans
                                .filter(
                                    (p, i, all) =>
                                        all.findIndex(
                                            (o) =>
                                                (o.service?.slug ?? o.slug) ===
                                                (p.service?.slug ?? p.slug),
                                        ) === i,
                                )
                                .slice(0, 4)
                                .map((p) => (
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

/** Divide el lema en dos líneas por el primer punto: «Tú lo imaginas.» / «Nosotros hacemos la magia.» */
function splitTagline(tagline: string): [string, string | null] {
    const i = tagline.indexOf('. ');

    return i > 0
        ? [tagline.slice(0, i + 1), tagline.slice(i + 2)]
        : [tagline, null];
}
