import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarClock,
    Columns3,
    List,
    Plus,
    Search,
    Settings2,
    UserCheck,
} from 'lucide-react';
import type { DragEvent } from 'react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';
import { LostReasonDialog } from '@/components/leads/move-lead-dialog';
import { StagesDialog } from '@/components/leads/stages-dialog';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCan } from '@/hooks/use-can';
import { useFilters } from '@/hooks/use-filters';
import { formatDate } from '@/lib/format';
import { stageDot } from '@/lib/stage-colors';
import { cn } from '@/lib/utils';
import { index, move, show } from '@/routes/admin/leads';
import type { LeadCard, Option, Stage } from '@/types';

type Props = {
    stages: Stage[];
    leads: LeadCard[];
    filters: { q: string; source: string; assigned: string };
    options: { sources: Option[]; users: Option[] };
};

const ASSIGNED_FILTERS: Option[] = [
    { value: 'me', label: 'Asignados a mí' },
    { value: 'none', label: 'Sin asignar' },
];

const VIEW_KEY = 'imagia:leads-view';

export default function LeadsIndex({ stages, leads, filters, options }: Props) {
    const can = useCan();
    const { filters: current, set } = useFilters(index().url, filters);
    const [creatingIn, setCreatingIn] = useState<number | null>(null);
    const [editingStages, setEditingStages] = useState(false);
    const [lostMove, setLostMove] = useState<{
        leadId: number;
        stage: Stage;
    } | null>(null);
    const [view, setView] = useState<'board' | 'list'>(() => {
        try {
            return (
                (localStorage.getItem(VIEW_KEY) as 'board' | 'list') ?? 'board'
            );
        } catch {
            return 'board';
        }
    });
    const [dragging, setDragging] = useState<number | null>(null);
    const [over, setOver] = useState<number | null>(null);

    const byStage = useMemo(() => {
        const map = new Map<number, LeadCard[]>();
        stages.forEach((s) => map.set(s.id, []));
        leads.forEach((l) => map.get(l.pipeline_stage_id)?.push(l));

        return map;
    }, [stages, leads]);

    const sourceLabel = (v: string) =>
        options.sources.find((s) => s.value === v)?.label ?? v;
    const stageOf = (id: number) => stages.find((s) => s.id === id);
    const overdue = leads.filter((l) => l.follow_up_overdue).length;

    const changeView = (v: 'board' | 'list') => {
        setView(v);
        try {
            localStorage.setItem(VIEW_KEY, v);
        } catch {
            // Sin almacenamiento local: la vista vuelve al tablero al recargar.
        }
    };

    const moveTo = (leadId: number, stageId: number) => {
        const lead = leads.find((l) => l.id === leadId);
        const stage = stageOf(stageId);

        if (!lead || !stage || lead.pipeline_stage_id === stageId) {
            return;
        }

        if (stage.is_lost) {
            setLostMove({ leadId, stage });

            return;
        }

        router.patch(
            move(leadId).url,
            { pipeline_stage_id: stageId },
            { preserveScroll: true, preserveState: true },
        );
    };

    const onDrop = (event: DragEvent, stageId: number) => {
        event.preventDefault();
        const leadId = Number(event.dataTransfer.getData('text/plain'));
        setDragging(null);
        setOver(null);
        moveTo(leadId, stageId);
    };

    return (
        <>
            <Head title="Prospectos" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Prospectos"
                    description={
                        overdue > 0 ? (
                            <span className="text-warning">
                                {overdue}{' '}
                                {overdue === 1
                                    ? 'seguimiento vencido'
                                    : 'seguimientos vencidos'}
                            </span>
                        ) : (
                            'Personas interesadas en contratar. Arrastra cada tarjeta a la etapa en que va.'
                        )
                    }
                    actions={
                        <>
                            {can('configuracion.gestionar') && (
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingStages(true)}
                                >
                                    <Settings2 className="size-4" />
                                    Etapas
                                </Button>
                            )}
                            <Button
                                onClick={() =>
                                    setCreatingIn(stages[0]?.id ?? 0)
                                }
                                disabled={stages.length === 0}
                            >
                                <Plus className="size-4" />
                                Nuevo prospecto
                            </Button>
                        </>
                    }
                />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-56 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Buscar prospectos"
                            placeholder="Buscar por nombre, empresa, correo o teléfono"
                            className="pl-9"
                            value={current.q}
                            onChange={(e) => set('q', e.target.value, true)}
                        />
                    </div>
                    <OptionSelect
                        value={current.source}
                        options={options.sources}
                        allLabel="Todos los orígenes"
                        onChange={(v) => set('source', v)}
                        className="w-48"
                    />
                    <OptionSelect
                        value={current.assigned}
                        options={ASSIGNED_FILTERS}
                        allLabel="Cualquier responsable"
                        onChange={(v) => set('assigned', v)}
                        className="w-48"
                    />
                    <div
                        role="group"
                        aria-label="Vista"
                        className="flex rounded-lg border p-0.5"
                    >
                        <ViewButton
                            active={view === 'board'}
                            onClick={() => changeView('board')}
                            icon={Columns3}
                            label="Tablero"
                        />
                        <ViewButton
                            active={view === 'list'}
                            onClick={() => changeView('list')}
                            icon={List}
                            label="Lista"
                        />
                    </div>
                </div>

                {stages.length === 0 ? (
                    <EmptyState
                        icon={Columns3}
                        title="El embudo no tiene etapas"
                        description="Crea al menos una etapa para empezar a registrar prospectos."
                    />
                ) : view === 'board' ? (
                    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
                        <div className="flex min-w-max gap-4">
                            {stages.map((stage) => {
                                const items = byStage.get(stage.id) ?? [];

                                return (
                                    <section
                                        key={stage.id}
                                        aria-label={stage.name}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setOver(stage.id);
                                        }}
                                        onDragLeave={() =>
                                            setOver((o) =>
                                                o === stage.id ? null : o,
                                            )
                                        }
                                        onDrop={(e) => onDrop(e, stage.id)}
                                        className={cn(
                                            'flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors',
                                            over === stage.id &&
                                                dragging !== null &&
                                                'border-primary bg-primary/5',
                                        )}
                                    >
                                        <header className="flex items-center justify-between gap-2 px-3 py-2.5">
                                            <h2 className="flex items-center gap-2 text-sm font-semibold">
                                                <span
                                                    className={cn(
                                                        'size-2.5 rounded-full',
                                                        stageDot(stage.color),
                                                    )}
                                                />
                                                {stage.name}
                                            </h2>
                                            <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                                {items.length}
                                            </span>
                                        </header>
                                        <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                                            {items.map((lead) => (
                                                <LeadCardView
                                                    key={lead.id}
                                                    lead={lead}
                                                    sourceLabel={sourceLabel(
                                                        lead.source,
                                                    )}
                                                    dragging={
                                                        dragging === lead.id
                                                    }
                                                    stages={stages}
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData(
                                                            'text/plain',
                                                            String(lead.id),
                                                        );
                                                        e.dataTransfer.effectAllowed =
                                                            'move';
                                                        setDragging(lead.id);
                                                    }}
                                                    onDragEnd={() => {
                                                        setDragging(null);
                                                        setOver(null);
                                                    }}
                                                    onMove={(stageId) =>
                                                        moveTo(lead.id, stageId)
                                                    }
                                                />
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCreatingIn(stage.id)
                                                }
                                                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                            >
                                                <Plus className="size-3.5" />
                                                Agregar aquí
                                            </button>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border bg-card">
                        {leads.length === 0 ? (
                            <EmptyState
                                icon={UserCheck}
                                title="No hay prospectos con estos filtros"
                            />
                        ) : (
                            <table className="w-full min-w-[760px] text-sm">
                                <thead>
                                    <tr className="border-b text-left font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                        <th className="px-4 py-3 font-medium">
                                            Prospecto
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Etapa
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Origen
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Responsable
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Seguimiento
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => {
                                        const stage = stageOf(
                                            lead.pipeline_stage_id,
                                        );

                                        return (
                                            <tr
                                                key={lead.id}
                                                className="border-b last:border-0 hover:bg-accent/40"
                                            >
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={show(lead.id)}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {lead.name}
                                                    </Link>
                                                    {lead.company && (
                                                        <div className="text-muted-foreground">
                                                            {lead.company}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'size-2 rounded-full',
                                                                stageDot(
                                                                    stage?.color ??
                                                                        'slate',
                                                                ),
                                                            )}
                                                        />
                                                        {stage?.name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {sourceLabel(lead.source)}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {lead.assignee?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <FollowUp lead={lead} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {creatingIn !== null && (
                <LeadFormDialog
                    open
                    stages={stages}
                    initialStageId={creatingIn}
                    options={options}
                    onClose={() => setCreatingIn(null)}
                />
            )}
            {editingStages && (
                <StagesDialog
                    stages={stages}
                    onClose={() => setEditingStages(false)}
                />
            )}
            {lostMove && (
                <LostReasonDialog
                    leadId={lostMove.leadId}
                    stage={lostMove.stage}
                    onClose={() => setLostMove(null)}
                />
            )}
        </>
    );
}

function ViewButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: typeof List;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            <Icon className="size-4" />
            {label}
        </button>
    );
}

function FollowUp({ lead }: { lead: LeadCard }) {
    if (!lead.next_follow_up_at) {
        return <span className="text-muted-foreground">—</span>;
    }

    return lead.follow_up_overdue ? (
        <StatusBadge tone="danger">
            Vencido · {formatDate(lead.next_follow_up_at)}
        </StatusBadge>
    ) : (
        <span className="text-muted-foreground">
            {formatDate(lead.next_follow_up_at)}
        </span>
    );
}

function LeadCardView({
    lead,
    sourceLabel,
    dragging,
    stages,
    onDragStart,
    onDragEnd,
    onMove,
}: {
    lead: LeadCard;
    sourceLabel: string;
    dragging: boolean;
    stages: Stage[];
    onDragStart: (e: DragEvent) => void;
    onDragEnd: () => void;
    onMove: (stageId: number) => void;
}) {
    return (
        <article
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(
                'group cursor-grab rounded-lg border bg-card p-3 shadow-xs transition-all hover:border-primary/40 active:cursor-grabbing',
                dragging && 'opacity-40',
            )}
        >
            <Link href={show(lead.id)} className="block space-y-1.5">
                <p className="text-sm leading-snug font-semibold">
                    {lead.name}
                </p>
                {lead.company && (
                    <p className="text-xs text-muted-foreground">
                        {lead.company}
                    </p>
                )}
                {lead.need_excerpt && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                        {lead.need_excerpt}
                    </p>
                )}
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {sourceLabel}
                </span>
                {lead.is_client && (
                    <span className="rounded bg-success/15 px-1.5 py-0.5 text-[11px] text-success">
                        Cliente
                    </span>
                )}
                {lead.next_follow_up_at && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]',
                            lead.follow_up_overdue
                                ? 'bg-destructive/15 text-destructive-foreground'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        <CalendarClock className="size-3" />
                        {formatDate(lead.next_follow_up_at)}
                    </span>
                )}
                {lead.assignee && (
                    <span
                        title={lead.assignee.name}
                        className="ml-auto flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
                    >
                        {lead.assignee.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                    </span>
                )}
            </div>
            {/* Alternativa accesible al arrastre: mover con el teclado o en celular */}
            <label className="mt-2 block">
                <span className="sr-only">
                    Mover «{lead.name}» a otra etapa
                </span>
                <select
                    value={lead.pipeline_stage_id}
                    onChange={(e) => onMove(Number(e.target.value))}
                    className="w-full rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                >
                    {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                            Mover a: {s.name}
                        </option>
                    ))}
                </select>
            </label>
        </article>
    );
}

LeadsIndex.layout = {
    breadcrumbs: [{ title: 'Prospectos', href: index() }],
};
