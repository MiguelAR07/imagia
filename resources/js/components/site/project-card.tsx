import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { project } from '@/routes/site';
import type { PublicProjectCard } from '@/types';

/** Tarjeta de un proyecto del portafolio. */
export function ProjectCard({ item }: { item: PublicProjectCard }) {
    return (
        <Link
            href={project(item.slug)}
            className="group block overflow-hidden rounded-2xl border bg-card transition-colors hover:border-brand-blue/50"
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                    src={item.cover_url}
                    alt={`Vista del proyecto ${item.title}`}
                    loading="lazy"
                    className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {item.category_label}
                </span>
            </div>
            <div className="space-y-2 p-5">
                <h3 className="flex items-start justify-between gap-3 text-lg font-bold">
                    {item.title}
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                </h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.summary}
                </p>
                {item.parts.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 pt-1">
                        {item.parts.map((part) => (
                            <li
                                key={part}
                                className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-0.5 text-[11px] font-medium text-brand-cyan"
                            >
                                {part}
                            </li>
                        ))}
                    </ul>
                )}
                {item.technologies.length > 0 && (
                    <p className="pt-1 font-mono text-[11px] text-muted-foreground/80">
                        {item.technologies.slice(0, 4).join(' · ')}
                    </p>
                )}
            </div>
        </Link>
    );
}
