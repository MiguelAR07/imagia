import { cn } from '@/lib/utils';

/** Barra de avance. Si el valor es manual, lo indica para no confundirlo con el calculado. */
export function ProgressBar({
    value,
    manual = false,
    className,
    showLabel = true,
}: {
    value: number;
    manual?: boolean;
    className?: string;
    showLabel?: boolean;
}) {
    const pct = Math.max(0, Math.min(100, value));

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={manual ? 'Avance (manual)' : 'Avance según tareas'}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-[width] duration-500',
                        pct === 100
                            ? 'bg-success'
                            : 'bg-gradient-to-r from-brand-blue to-brand-cyan',
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && (
                <span className="w-12 text-right font-mono text-xs text-muted-foreground tabular-nums">
                    {pct}%
                    {manual && <span title="Avance fijado a mano">*</span>}
                </span>
            )}
        </div>
    );
}
