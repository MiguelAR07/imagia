import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    CalendarClock,
    FileText,
    FolderKanban,
    ListChecks,
    MessagesSquare,
    Target,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandWordmark } from '@/components/brand-wordmark';
import { MoneyChart, MoneyStat } from '@/components/finance/money-chart';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as conversationsIndex } from '@/routes/admin/conversations';
import { index as financeIndex } from '@/routes/admin/finance';
import { index as leadsIndex, show as showLead } from '@/routes/admin/leads';
import {
    index as projectsIndex,
    show as showProject,
} from '@/routes/admin/projects';
import { index as quotesIndex } from '@/routes/admin/quotes';
import { index as tasksIndex } from '@/routes/admin/tasks';
import type {
    FinanceSummary,
    LogoPart,
    MonthlyPoint,
    OriginPart,
} from '@/types';

type Item = {
    id: number;
    name: string;
    detail: string | null;
    date: string | null;
    overdue: boolean;
    project_id?: number;
};

type Props = {
    story: { origin: OriginPart[]; logo_parts: LogoPart[] };
    commercial: {
        new_leads: number;
        open_leads: number;
        new_conversations: number | null;
        open_quotes: number | null;
        follow_ups: Item[];
    } | null;
    operation: {
        active_projects: number;
        overdue_projects: number;
        upcoming: Item[];
    } | null;
    myTasks: { open: number; overdue: number; items: Item[] } | null;
    finance: (FinanceSummary & { monthly: MonthlyPoint[] }) | null;
};

type Tile = {
    label: string;
    value: number;
    hint?: string;
    href: string;
    icon: LucideIcon;
    alert?: boolean;
};

