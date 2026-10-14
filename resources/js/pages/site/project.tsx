import { Head, Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    ArrowUpRight,
    CalendarCheck,
    Check,
    Globe,
    LayoutDashboard,
    Quote,
    Smartphone,
    Users,
    Workflow,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CtaBand } from '@/components/site/cta-band';
import { ProjectCard } from '@/components/site/project-card';
import { SectionHeading } from '@/components/site/section-heading';
import { cn } from '@/lib/utils';
import { projects } from '@/routes/site';
import type { PublicProject, PublicProjectCard, SiteProps } from '@/types';

const PART_ICONS: Record<string, LucideIcon> = {
    web: Globe,
    booking: CalendarCheck,
    admin: LayoutDashboard,
    client_portal: Users,
    app: Smartphone,
    automation: Workflow,
};

type Image = { url: string; caption: string | null };

export default function ProjectPage({
    project,
    related,
    seoTitle,
}: SiteProps & { project: PublicProject; related: PublicProjectCard[] }) {
    // Todas las imágenes en orden (por partes y luego la galería general) para el visor.
    const gallery = useMemo<Image[]>(
        () => [...project.parts.flatMap((p) => p.images), ...project.images],
        [project],
    );
    const [zoom, setZoom] = useState<number | null>(null);
    const openImage = (img: Image) =>
        setZoom(gallery.findIndex((g) => g.url === img.url));

    useEffect(() => {
        if (zoom === null) {
            return;
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setZoom(null);
            } else if (e.key === 'ArrowRight') {
                setZoom((z) => (z === null ? z : (z + 1) % gallery.length));
            } else if (e.key === 'ArrowLeft') {
                setZoom((z) =>
                    z === null ? z : (z - 1 + gallery.length) % gallery.length,
                );
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [zoom, gallery.length]);

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
                    {project.parts.length > 0 && (
                        <ul
                            aria-label="Qué incluye"
                            className="flex flex-wrap gap-2"
                        >
                            {project.parts.map((p) => {
                                const Icon = PART_ICONS[p.type] ?? Check;

                                return (
                                    <li key={p.type}>
                                        <a
                                            href={`#parte-${p.type}`}
                                            className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-brand-cyan"
                                        >
                                            <Icon className="size-4 text-brand-cyan" />
                                            {p.label}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
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
                        className="aspect-[16/9] w-full rounded-3xl border object-cover object-top"
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
                                    Resultados y puntos clave
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

                {/* Cada parte del sistema: web, reservas, panel administrativo… */}
                {project.parts.map((part, index) => {
                    const Icon = PART_ICONS[part.type] ?? Check;

                    return (
                        <section
                            key={part.type}
                            id={`parte-${part.type}`}
                            className="scroll-mt-20 border-t"
                        >
                            <div className="mx-auto max-w-6xl space-y-8 px-5 py-16 md:px-8">
                                <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                                    <div className="space-y-4">
                                        <p className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.16em] text-brand-cyan uppercase">
                                            <Icon className="size-4" />
                                            {String(index + 1).padStart(
                                                2,
                                                '0',
                                            )}{' '}
                                            · {part.label}
                                        </p>
                                        <h2 className="text-3xl font-bold tracking-tight">
                                            {part.title ?? part.label}
                                        </h2>
                                        {part.description && (
                                            <p className="text-lg whitespace-pre-line text-muted-foreground">
                                                {part.description}
                                            </p>
                                        )}
                                    </div>
                                    {part.features.length > 0 && (
                                        <ul className="grid content-start gap-2.5 sm:grid-cols-2">
                                            {part.features.map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex gap-2.5 rounded-xl border bg-card px-4 py-3 text-sm"
                                                >
                                                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                {part.images.length > 0 &&
                                    (part.images.every((img) => img.caption) ? (
                                        <Walkthrough
                                            images={part.images}
                                            title={`${part.label} de ${project.title}`}
                                            onOpen={openImage}
                                        />
                                    ) : (
                                        <Gallery
                                            images={part.images}
                                            title={`${part.label} de ${project.title}`}
                                            onOpen={openImage}
                                        />
                                    ))}
                            </div>
                        </section>
                    );
                })}

                {project.images.length > 0 && (
                    <section className="mx-auto max-w-6xl space-y-6 px-5 pb-16 md:px-8">
                        <h2 className="text-2xl font-bold">Galería</h2>
                        <Gallery
                            images={project.images}
                            title={project.title}
                            onOpen={openImage}
                        />
                    </section>
                )}
            </article>

            {zoom !== null && gallery[zoom] && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Imagen ampliada"
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 p-4"
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
                        src={gallery[zoom].url}
                        alt={gallery[zoom].caption ?? ''}
                        className="max-h-[85vh] max-w-full rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {gallery[zoom].caption && (
                        <p className="text-sm text-white/80">
                            {gallery[zoom].caption}
                        </p>
                    )}
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

/**
 * Recorrido tipo manual: cada imagen es un paso. La descripción «Título: explicación»
 * se muestra con el título destacado.
 */
function Walkthrough({
    images,
    title,
    onOpen,
}: {
    images: Image[];
    title: string;
    onOpen: (img: Image) => void;
}) {
    // Con muchos pasos (por ejemplo, todos los módulos de un panel) se usa una cuadrícula compacta.
    if (images.length > 6) {
        return (
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img, i) => {
                    const caption = img.caption ?? '';
                    const split = caption.indexOf(':');

                    return (
                        <li
                            key={img.url}
                            className="overflow-hidden rounded-2xl border bg-card"
                        >
                            <button
                                type="button"
                                onClick={() => onOpen(img)}
                                className="block w-full overflow-hidden border-b bg-muted/40"
                                aria-label={`Ampliar paso ${i + 1}`}
                            >
                                <img
                                    src={img.url}
                                    alt={caption || `Paso ${i + 1} de ${title}`}
                                    loading="lazy"
                                    className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 motion-safe:hover:scale-[1.03]"
                                />
                            </button>
                            <div className="space-y-1.5 p-4">
                                <p className="flex items-center gap-2 font-semibold">
                                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3b5bff] to-[#22d3ee] font-mono text-[11px] font-bold text-white">
                                        {i + 1}
                                    </span>
                                    {split > 0
                                        ? caption.slice(0, split)
                                        : `Paso ${i + 1}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {split > 0
                                        ? caption.slice(split + 1).trim()
                                        : caption}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        );
    }

    return (
        <ol className="space-y-6">
            {images.map((img, i) => {
                const caption = img.caption ?? '';
                const split = caption.indexOf(':');
                const heading = split > 0 ? caption.slice(0, split) : null;
                const text =
                    split > 0 ? caption.slice(split + 1).trim() : caption;

                return (
                    <li
                        key={img.url}
                        className="grid items-center gap-5 rounded-2xl border bg-card p-4 md:grid-cols-[1.6fr_1fr] md:p-5"
                    >
                        <button
                            type="button"
                            onClick={() => onOpen(img)}
                            className={cn(
                                'block overflow-hidden rounded-xl border bg-muted/40',
                                i % 2 === 1 && 'md:order-2',
                            )}
                            aria-label={`Ampliar paso ${i + 1}`}
                        >
                            <img
                                src={img.url}
                                alt={caption || `Paso ${i + 1} de ${title}`}
                                loading="lazy"
                                className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 motion-safe:hover:scale-[1.02]"
                            />
                        </button>
                        <div className="space-y-2">
                            <span className="inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#3b5bff] to-[#22d3ee] font-mono text-sm font-bold text-white">
                                {i + 1}
                            </span>
                            {heading && (
                                <h3 className="text-xl font-bold">{heading}</h3>
                            )}
                            <p className="text-muted-foreground">{text}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function Gallery({
    images,
    title,
    onOpen,
}: {
    images: Image[];
    title: string;
    onOpen: (img: Image) => void;
}) {
    return (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
                <li key={img.url}>
                    <figure className="space-y-2">
                        <button
                            type="button"
                            onClick={() => onOpen(img)}
                            className="block w-full overflow-hidden rounded-xl border bg-card"
                            aria-label={`Ampliar: ${img.caption ?? `imagen ${i + 1}`}`}
                        >
                            <img
                                src={img.url}
                                alt={
                                    img.caption ?? `Imagen ${i + 1} de ${title}`
                                }
                                loading="lazy"
                                className="aspect-[16/10] w-full bg-muted/40 object-contain transition-transform duration-500 motion-safe:hover:scale-[1.02]"
                            />
                        </button>
                        {img.caption && (
                            <figcaption className="text-sm text-muted-foreground">
                                {img.caption}
                            </figcaption>
                        )}
                    </figure>
                </li>
            ))}
        </ul>
    );
}
