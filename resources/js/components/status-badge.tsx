import { cn } from '@/lib/utils';

export type Tone =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'brand';

const TONES: Record<Tone, string> = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/15 text-destructive-foreground',
    info: 'bg-brand-cyan/15 text-brand-cyan',
    brand: 'bg-primary/15 text-primary dark:text-[#8da3ff]',
    neutral: 'bg-muted text-muted-foreground',
};

/** Píldora de estado: cada estado tiene siempre el mismo color en todo el panel. */
export function StatusBadge({
    tone,
    children,
    className,
}: {
    tone: Tone;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                TONES[tone],
                className,
            )}
        >
            <span
                className="size-1.5 rounded-full bg-current"
                aria-hidden="true"
            />
            {children}
        </span>
    );
}
