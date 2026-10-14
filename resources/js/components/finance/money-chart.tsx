import { formatMoney } from '@/lib/format';
import type { MonthlyPoint } from '@/types';

const MONTHS = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
];

const monthLabel = (month: string) => {
    const [year, m] = month.split('-').map(Number);

    return `${MONTHS[m - 1]} ${String(year).slice(2)}`;
};

/**
 * Barras de recibido (azul) y gastos (gris) por mes. Para lectores de pantalla,
 * los mismos datos van en una tabla oculta.
 */
export function MoneyChart({
    data,
    currency,
}: {
    data: MonthlyPoint[];
    currency: string;
}) {
    const max = Math.max(1, ...data.flatMap((d) => [d.received, d.expenses]));
    const empty = data.every((d) => d.received === 0 && d.expenses === 0);

    if (empty) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                Cuando registres pagos o gastos verás aquí cómo van mes a mes.
            </p>
        );
    }

    return (
        <figure>
            <div
                aria-hidden="true"
                className="flex h-44 items-end gap-1.5 sm:gap-3"
            >
                {data.map((d) => (
                    <div
                        key={d.month}
                        className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                        title={`${monthLabel(d.month)} · Recibido ${formatMoney(d.received, currency)} · Gastos ${formatMoney(d.expenses, currency)}`}
                    >
                        <div className="flex h-full items-end justify-center gap-0.5">
                            <span
                                className="w-full max-w-4 rounded-t bg-gradient-to-t from-[#3b5bff] to-[#22d3ee] transition-opacity group-hover:opacity-80"
                                style={{
                                    height: `${(d.received / max) * 100}%`,
                                }}
                            />
                            <span
                                className="w-full max-w-4 rounded-t bg-muted-foreground/35"
                                style={{
                                    height: `${(d.expenses / max) * 100}%`,
                                }}
                            />
                        </div>
                        <span className="mt-2 truncate text-center font-mono text-[10px] text-muted-foreground">
                            {monthLabel(d.month)}
                        </span>
                    </div>
                ))}
            </div>
            <figcaption className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-[#3b5bff]" />
                    Recibido
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-muted-foreground/35" />
                    Gastos
                </span>
            </figcaption>
            <table className="sr-only">
                <caption>Recibido y gastos por mes ({currency})</caption>
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th>Recibido</th>
                        <th>Gastos</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.month}>
                            <td>{monthLabel(d.month)}</td>
                            <td>{formatMoney(d.received, currency)}</td>
                            <td>{formatMoney(d.expenses, currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

/** Tarjeta de un indicador de dinero. */
export function MoneyStat({
    label,
    value,
    currency,
    hint,
    tone = 'default',
}: {
    label: string;
    value: number;
    currency: string;
    hint?: string;
    tone?: 'default' | 'positive' | 'negative' | 'brand';
}) {
    const color = {
        default: '',
        positive: 'text-success',
        negative: 'text-destructive-foreground',
        brand: 'text-brand-gradient',
    }[tone];

    return (
        <div className="bg-card p-5">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                {label}
            </p>
            <p
                className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${color}`}
            >
                {formatMoney(value, currency)}
            </p>
            {hint && (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}
