import type { ReactNode } from 'react';

/** Encabezado de cada pantalla del panel: título, descripción y acciones a la derecha. */
export function PageHeader({
    title,
    description,
    eyebrow,
    actions,
}: {
    title: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 space-y-1">
                {eyebrow && (
                    <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
