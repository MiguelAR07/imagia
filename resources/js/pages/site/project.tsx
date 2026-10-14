import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Check, Quote, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CtaBand } from '@/components/site/cta-band';
import { ProjectCard } from '@/components/site/project-card';
import { SectionHeading } from '@/components/site/section-heading';
import { projects } from '@/routes/site';
import type { PublicProject, PublicProjectCard, SiteProps } from '@/types';

export default function ProjectPage({
    project,
    related,
    seoTitle,
}: SiteProps & { project: PublicProject; related: PublicProjectCard[] }) {
    const [zoom, setZoom] = useState<number | null>(null);

    useEffect(() => {
        if (zoom === null) {
            return;
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setZoom(null);
            } else if (e.key === 'ArrowRight') {
                setZoom((z) =>
                    z === null ? z : (z + 1) % project.images.length,
                );
            } else if (e.key === 'ArrowLeft') {
                setZoom((z) =>
                    z === null
                        ? z
                        : (z - 1 + project.images.length) %
                          project.images.length,
                );
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [zoom, project.images.length]);

    return (
        <>
            <Head title={seoTitle} />

            <article>
                <header className="mx-auto max-w-6xl space-y-6 px-5 pt-10 md:px-8">
                    <Link
                        href={projects()}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Todos los proyectos
                    </Link>
                    <p className="font-mono text-xs tracking-[0.16em] text-brand-cyan uppercase">
                        {project.category_label}
                        {project.year && ` · ${project.year}`}
                        {project.client && ` · ${project.client}`}
                    </p>
                    <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                        {project.title}
                    </h1>
                    <p className="max-w-3xl text-lg text-muted-foreground md:text-xl">
                        {project.summary}
                    </p>
                    {project.public_url && (
                        <a
                            href={project.public_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:underline"
                        >
                            Ver el proyecto en línea
                            <ArrowUpRight className="size-4" />
                        </a>
                    )}
                </header>

                <div className="mx-auto mt-10 max-w-6xl px-5 md:px-8">
                    <img
                        src={project.cover_url}
                        alt={`Vista principal de ${project.title}`}
                        className="aspect-[16/9] w-full rounded-3xl border object-cover"
                    />
                </div>

                <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-10">
                        {project.problem && (
                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold">El reto</h2>
                                <p className="text-lg whitespace-pre-line text-muted-foreground">
                                    {project.problem}
                                </p>
                            </div>
                        )}
                        {project.solution && (
                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold">
                                    La solución
                                </h2>
                                <p className="text-lg whitespace-pre-line text-muted-foreground">
                                    {project.solution}
                                </p>
                            </div>
                        )}
                        {project.testimonials.map((t) => (
                            <figure
                                key={t.quote}
                                className="relative rounded-2xl border bg-card p-6"
                            >
                                <Quote className="absolute top-5 right-5 size-8 text-brand-blue/30" />
                                <blockquote className="text-lg">
                                    “{t.quote}”
                                </blockquote>
                                <figcaption className="mt-4 text-sm">
                                    <span className="font-semibold">
                                        {t.author_name}
                                    </span>
                                    {t.author_role && (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            · {t.author_role}
                                        </span>
                                    )}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                    <aside className="space-y-6">
                        {project.highlights.length > 0 && (
                            <div className="rounded-2xl border bg-card p-6">
                                <h2 className="mb-4 text-lg font-bold">
                                    Funcionalidades principales
                                </h2>
                                <ul className="space-y-2.5 text-sm">
                                    {project.highlights.map((h) => (
                                        <li key={h} className="flex gap-2.5">
                                            <Check className="mt-0.5 size-4 shrink-0 text-success" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {project.technologies.length > 0 && (
                            <div className="rounded-2xl border bg-card p-6">
                                <h2 className="mb-3 text-lg font-bold">
                                    Tecnologías
                                </h2>
                                <ul className="flex flex-wrap gap-2">
                                    {project.technologies.map((t) => (
                                        <li
                                            key={t}
                                            className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs"
                                        >
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </aside>
                </section>

                {project.images.length > 0 && (
                    <section className="mx-auto max-w-6xl space-y-6 px-5 pb-16 md:px-8">
                        <h2 className="text-2xl font-bold">Galería</h2>
                        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
                            {project.images.map((img, i) => (
                                <li key={img.url}>
                                    <button
                                        type="button"
                                        onClick={() => setZoom(i)}
                                        className="block w-full overflow-hidden rounded-xl border"
                                        aria-label={`Ampliar imagen ${i + 1}`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={
                                                img.caption ??
                                                `Imagen ${i + 1} de ${project.title}`
                                            }
                                            loading="lazy"
                                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </article>

            {zoom !== null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Imagen ampliada"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setZoom(null)}
                >
                    <button
                        type="button"
                        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        aria-label="Cerrar"
                        onClick={() => setZoom(null)}
                    >
                        <X className="size-5" />
                    </button>
                    <img
                        src={project.images[zoom].url}
                        alt={project.images[zoom].caption ?? ''}
                        className="max-h-full max-w-full rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {related.length > 0 && (
                <section className="border-t">
                    <div className="mx-auto max-w-6xl space-y-8 px-5 py-16 md:px-8">
                        <SectionHeading title="Proyectos parecidos" />
                        <div className="grid gap-6 md:grid-cols-3">
                            {related.map((p) => (
                                <ProjectCard key={p.slug} item={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <CtaBand title="¿Quieres algo así para tu negocio?" />
        </>
    );
}
