import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { Target, Trash2 } from 'lucide-react';
import { ActivityTimeline } from '@/components/activity-timeline';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCan } from '@/hooks/use-can';
import {
    CONVERSATION_STATUS_TONE,
    ENGINE_LABELS,
} from '@/lib/conversation-labels';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { destroy, index, show, update } from '@/routes/admin/conversations';
import { show as showLead } from '@/routes/admin/leads';
import type { ActivityItem, ConversationDetail, Option } from '@/types';

type Props = {
    conversation: ConversationDetail;
    activities: ActivityItem[];
    options: {
        attention: Option[];
        statuses: Option[];
        activity_types: Option[];
    };
};

export default function ConversationShow({
    conversation: c,
    activities,
    options,
}: Props) {
    const can = useCan();
    const title = `Conversación #${c.id}`;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Conversaciones', href: index() },
            { title, href: show(c.id) },
        ],
    });

    const patch = (data: Record<string, string>) =>
        router.patch(update(c.id).url, data, { preserveScroll: true });

    return (
        <>
            <Head title={title} />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={title}
                    description={`Iniciada el ${formatDateTime(c.created_at)} · ${ENGINE_LABELS[c.engine] ?? c.engine}`}
                    actions={
                        can('configuracion.gestionar') && (
                            <ConfirmDialog
                                trigger={
                                    <Button variant="outline">
                                        <Trash2 className="size-4" />
                                        Eliminar
                                    </Button>
                                }
                                title="Eliminar conversación"
                                description="Se borra la transcripción y sus notas, por ejemplo si el visitante pide eliminar sus datos. El prospecto creado desde ella no se borra. No se puede deshacer."
                                confirmLabel="Eliminar"
                                destructive
                                onConfirm={(done) =>
                                    router.delete(destroy(c.id).url, {
                                        onFinish: done,
                                    })
                                }
                            />
                        )
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section
                        aria-label="Transcripción"
                        className="rounded-xl border bg-card p-5"
                    >
                        <h2 className="mb-4 text-base font-semibold">
                            Transcripción
                        </h2>
                        <ol className="space-y-3">
                            {c.messages.map((m) => (
                                <li
                                    key={m.id}
                                    className={cn(
                                        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line',
                                        m.role === 'user'
                                            ? 'ml-auto rounded-br-md bg-brand-blue text-white'
                                            : 'rounded-bl-md bg-muted',
                                    )}
                                >
                                    <span className="sr-only">
                                        {m.role === 'user'
                                            ? 'Visitante: '
                                            : 'Asistente: '}
                                    </span>
                                    {m.content.replace(/\*\*/g, '')}
                                    <span
                                        className={cn(
                                            'mt-1 block text-[11px]',
                                            m.role === 'user'
                                                ? 'text-white/70'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {formatDateTime(m.created_at)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <div className="space-y-6">
                        <section className="space-y-4 rounded-xl border bg-card p-5">
                            <h2 className="text-base font-semibold">
                                Seguimiento
                            </h2>
                            <div className="grid gap-2">
                                <Label htmlFor="attention">Estado</Label>
                                <OptionSelect
                                    id="attention"
                                    value={c.attention_status}
                                    options={options.attention}
                                    onChange={(v) =>
                                        patch({ attention_status: v })
                                    }
                                />
                            </div>
                            {c.status === 'converted' ? (
                                <StatusBadge
                                    tone={CONVERSATION_STATUS_TONE.converted}
                                >
                                    Con datos de contacto
                                </StatusBadge>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        patch({
                                            status:
                                                c.status === 'closed'
                                                    ? 'open'
                                                    : 'closed',
                                        })
                                    }
                                >
                                    {c.status === 'closed'
                                        ? 'Reabrir conversación'
                                        : 'Cerrar conversación'}
                                </Button>
                            )}
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-5">
                            <h2 className="text-base font-semibold">Resumen</h2>
                            {c.summary ? (
                                <dl className="space-y-2 text-sm">
                                    {c.summary.split('\n').map((line) => {
                                        const [label, ...rest] =
                                            line.split(': ');

                                        return (
                                            <div key={line}>
                                                <dt className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                                    {label}
                                                </dt>
                                                <dd>{rest.join(': ')}</dd>
                                            </div>
                                        );
                                    })}
                                </dl>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    El visitante no dio suficiente información.
                                </p>
                            )}
                            {c.plan && (
                                <p className="text-sm">
                                    Plan sugerido:{' '}
                                    <span className="font-medium">
                                        {c.plan.name}
                                    </span>
                                </p>
                            )}
                        </section>

                        <section className="space-y-3 rounded-xl border bg-card p-5">
                            <h2 className="text-base font-semibold">
                                Prospecto
                            </h2>
                            {c.lead ? (
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium">
                                        {c.lead.name}
                                        {c.lead.archived && ' (archivado)'}
                                    </p>
                                    {c.lead.email && <p>{c.lead.email}</p>}
                                    {c.lead.phone && <p>{c.lead.phone}</p>}
                                    {can('prospectos.gestionar') && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                        >
                                            <Link href={showLead(c.lead.id)}>
                                                <Target className="size-4" />
                                                Ver prospecto
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    El visitante no dejó sus datos de contacto
                                    en el chat.
                                </p>
                            )}
                        </section>

                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="mb-4 text-base font-semibold">
                                Notas internas
                            </h2>
                            <ActivityTimeline
                                subjectType="conversaciones"
                                subjectId={c.id}
                                activities={activities}
                                types={options.activity_types}
                                canWrite
                            />
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
