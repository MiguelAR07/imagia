import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    FileText,
    MessageCircle,
    Rocket,
    Sparkles,
} from 'lucide-react';
import { CtaBand } from '@/components/site/cta-band';
import { HeroVisual } from '@/components/site/hero-visual';
import { ProjectCard } from '@/components/site/project-card';
import { SectionHeading } from '@/components/site/section-heading';
import { WhatWeBuild } from '@/components/site/what-we-build';
import { openAssistant } from '@/lib/assistant';
import {
    plans as plansRoute,
    process as processRoute,
    projects as projectsRoute,
    quote,
} from '@/routes/site';
import type {
    PublicPlan,
    PublicProjectCard,
    PublicService,
    SiteProps,
} from '@/types';

type Props = SiteProps & {
    services: PublicService[];
    projects: PublicProjectCard[];
    plans: PublicPlan[];
};

export default function Home({ services, projects, plans, seoTitle }: Props) {
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
                            Hacemos{' '}
                            <b className="text-foreground">páginas web</b>,{' '}
                            <b className="text-foreground">landing pages</b> y{' '}
                            <b className="text-foreground">software</b> para tu
                            negocio. Tú nos cuentas la idea; nosotros la hacemos
                            realidad.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#soluciones"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3b5bff] to-[#2f57f0] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,91,255,.4)] transition-transform hover:-translate-y-0.5"
                            >
                                Ver qué hacemos
                                <ArrowRight className="size-4" />
                            </a>
                            <Link
                                href={quote()}
                                className="rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-cyan hover:bg-accent"
                            >
                                Pedir propuesta gratis
                            </Link>
                        </div>
                        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                            {TRUST.map((t) => (
                                <li
                                    key={t}
                                    className="flex items-center gap-1.5"
                                >
                                    <Check className="size-4 text-success" />
                                    {t}
                                </li>
                            ))}
                        </ul>
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

            {/* Qué hacemos: cada cosa con su dibujo, su nombre en español y una frase */}
            {services.length > 0 && (
                <section id="soluciones" className="scroll-mt-20 border-t">
                    <div className="mx-auto max-w-6xl space-y-10 px-5 py-20 md:px-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <SectionHeading
                                eyebrow="Qué hacemos"
                                title="¿Qué necesita tu negocio?"
                                description="Así se ve cada cosa y qué significa."
                            />
                            <Link
                                href={plansRoute()}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:underline"
                            >
                                Ver todos los planes
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <WhatWeBuild services={services} plans={plans} />
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

            {/* Qué significa IMAGIA, en una sola línea */}
            <section className="border-t">
                <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
                    <p className="mb-5 text-center font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                        Qué significa {brand.name}
                    </p>
                    <ol className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                        {brand.acronym.map((item, i) => (
                            <li
                                key={`${item.letter}-${i}`}
                                className="flex items-baseline gap-0.5"
                            >
                                <span
                                    className={`font-display text-3xl leading-none font-black ${i >= brand.acronym.length - 2 ? 'text-brand-gradient' : ''}`}
                                >
                                    {item.letter}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {item.word.slice(1)}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Cómo trabajamos: 3 pasos */}
            <section className="border-t">
                <div className="mx-auto max-w-6xl space-y-10 px-5 py-20 md:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <SectionHeading
                            eyebrow="Cómo trabajamos"
                            title="Así de fácil empezamos"
                        />
                        <Link
                            href={processRoute()}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:underline"
                        >
                            Ver el proceso completo
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    <ol className="grid gap-5 md:grid-cols-3">
                        {STEPS.map((step, i) => (
                            <li
                                key={step.title}
                                className="flex gap-4 rounded-2xl border bg-card p-6"
                            >
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b5bff] to-[#22d3ee] text-white">
                                    <step.icon className="size-5" />
                                </span>
                                <div>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        Paso {i + 1}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {step.title}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {step.text}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <CtaBand />
        </>
    );
}

/** Lo que más pregunta un cliente antes de escribir, respondido de un vistazo. */
const TRUST = [
    'Propuesta sin costo',
    'Pagas 50 % al iniciar',
    'Cuotas con tarjeta, PSE o Nequi',
];

const STEPS = [
    {
        icon: MessageCircle,
        title: 'Nos cuentas tu idea',
        text: 'Por WhatsApp o con el formulario.',
    },
    {
        icon: FileText,
        title: 'Te enviamos la propuesta',
        text: 'Gratis: qué haremos, cuánto cuesta y en cuánto tiempo.',
    },
    {
        icon: Rocket,
        title: 'Empezamos',
        text: 'Pagas el 50 % al iniciar y el otro 50 % al entregar.',
    },
];

/** Divide el lema en dos líneas por el primer punto: «Tú lo imaginas.» / «Nosotros hacemos la magia.» */
function splitTagline(tagline: string): [string, string | null] {
    const i = tagline.indexOf('. ');

    return i > 0
        ? [tagline.slice(0, i + 1), tagline.slice(i + 2)]
        : [tagline, null];
}
