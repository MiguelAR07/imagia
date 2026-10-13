import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarEvent = {
    id: string;
    date: string; // YYYY-MM-DD
    label: string;
    href?: string;
    tone: 'project' | 'overdue' | 'milestone' | 'done';
};

const TONES: Record<CalendarEvent['tone'], string> = {
    project: 'bg-primary/15 text-primary dark:text-[#8da3ff]',
    overdue: 'bg-destructive/15 text-destructive-foreground',
    milestone: 'bg-brand-cyan/15 text-brand-cyan',
    done: 'bg-success/15 text-success line-through decoration-1',
};

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Calendario mensual con eventos por día (fechas de entrega e hitos). */
export function MonthCalendar({ events }: { events: CalendarEvent[] }) {
    const [cursor, setCursor] = useState(() => {
        const now = new Date();

        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const todayKey = key(new Date());

    const byDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));

        return map;
    }, [events]);

    const days = useMemo(() => {
        const first = new Date(cursor);
        const offset = (first.getDay() + 6) % 7; // lunes primero
        const start = new Date(first);
        start.setDate(first.getDate() - offset);

        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);

            return d;
        });
    }, [cursor]);

    const shift = (months: number) =>
        setCursor((c) => new Date(c.getFullYear(), c.getMonth() + months, 1));

    const monthLabel = cursor.toLocaleDateString('es-CO', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <h2 className="text-base font-semibold first-letter:uppercase">
                    {monthLabel}
                </h2>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setCursor(
                                new Date(
                                    new Date().getFullYear(),
                                    new Date().getMonth(),
                                    1,
                                ),
                            )
                        }
                    >
                        Hoy
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mes anterior"
                        onClick={() => shift(-1)}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mes siguiente"
                        onClick={() => shift(1)}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <div className="grid min-w-[720px] grid-cols-7">
                    {WEEKDAYS.map((d) => (
                        <div
                            key={d}
                            className="border-b px-2 py-2 text-center font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
                        >
                            {d}
                        </div>
                    ))}
                    {days.map((d) => {
                        const k = key(d);
                        const inMonth = d.getMonth() === cursor.getMonth();
                        const items = byDay.get(k) ?? [];

                        return (
                            <div
                                key={k}
                                className={cn(
                                    'min-h-24 border-r border-b p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0',
                                    !inMonth && 'bg-muted/40',
                                )}
                            >
                                <span
                                    className={cn(
                                        'mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                                        k === todayKey
                                            ? 'bg-primary font-semibold text-primary-foreground'
                                            : !inMonth &&
                                                  'text-muted-foreground',
                                    )}
                                >
                                    {d.getDate()}
                                </span>
                                <ul className="space-y-1">
                                    {items.map((e) => (
                                        <li key={e.id}>
                                            {e.href ? (
                                                <Link
                                                    href={e.href}
                                                    className={cn(
                                                        'block truncate rounded px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80',
                                                        TONES[e.tone],
                                                    )}
                                                    title={e.label}
                                                >
                                                    {e.label}
                                                </Link>
                                            ) : (
                                                <span
                                                    className={cn(
                                                        'block truncate rounded px-1.5 py-0.5 text-[11px] font-medium',
                                                        TONES[e.tone],
                                                    )}
                                                    title={e.label}
                                                >
                                                    {e.label}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex flex-wrap gap-4 border-t px-4 py-2.5 text-xs text-muted-foreground">
                <Legend className={TONES.project} label="Entrega de proyecto" />
                <Legend className={TONES.overdue} label="Entrega vencida" />
                <Legend className={TONES.milestone} label="Hito" />
                <Legend className={TONES.done} label="Hito cumplido" />
            </div>
        </div>
    );
}

function Legend({ className, label }: { className: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={cn('size-3 rounded', className)} />
            {label}
        </span>
    );
}