const greeting = (): string => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Buenos días';
    }

    return hour < 19 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Dashboard({
    story,
    commercial,
    operation,
    myTasks,
    finance,
}: Props) {
    const { auth, brand } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];

    const tiles: Tile[] = [];

    if (commercial) {
        tiles.push({
            label: 'Prospectos nuevos este mes',
            value: commercial.new_leads,
            hint: `${commercial.open_leads} en seguimiento`,
            href: leadsIndex().url,
            icon: Target,
        });

        if (commercial.new_conversations !== null) {
            tiles.push({
                label: 'Conversaciones sin revisar',
                value: commercial.new_conversations,
                hint: 'Del asistente del sitio',
                href: conversationsIndex().url,
                icon: MessagesSquare,
            });
        }

        if (commercial.open_quotes !== null) {
            tiles.push({
                label: 'Cotizaciones abiertas',
                value: commercial.open_quotes,
                hint: 'En borrador o enviadas',
                href: quotesIndex().url,
                icon: FileText,
            });
        }
    }

    if (operation) {
        tiles.push({
            label: 'Proyectos activos',
            value: operation.active_projects,
            hint:
                operation.overdue_projects > 0
                    ? `${operation.overdue_projects} con entrega vencida`
                    : 'Ninguno vencido',
            href: projectsIndex().url,
            icon: FolderKanban,
            alert: operation.overdue_projects > 0,
        });
    }

    if (myTasks) {
        tiles.push({
            label: 'Mis tareas pendientes',
            value: myTasks.open,
            hint:
                myTasks.overdue > 0
                    ? `${myTasks.overdue} vencidas`
                    : 'Ninguna vencida',
            href: tasksIndex().url,
            icon: ListChecks,
            alert: myTasks.overdue > 0,
        });
    }

    return (
        <>
            <Head title="Inicio" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="space-y-1">
                    <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                        Panel de {brand.name}
                    </p>
                    <h1 className="text-2xl font-bold md:text-3xl">
                        {greeting()}, {firstName}
                    </h1>
                </header>

                {tiles.length > 0 && (
                    <section
                        aria-label="Indicadores"
                        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                    >
                        {tiles.map((t) => (
                            <StatTile key={t.label} {...t} />
                        ))}
                    </section>
                )}

                {finance && (
                    <section className="overflow-hidden rounded-2xl border">
                        <div className="flex items-center justify-between gap-3 border-b bg-card px-5 py-3">
                            <h2 className="font-semibold">Dinero este mes</h2>
                            <Link
                                href={financeIndex()}
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                Ver finanzas →
                            </Link>
                        </div>
                        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
                            <MoneyStat
                                label="Recibido"
                                value={finance.received}
                                currency={finance.currency}
                                tone="brand"
                            />
                            <MoneyStat
                                label="Gastos"
                                value={finance.expenses}
                                currency={finance.currency}
                            />
                            <MoneyStat
                                label="Utilidad"
                                value={finance.profit}
                                currency={finance.currency}
                                tone={
                                    finance.profit < 0 ? 'negative' : 'positive'
                                }
                            />
                            <MoneyStat
                                label="Por cobrar"
                                value={finance.receivable}
                                currency={finance.currency}
                                hint="Saldo de proyectos vigentes"
                            />
                        </div>
                        <div className="border-t bg-card p-5">
                            <MoneyChart
                                data={finance.monthly}
                                currency={finance.currency}
                            />
                        </div>
                    </section>
                )}

                {(commercial || operation || myTasks) && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {myTasks && (
                            <ListCard
                                title="Mis próximas tareas"
                                empty="No tienes tareas pendientes."
                                items={myTasks.items}
                                href={(i) => showProject(i.project_id ?? 0).url}
                            />
                        )}
                        {commercial && (
                            <ListCard
                                title="Seguimientos para hoy"
                                empty="No hay prospectos con seguimiento pendiente."
                                items={commercial.follow_ups}
                                href={(i) => showLead(i.id).url}
                            />
                        )}
                        {operation && (
                            <ListCard
                                title="Entregas próximas"
                                empty="Ninguna entrega en los próximos 14 días."
                                items={operation.upcoming}
                                href={(i) => showProject(i.id).url}
                            />
                        )}
                    </div>
                )}

                {/* Identidad: la marca y su significado siempre presentes */}
                <section className="relative overflow-hidden rounded-2xl border bg-card">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-blue/20 blur-3xl"
                    />
                    <div className="relative grid gap-8 p-6 md:grid-cols-[auto_1fr] md:p-8">
                        <div className="flex items-center gap-5">
                            <AppLogoIcon
                                animated
                                className="size-16 text-foreground md:size-20"
                            />
                            <div className="space-y-2">
                                <BrandWordmark className="text-3xl" />
                                <p className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
                                    {brand.descriptor}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center gap-3 md:border-l md:pl-8">
                            <p className="font-display text-xl font-semibold">
                                {brand.tagline}
                            </p>
                            {story.origin.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {story.origin.map((o, i) => (
                                        <span key={o.part}>
                                            {i > 0 && ' + '}
                                            <strong className="font-semibold text-foreground">
                                                {o.part}
                                            </strong>{' '}
                                            ({o.meaning})
                                        </span>
                                    ))}
                                </p>
                            )}
                        </div>
                    </div>

                    <ol className="relative grid border-t sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {brand.acronym.map((item, i) => (
                            <li
                                key={`${item.letter}-${i}`}
                                className="flex gap-3 border-b p-4 sm:border-r xl:border-b-0"
                            >
                                <span
                                    className={cn(
                                        'font-display text-3xl leading-none font-extrabold',
                                        i >= brand.acronym.length - 2 &&
                                            'text-brand-gradient',
                                    )}
                                >
                                    {item.letter}
                                </span>
                                <div className="min-w-0 space-y-1">
                                    <p className="text-sm font-semibold">
                                        {item.word}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>

                    {story.logo_parts.length > 0 && (
                        <ul className="relative grid gap-4 border-t p-6 md:grid-cols-3">
                            {story.logo_parts.map((part) => (
                                <li
                                    key={part.shape}
                                    className="grid grid-cols-[8px_1fr] gap-3"
                                >
                                    <span className="mt-2 size-2 rounded-full bg-brand-cyan" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {part.shape}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {part.meaning}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

function StatTile({ label, value, hint, href, icon: Icon, alert }: Tile) {
    return (
        <Link
            href={href}
            className="group rounded-xl border bg-card p-4 transition-colors hover:border-brand-blue/50 hover:bg-accent/40"
        >
            <div className="flex items-center justify-between">
                <Icon className="size-4 text-brand-cyan" />
                <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">
                {value}
            </p>
            <p className="text-sm font-medium">{label}</p>
            {hint && (
                <p
                    className={cn(
                        'mt-0.5 text-xs',
                        alert
                            ? 'text-destructive-foreground'
                            : 'text-muted-foreground',
                    )}
                >
                    {hint}
                </p>
            )}
        </Link>
    );
}

function ListCard({
    title,
    empty,
    items,
    href,
}: {
    title: string;
    empty: string;
    items: Item[];
    href: (item: Item) => string;
}) {
    return (
        <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">{title}</h2>
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{empty}</p>
            ) : (
                <ul className="divide-y">
                    {items.map((i) => (
                        <li key={i.id}>
                            <Link
                                href={href(i)}
                                className="flex items-center gap-3 py-2.5 text-sm"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium hover:underline">
                                        {i.name}
                                    </p>
                                    {i.detail && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {i.detail}
                                        </p>
                                    )}
                                </div>
                                {i.date && (
                                    <span
                                        className={cn(
                                            'flex shrink-0 items-center gap-1 text-xs',
                                            i.overdue
                                                ? 'font-semibold text-destructive-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        <CalendarClock className="size-3.5" />
                                        {formatDate(i.date)}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Inicio', href: dashboard() }],
};
