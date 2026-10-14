import { Head, Link } from '@inertiajs/react';
import { CtaBand } from '@/components/site/cta-band';
import { ProjectCard } from '@/components/site/project-card';
import { SectionHeading } from '@/components/site/section-heading';
import { cn } from '@/lib/utils';
import { projects as projectsRoute } from '@/routes/site';
import type { Option, PublicProjectCard, SiteProps } from '@/types';

type Props = SiteProps & {
    projects: PublicProjectCard[];
    categories: Option[];
    category: string;
};

export default function Projects({
    projects,
    categories,
    category,
    seoTitle,
}: Props) {
    const filterUrl = (value: string) =>
        value
            ? `${projectsRoute().url}?categoria=${value}`
            : projectsRoute().url;

    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto max-w-6xl space-y-10 px-5 pt-12 pb-10 md:px-8">
                <SectionHeading
                    as="h1"
                    eyebrow="Portafolio"
                    title="Proyectos que ya están funcionando"
                    description="Una muestra de lo que hemos construido para otros negocios."
                />

                {categories.length > 1 && (
                    <nav
                        aria-label="Filtrar por categoría"
                        className="flex flex-wrap gap-2"
                    >
                        {[{ value: '', label: 'Todos' }, ...categories].map(
                            (c) => (
                                <Link
                                    key={c.value || 'all'}
                                    href={filterUrl(c.value)}
                                    preserveScroll
                                    aria-current={
                                        category === c.value
                                            ? 'page'
                                            : undefined
                                    }
                                    className={cn(
                                        'rounded-full border px-4 py-1.5 text-sm transition-colors',
                                        category === c.value
                                            ? 'border-brand-blue bg-brand-blue/15 text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {c.label}
                                </Link>
                            ),
                        )}
                    </nav>
                )}

                {projects.length === 0 ? (
                    <p className="rounded-2xl border bg-card p-8 text-muted-foreground">
                        {category
                            ? 'No hay proyectos publicados en esta categoría.'
                            : 'Muy pronto publicaremos aquí nuestros proyectos.'}
                    </p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((p) => (
                            <ProjectCard key={p.slug} item={p} />
                        ))}
                    </div>
                )}
            </section>
            <CtaBand title="¿Quieres un proyecto como estos?" />
        </>
    );
}
