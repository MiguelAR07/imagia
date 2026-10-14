import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Encabezado de sección del sitio: rótulo pequeño, título grande y bajada. */
export function SectionHeading({
    eyebrow,
    title,
    description,
    align = 'left',
    as: Tag = 'h2',
    className,
}: {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    align?: 'left' | 'center';
    as?: 'h1' | 'h2';
    className?: string;
}) {
    return (
        <div
            className={cn(
                'max-w-2xl space-y-3',
                align === 'center' && 'mx-auto text-center',
                className,
            )}
        >
            {eyebrow && (
                <p className="font-mono text-xs tracking-[0.16em] text-brand-cyan uppercase">
                    {eyebrow}
                </p>
            )}
            <Tag
                className={cn(
                    'font-extrabold tracking-tight',
                    Tag === 'h1'
                        ? 'text-4xl md:text-6xl'
                        : 'text-3xl md:text-4xl',
                )}
            >
                {title}
            </Tag>
            {description && (
                <p className="text-base text-muted-foreground md:text-lg">
                    {description}
                </p>
            )}
        </div>
    );
}
