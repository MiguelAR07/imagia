import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    Archive,
    Building2,
    FileText,
    CalendarClock,
    Mail,
    Pencil,
    Phone,
    ShieldCheck,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { ActivityTimeline } from '@/components/activity-timeline';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import { LostReasonDialog } from '@/components/leads/move-lead-dialog';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format';
import { stageDot } from '@/lib/stage-colors';
import { cn } from '@/lib/utils';
import { show as showClient } from '@/routes/admin/clients';
import { convert, destroy, index, move, show } from '@/routes/admin/leads';
import { create as createQuote } from '@/routes/admin/quotes';
import type { ActivityItem, LeadDetail, Option, Stage } from '@/types';

type Props = {
    lead: LeadDetail;
    stages: Stage[];
    activities: ActivityItem[];
    options: { sources: Option[]; users: Option[]; activity_types: Option[] };
};

export default function LeadShow({ lead, stages, activities, options }: Props) {
    const can = useCan();
    const [editing, setEditing] = useState(false);
    const [lostStage, setLostStage] = useState<Stage | null>(null);
    const stage = stages.find((s) => s.id === lead.pipeline_stage_id);
    const source = options.sources.find((s) => s.value === lead.source)?.label;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Prospectos', href: index() },
            { title: lead.name, href: show(lead.id) },
        ],
    });

    const moveTo = (value: string) => {
        const target = stages.find((s) => String(s.id) === value);

        if (!target || target.id === lead.pipeline_stage_id) {
            return;
        }

        if (target.is_lost) {
            setLostStage(target);

            return;
        }

        router.patch(
            move(lead.id).url,
            { pipeline_stage_id: target.id },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={lead.name} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {lead.archived && (
                    <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                        Este prospecto está archivado.
                    </div>
                )}

                <PageHeader
                    eyebrow={source}
                    title={lead.name}
                    description={lead.company ?? undefined}
                    actions={
                        !lead.archived && (
                            <>
                                {lead.client ? (
                                    <Button variant="outline" asChild>
                                        <Link href={showClient(lead.client.id)}>
                                            <Building2 className="size-4" />
                                            Ver cliente
                                        </Link>
                                    </Button>
                                ) : (
                                    can('clientes.gestionar') && (
                                        <ConfirmDialog
                                            trigger={
                                                <Button variant="outline">
                                                    <UserPlus className="size-4" />
                                                    Convertir en cliente
                                                </Button>
                                            }
                                            title="Convertir en cliente"
                                            description={
                                                lead.company
                                                    ? `Se creará el cliente «${lead.company}» con ${lead.name} como contacto principal. El prospecto se mantiene en su etapa actual.`
                                                    : `Se creará el cliente «${lead.name}». El prospecto se mantiene en su etapa actual.`
                                            }
                                            confirmLabel="Crear cliente"
                                            onConfirm={(done) =>
                                                router.post(
                                                    convert(lead.id).url,
                                                    {},
                                                    { onFinish: done },
                                                )
                                            }
                                        />
                                    )
                                )}
                                {can('cotizaciones.gestionar') && (
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={`${createQuote().url}?${lead.client ? `client=${lead.client.id}` : `lead=${lead.id}`}`}
                                        >
                                            <FileText className="size-4" />
                                            Nueva cotización
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(true)}
                                >
                                    <Pencil className="size-4" />
                                    Editar
                                </Button>
                                <ConfirmDialog
                                    trigger={
                                        <Button variant="ghost">
                                            <Archive className="size-4" />
                                            Archivar
                                        </Button>
                                    }
                                    title={`Archivar a ${lead.name}`}
                                    description="Saldrá del embudo. Su historial se conserva."
                                    confirmLabel="Archivar"
                                    onConfirm={(done) =>
                                        router.delete(destroy(lead.id).url, {
                                            onFinish: done,
                                        })
                                    }
                                />
                            </>
                        )
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                    <div className="space-y-6">
                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="mb-3 text-base font-semibold">
                                Etapa
                            </h2>
                            {lead.archived ? (
                                <p className="flex items-center gap-2 text-sm">
                                    <span
                                        className={cn(
                                            'size-2.5 rounded-full',
                                            stageDot(stage?.color ?? 'slate'),
                                        )}
                                    />
                                    {stage?.name}
                                </p>
                            ) : (
                                <OptionSelect
                                    value={String(lead.pipeline_stage_id)}
                                    options={stages.map((s) => ({
                                        value: String(s.id),
                                        label: s.name,
                                    }))}
                                    onChange={moveTo}
                                />
                            )}
                            {lead.lost_reason && (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        Motivo:
                                    </span>{' '}
                                    {lead.lost_reason}
                                </p>
                            )}
                            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Responsable
                                    </dt>
                                    <dd>
                                        {lead.assignee?.name ?? 'Sin asignar'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Próximo seguimiento
                                    </dt>
                                    <dd>
                                        {lead.next_follow_up_at ? (
                                            lead.follow_up_overdue ? (
                                                <StatusBadge tone="danger">
                                                    <CalendarClock className="size-3" />
                                                    Vencido ·{' '}
                                                    {formatDate(
                                                        lead.next_follow_up_at,
                                                    )}
                                                </StatusBadge>
                                            ) : (
                                                formatDate(
                                                    lead.next_follow_up_at,
                                                )
                                            )
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Último contacto
                                    </dt>
                                    <dd
                                        title={formatDateTime(
                                            lead.last_contacted_at,
                                        )}
                                    >
                                        {lead.last_contacted_at
                                            ? formatRelative(
                                                  lead.last_contacted_at,
                                              )
                                            : 'Sin registrar'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Registrado
                                    </dt>
                                    <dd>{formatDate(lead.created_at)}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="mb-3 text-base font-semibold">
                                Contacto
                            </h2>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <Mail className="size-4 text-muted-foreground" />
                                    {lead.email ? (
                                        <a
                                            href={`mailto:${lead.email}`}
                                            className="hover:underline"
                                        >
                                            {lead.email}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Sin correo
                                        </span>
                                    )}
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone className="size-4 text-muted-foreground" />
                                    {lead.phone ?? (
                                        <span className="text-muted-foreground">
                                            Sin teléfono
                                        </span>
                                    )}
                                </li>
                                {lead.consent_at && (
                                    <li className="flex items-center gap-2 text-muted-foreground">
                                        <ShieldCheck className="size-4 text-success" />
                                        Autorizó el uso de sus datos el{' '}
                                        {formatDate(lead.consent_at)}
                                    </li>
                                )}
                            </ul>
                        </section>

                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="mb-3 text-base font-semibold">
                                Necesidad
                            </h2>
                            <p className="text-sm whitespace-pre-line">
                                {lead.need || (
                                    <span className="text-muted-foreground">
                                        Aún no se ha registrado.
                                    </span>
                                )}
                            </p>
                            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Presupuesto
                                    </dt>
                                    <dd>{lead.budget_range ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Para cuándo
                                    </dt>
                                    <dd>{lead.urgency ?? '—'}</dd>
                                </div>
                            </dl>
                        </section>
                    </div>

                    <section className="rounded-xl border bg-card p-5">
                        <h2 className="mb-4 text-base font-semibold">
                            Seguimiento
                        </h2>
                        <ActivityTimeline
                            subjectType="prospectos"
                            subjectId={lead.id}
                            activities={activities}
                            types={options.activity_types}
                            canWrite={!lead.archived}
                        />
                    </section>
                </div>
            </div>

            {editing && (
                <LeadFormDialog
                    open
                    lead={lead}
                    stages={stages}
                    options={options}
                    onClose={() => setEditing(false)}
                />
            )}
            {lostStage && (
                <LostReasonDialog
                    leadId={lead.id}
                    stage={lostStage}
                    onClose={() => setLostStage(null)}
                />
            )}
        </>
    );
}
