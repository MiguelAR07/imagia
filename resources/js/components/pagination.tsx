import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

/** Paginación de listados de Laravel. No se muestra si hay una sola página. */
export function Pagination<T>({ page }: { page: Paginated<T> }) {
    if (page.last_page <= 1) {
        return null;
    }

    const links = page.links.slice(1, -1);
    const prev = page.links[0]?.url;
    const next = page.links[page.links.length - 1]?.url;

    return (
        <nav
            aria-label="Paginación"
            className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
            <p className="text-muted-foreground">
                {page.from}–{page.to} de {page.total}
            </p>
            <div className="flex items-center gap-1">
                <PageLink href={prev} label="Página anterior">
                    <ChevronLeft className="size-4" />
                </PageLink>
                {links.map((link, i) =>
                    link.url ? (
                        <PageLink
                            key={i}
                            href={link.url}
                            active={link.active}
                            label={`Página ${link.label}`}
                        >
                            {link.label}
                        </PageLink>
                    ) : (
                        <span key={i} className="px-2 text-muted-foreground">
                            …
                        </span>
                    ),
                )}
                <PageLink href={next} label="Página siguiente">
                    <ChevronRight className="size-4" />
                </PageLink>
            </div>
        </nav>
    );
}

function PageLink({
    href,
    active = false,
    label,
    children,
}: {
    href: string | null | undefined;
    active?: boolean;
    label: string;
    children: React.ReactNode;
}) {
    const className = cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 tabular-nums',
        active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'hover:bg-accent',
    );

    if (!href) {
        return (
            <span
                aria-hidden="true"
                className={cn(className, 'pointer-events-none opacity-40')}
            >
                {children}
            </span>
        );
    }

    return (
        <Link
            href={href}
            preserveScroll
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={className}
        >
            {children}
        </Link>
    );
}
