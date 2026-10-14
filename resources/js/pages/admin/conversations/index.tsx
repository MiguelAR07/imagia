import { Head, Link } from '@inertiajs/react';
import { MessagesSquare, Search, Target } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import { useFilters } from '@/hooks/use-filters';
import {
    ATTENTION_TONE,
    CONVERSATION_STATUS_TONE,
    ENGINE_LABELS,
} from '@/lib/conversation-labels';
import { formatRelative } from '@/lib/format';
import { index, show } from '@/routes/admin/conversations';
import type { ConversationListItem, Option, Paginated } from '@/types';

type Props = {
    conversations: Paginated<ConversationListItem>;
    filters: { q: string; attention: string; status: string };
    options: { attention: Option[]; statuses: Option[] };
    counts: Record<string, number>;
};

export default function ConversationsIndex({
    conversations,
    filters,
    options,
    counts,
}: Props) {
    const { filters: current, set } = useFilters(index().url, filters);
    const label = (list: Option[], v: string) =>
        list.find((o) => o.value === v)?.label ?? v;
    const pending = counts.new ?? 0;

    return (
        <>
            <Head title="Conversaciones" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Conversaciones"
                    description={
                        pending > 0
                            ? `${pending} ${pending === 1 ? 'conversación nueva' : 'conversaciones nuevas'} del asistente del sitio por revisar.`
                            : 'Lo que los visitantes conversan con el asistente del sitio.'
                    }
                />

                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-56 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="Buscar conversaciones"
                            placeholder="Buscar en el resumen o en los mensajes"
                            className="pl-9"
                            value={current.q}
                            onChange={(e) => set('q', e.target.value, true)}
                        />
                    </div>
                    <OptionSelect
                        value={current.attention}
                        options={options.attention}
                        allLabel="Todo el seguimiento"
                        onChange={(v) => set('attention', v)}
                        className="w-48"
                    />
                    <OptionSelect
                        value={current.status}
                        options={options.statuses}
                        allLabel="Todos los estados"
                        onChange={(v) => set('status', v)}
                        className="w-56"
                    />
                </div>

                {conversations.data.length === 0 ? (
                    <div className="rounded-xl border bg-card">
                        <EmptyState
                            icon={MessagesSquare}
                            title="No hay conversaciones"
                            description="Cuando un visitante hable con el asistente del sitio, la conversación aparecerá aquí con su resumen."
                        />
                    </div>
                ) : (
                    <ul className="grid gap-3">
                        {conversations.data.map((c) => (
                            <li key={c.id}>
                                <Link
                                    href={show(c.id)}
                                    className="block rounded-xl border bg-card p-4 transition-colors hover:border-brand-blue/50 hover:bg-accent/40"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            #{c.id}
                                        </span>
                                        <StatusBadge
                                            tone={
                                                ATTENTION_TONE[
                                                    c.attention_status
                                                ] ?? 'neutral'
                                            }
                                        >
                                            {label(
                                                options.attention,
                                                c.attention_status,
                                            )}
                                        </StatusBadge>
                                        {c.status !== 'open' && (
                                            <StatusBadge
                                                tone={
                                                    CONVERSATION_STATUS_TONE[
                                                        c.status
                                                    ] ?? 'neutral'
                                                }
                                            >
                                                {label(
                                                    options.statuses,
                                                    c.status,
                                                )}
                                            </StatusBadge>
                                        )}
                                        {c.recommendation && (
                                            <span className="text-sm font-medium">
                                                {c.recommendation}
                                            </span>
                                        )}
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {formatRelative(c.last_message_at)}
                                        </span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">
                                        {c.summary || 'Sin resumen todavía.'}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <span>
                                            {c.messages_count}{' '}
                                            {c.messages_count === 1
                                                ? 'mensaje'
                                                : 'mensajes'}{' '}
                                            del visitante
                                        </span>
                                        <span>
                                            {ENGINE_LABELS[c.engine] ??
                                                c.engine}
                                        </span>
                                        {c.lead && (
                                            <span className="inline-flex items-center gap-1 text-foreground">
                                                <Target className="size-3.5" />
                                                {c.lead.name}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <Pagination page={conversations} />
            </div>
        </>
    );
}
