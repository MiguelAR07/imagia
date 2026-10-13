import { Head, Link, router } from '@inertiajs/react';
import { Copy, EyeOff, ImageOff, Lock, Plus, Star } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/hooks/use-filters';
import { formatDate } from '@/lib/format';
import {
    create,
    duplicate,
    edit,
    index,
    restore,
} from '@/routes/admin/portfolio';
import type { Option } from '@/types';

type Item = {
    id: number;
    title: string;
    category: string;
    summary: string;
    status: string;
    is_confidential: boolean;
    is_featured: boolean;
    images_count: number;
    cover_url: string | null;
    completed_on: string | null;
    is_public: boolean;
    archived: boolean;
};

const STATUS_FILTERS: Option[] = [
    { value: 'published', label: 'Visibles en el sitio' },
    { value: 'draft', label: 'Borradores' },
    { value: 'confidential', label: 'Confidenciales' },
    { value: 'archived', label: 'Eliminados' },
];

export default function PortfolioIndex({
    items,
    filters,
    categories,
}: {
    items: Item[];
    filters: { status: string };
    categories: Option[];
}) {
    const { filters: current, set } = useFilters(index().url, filters);
    const category = (v: string) =>
        categories.find((c) => c.value === v)?.label ?? v;

    return (
        <>
            <Head title="Portafolio" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Portafolio"
                    description="Tus trabajos para mostrar en el sitio. Los confidenciales nunca se muestran al público."
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus className="size-4" />
                                Agregar proyecto
                            </Link>
                        </Button>
                    }
                />

                <OptionSelect
                    value={current.status}
                    options={STATUS_FILTERS}
                    allLabel="Todos"
                    onChange={(v) => set('status', v)}
                    className="w-56"
                />

                {items.length === 0 ? (
                    <div className="rounded-xl border bg-card">
                        <EmptyState
                            icon={ImageOff}
                            title="No hay proyectos aquí"
                            description="Agrega los trabajos que quieres mostrar. Primero quedan como borrador."
                        />
                    </div>
                ) : (
                    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border bg-card"
                            >
                                <Link
                                    href={
                                        item.archived ? '#' : edit(item.id).url
                                    }
                                    className="relative block aspect-[16/10] bg-muted"
                                >
                                    {item.cover_url ? (
                                        <img
                                            src={item.cover_url}
                                            alt=""
                                            loading="lazy"
                                            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                        />
                                    ) : (
                                        <span className="flex size-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <ImageOff className="size-6" />
                                            Sin portada
                                        </span>
                                    )}
                                    {item.is_featured && (
                                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                                            <Star className="size-3 fill-current" />
                                            Destacado
                                        </span>
                                    )}
                                </Link>
                                <div className="flex flex-1 flex-col gap-2 p-4">
                                    <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                        {category(item.category)}
                                        {item.completed_on &&
                                            ` · ${formatDate(item.completed_on)}`}
                                    </p>
                                    <h2 className="font-semibold">
                                        {item.title}
                                    </h2>
                                    <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                                        {item.summary}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        {item.archived ? (
                                            <StatusBadge tone="neutral">
                                                Eliminado
                                            </StatusBadge>
                                        ) : item.is_confidential ? (
                                            <StatusBadge tone="warning">
                                                <Lock className="size-3" />
                                                Confidencial
                                            </StatusBadge>
                                        ) : item.is_public ? (
                                            <StatusBadge tone="success">
                                                Visible en el sitio
                                            </StatusBadge>
                                        ) : (
                                            <StatusBadge tone="neutral">
                                                <EyeOff className="size-3" />
                                                Borrador
                                            </StatusBadge>
                                        )}
                                        {item.archived ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.post(
                                                        restore(item.id).url,
                                                    )
                                                }
                                            >
                                                Restaurar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Duplicar ${item.title}`}
                                                title="Duplicar"
                                                onClick={() =>
                                                    router.post(
                                                        duplicate(item.id).url,
                                                    )
                                                }
                                            >
                                                <Copy className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

PortfolioIndex.layout = {
    breadcrumbs: [{ title: 'Portafolio', href: index() }],
};
