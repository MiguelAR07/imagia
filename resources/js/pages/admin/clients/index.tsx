import { Head, Link } from '@inertiajs/react';
import { Building2, Plus, Search, User, Users } from 'lucide-react';
import { useState } from 'react';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { EmptyState } from '@/components/empty-state';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCan } from '@/hooks/use-can';
import { useFilters } from '@/hooks/use-filters';
import { index, show } from '@/routes/admin/clients';
import type { ClientListItem, Option, Paginated } from '@/types';

type Props = {
    clients: Paginated<ClientListItem>;
    filters: { q: string; status: string };
    options: { types: Option[]; statuses: Option[] };
};

const STATUS_FILTERS: Option[] = [
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'archived', label: 'Archivados' },
];

export default function ClientsIndex({ clients, filters, options }: Props) {
    const can = useCan();
    const [creating, setCreating] = useState(false);
    const { filters: current, set } = useFilters(index().url, filters);
    const hasFilters = current.q !== '' || current.status !== '';

    return (
        <>
            <Head title="Clientes" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Clientes"
                    description="Empresas y personas con las que trabajas."
                    actions={
                        can('clientes.gestionar') && (
                            <Button onClick={() => setCreating(true)}>
                                <Plus className="size-4" />
                                Nuevo cliente
                            </Button>
                        )
                    }
                />

                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-60 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Buscar clientes"
                            placeholder="Buscar por nombre, correo, teléfono o NIT"
                            className="pl-9"
                            value={current.q}
                            onChange={(e) => set('q', e.target.value, true)}
                        />
                    </div>
                    <OptionSelect
                        value={current.status}
                        options={STATUS_FILTERS}
                        allLabel="Todos los estados"
                        onChange={(v) => set('status', v)}
                        className="w-48"
                    />
                </div>

                <div className="overflow-x-auto rounded-xl border bg-card">
                    {clients.data.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title={
                                hasFilters
                                    ? 'Ningún cliente coincide con la búsqueda'
                                    : 'Aún no tienes clientes'
                            }
                            description={
                                hasFilters
                                    ? 'Prueba con otras palabras o quita los filtros.'
                                    : 'Registra tu primer cliente para asociarle proyectos y cotizaciones.'
                            }
                            action={
                                !hasFilters &&
                                can('clientes.gestionar') && (
                                    <Button
                                        size="sm"
                                        onClick={() => setCreating(true)}
                                    >
                                        <Plus className="size-4" />
                                        Nuevo cliente
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <table className="w-full min-w-[720px] text-sm">
                            <thead>
                                <tr className="border-b text-left font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                    <th className="px-4 py-3 font-medium">
                                        Cliente
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Contacto
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Ciudad
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.data.map((c) => {
                                    const Icon =
                                        c.type === 'company' ? Building2 : User;

                                    return (
                                        <tr
                                            key={c.id}
                                            className="border-b transition-colors last:border-0 hover:bg-accent/40"
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={show(c.id)}
                                                    className="flex items-center gap-3 font-medium hover:underline"
                                                >
                                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                        <Icon className="size-4 text-muted-foreground" />
                                                    </span>
                                                    {c.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <div>{c.email ?? '—'}</div>
                                                {c.phone && (
                                                    <div>{c.phone}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {c.city ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {c.archived ? (
                                                    <StatusBadge tone="neutral">
                                                        Archivado
                                                    </StatusBadge>
                                                ) : c.status === 'active' ? (
                                                    <StatusBadge tone="success">
                                                        Activo
                                                    </StatusBadge>
                                                ) : (
                                                    <StatusBadge tone="warning">
                                                        Inactivo
                                                    </StatusBadge>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <Pagination page={clients} />
            </div>

            <ClientFormDialog
                open={creating}
                onClose={() => setCreating(false)}
                options={options}
            />
        </>
    );
}

ClientsIndex.layout = {
    breadcrumbs: [{ title: 'Clientes', href: index() }],
};
