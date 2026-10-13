import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';

/**
 * Nombre de la marca en mayúsculas. Si termina en «IA», esas dos letras
 * van con el degradado de marca (IMAG·IA).
 */
export function BrandWordmark({ className }: { className?: string }) {
    const { brand } = usePage().props;
    const name = brand.name.toUpperCase();
    const endsInIa = name.endsWith('IA') && name.length > 2;

    return (
        <span
            className={cn(
                'font-display font-extrabold tracking-[0.06em] whitespace-nowrap',
                className,
            )}
        >
            {endsInIa ? (
                <>
                    {name.slice(0, -2)}
                    <span className="text-brand-gradient">IA</span>
                </>
            ) : (
                name
            )}
        </span>
    );
}
