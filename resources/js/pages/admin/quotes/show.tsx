import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    Check,
    Copy,
    FolderPlus,
    Pencil,
    Printer,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { QUOTE_STATUS_TONE } from '@/lib/quote-labels';
import { show as showClient } from '@/routes/admin/clients';
import { show as showLead } from '@/routes/admin/leads';
import { show as showProject } from '@/routes/admin/projects';
import {
    destroy,
    duplicate,
    edit,
    index,
    print,
    project as createProject,
    show,
    status as setStatus,
} from '@/routes/admin/quotes';
import type { Option, QuoteDetail } from '@/types';

export default function QuoteShow({
    quote,
    statuses,
}: {
    quote: QuoteDetail;
    statuses: Option[];
}) {
    const can = useCan();
    const label = (v: string) =>
        statuses.find((s) => s.value === v)?.label ?? v;
    const money = (v: string | number) => formatMoney(v, quote.currency);
    const change = (status: string, done?: () => void) =>
        router.patch(
            setStatus(quote.id).url,
            { status },
            { preserveScroll: true, onFinish: done },
        );
    const needsClient =
        quote.status === 'accepted' &&
        !quote.project &&
        !quote.client &&
        !quote.lead?.client_id;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Cotizaciones', href: index() },
            { title: quote.number, href: show(quote.id) },
        ],
    });

    return (
        <>
            <Head title={`${quote.number} · ${quote.title}`} />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    eyebrow={quote.number}
                    title={quote.title}
                    description={
                        <span className="inline-flex flex-wrap items-center gap-2">
                            <StatusBadge
                                tone={
                                    QUOTE_STATUS_TONE[quote.status] ?? 'neutral'
                                }
                            >
                                {label(quote.status)}
                            </StatusBadge>
                            {quote.client ? (
                                <Link
                                    href={showClient(quote.client.id)}
                                    className="hover:underline"
                                >
                                    {quote.client.name}
                                </Link>
                            ) : quote.lead ? (
                                <Link
                                    href={showLead(quote.lead.id)}
                                    className="hover:underline"
                                >
                                    {quote.recipient} (prospecto)
                                </Link>
                            ) : null}
                        </span>
                    }
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a
                                    href={print(quote.id).url}
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <Printer className="size-4" />
                                    Imprimir / PDF
                                </a>
                            </Button>
                            {quote.editable && (
                                <Button variant="outline" asChild>
                                    <Link href={edit(quote.id)}>
                                        <Pencil className="size-4" />
                                        Editar
                                    </Link>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    router.post(duplicate(quote.id).url)
                                }
                                title="Crear una nueva versión"
                            >
                                <Copy className="size-4" />
                                Duplicar
                            </Button>
                        </>
                    }
                />

                {quote.past_validity && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                        La validez de esta propuesta terminó el{' '}
                        {formatDate(quote.valid_until)}.
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => change('expired')}
                        >
                            Marcar como vencida
                        </Button>
                    </div>
                )}

                {/* Siguiente paso según el estado */}
                <section className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
                    {quote.status === 'draft' && (
                        <>
                            <p className="flex-1 text-sm text-muted-foreground">
                                Cuando se la envíes al cliente, márcala como
                                enviada para hacer seguimiento.
                            </p>
                            <Button onClick={() => change('sent')}>
                                <Send className="size-4" />
                                Marcar como enviada
                            </Button>
                        </>
                    )}
                    {quote.status === 'sent' && (
                        <>
                            <p className="flex-1 text-sm text-muted-foreground">
                                Enviada{' '}
                                {quote.sent_at
                                    ? formatDateTime(quote.sent_at)
                                    : ''}
                                . ¿Qué respondió el cliente?
                            </p>
                            <ConfirmDialog
                                trigger={
                                    <Button>
                                        <Check className="size-4" />
                                        Aceptada
                                    </Button>
                                }
                                title="Marcar como aceptada"
                                description="Quedará como propuesta aceptada y ya no se podrá editar. No se registra ningún pago: los pagos se anotan aparte cuando lleguen."
                                confirmLabel="Marcar aceptada"
                                onConfirm={(done) => change('accepted', done)}
                            />
                            <Button
                                variant="outline"
                                onClick={() => change('rejected')}
                            >
                                <X className="size-4" />
                                Rechazada
                            </Button>
                        </>
                    )}
                    {quote.status === 'accepted' &&
                        (quote.project ? (
                            <p className="flex-1 text-sm">
                                Aceptada el {formatDate(quote.accepted_at)}.
                                Proyecto:{' '}
                                <Link
                                    href={showProject(quote.project.id)}
                                    className="font-medium hover:underline"
                                >
                                    {quote.project.name}
                                </Link>
                            </p>
                        ) : (
                            <>
                                <p className="flex-1 text-sm text-muted-foreground">
                                    Aceptada el {formatDate(quote.accepted_at)}.{' '}
                                    {needsClient
                                        ? 'Para crear el proyecto, primero convierte el prospecto en cliente.'
                                        : 'Crea el proyecto con el valor de esta cotización como valor contratado.'}
                                </p>
                                {can('proyectos.gestionar') && !needsClient && (
                                    <Button
                                        onClick={() =>
                                            router.post(
                                                createProject(quote.id).url,
                                            )
                                        }
                                    >
                                        <FolderPlus className="size-4" />
                                        Crear proyecto
                                    </Button>
                                )}
                            </>
                        ))}
                    {(quote.status === 'rejected' ||
                        quote.status === 'expired') && (
                        <>
                            <p className="flex-1 text-sm text-muted-foreground">
                                Puedes duplicarla para preparar una nueva
                                versión.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => change('draft')}
                            >
                                Volver a borrador
                            </Button>
                        </>
                    )}
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="space-y-6">
                        {quote.scope && (
                            <section className="rounded-xl border bg-card p-5">
                                <h2 className="mb-2 text-sm font-semibold">
                                    Alcance
                                </h2>
                                <p className="text-sm whitespace-pre-line text-muted-foreground">
                                    {quote.scope}
                                </p>
                            </section>
                        )}
                        <section className="overflow-x-auto rounded-xl border bg-card">
                            <table className="w-full min-w-[620px] text-sm">
                                <thead>
                                    <tr className="border-b text-left font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                        <th className="px-4 py-3 font-medium">
                                            Concepto
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Cant.
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Precio
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Desc.
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Valor
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quote.items.map((i) => (
                                        <tr
                                            key={i.id}
                                            className="border-b align-top last:border-0"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium">
                                                    {i.description}
                                                </p>
                                                {i.details && (
                                                    <p className="text-xs whitespace-pre-line text-muted-foreground">
                                                        {i.details}
                                                    </p>
                                                )}
                                                {i.tax && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {i.tax}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {Number(i.quantity)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                {money(i.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {Number(i.discount_percent) > 0
                                                    ? `${Number(i.discount_percent)} %`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                {money(i.line_total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                        <section className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
                            <Block
                                title="Forma de pago"
                                text={quote.payment_terms}
                            />
                            <Block title="No incluye" text={quote.exclusions} />
                            <Block title="Observaciones" text={quote.notes} />
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border bg-card p-5">
                            <dl className="space-y-2 text-sm">
                                <Row
                                    label="Subtotal"
                                    value={money(quote.subtotal)}
                                />
                                <Row
                                    label="Descuentos"
                                    value={
                                        Number(quote.discount_amount) > 0
                                            ? `− ${money(quote.discount_amount)}`
                                            : money(0)
                                    }
                                />
                                <Row
                                    label="Impuestos"
                                    value={money(quote.tax_amount)}
                                />
                                <div className="flex items-baseline justify-between border-t pt-3">
                                    <dt className="font-semibold">Total</dt>
                                    <dd className="font-display text-2xl font-bold tabular-nums">
                                        {money(quote.total)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <dl className="space-y-2 rounded-xl border bg-card p-4 text-sm">
                            <Row
                                label="Válida hasta"
                                value={formatDate(quote.valid_until)}
                            />
                            <Row
                                label="Creada"
                                value={formatDate(quote.created_at)}
                            />
                            {quote.created_by && (
                                <Row label="Por" value={quote.created_by} />
                            )}
                            {quote.plan && (
                                <Row
                                    label="Plan base"
                                    value={quote.plan.name}
                                />
                            )}
                        </dl>
                        {quote.status !== 'accepted' && (
                            <ConfirmDialog
                                trigger={
                                    <Button
                                        variant="ghost"
                                        className="w-full text-muted-foreground"
                                    >
                                        <Trash2 className="size-4" />
                                        Eliminar cotización
                                    </Button>
                                }
                                title={`Eliminar ${quote.number}`}
                                description="El número no se reutiliza. Esta acción no se puede deshacer desde el panel."
                                confirmLabel="Eliminar"
                                destructive
                                onConfirm={(done) =>
                                    router.delete(destroy(quote.id).url, {
                                        onFinish: done,
                                    })
                                }
                            />
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}

function Block({ title, text }: { title: string; text: string | null }) {
    if (!text) {
        return null;
    }

    return (
        <div>
            <h2 className="mb-1 text-sm font-semibold">{title}</h2>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
                {text}
            </p>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-mono tabular-nums">{value}</dd>
        </div>
    );
}
