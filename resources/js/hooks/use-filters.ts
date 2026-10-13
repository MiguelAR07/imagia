import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Filtros de un listado sincronizados con la URL (se pueden compartir y recargar).
 * El texto de búsqueda espera 300 ms antes de consultar; los demás filtros aplican al instante.
 */
export function useFilters<T extends Record<string, string>>(
    url: string,
    initial: T,
) {
    const [filters, setFilters] = useState<T>(initial);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const apply = (next: T) => {
        const query = Object.fromEntries(
            Object.entries(next).filter(([, v]) => v !== ''),
        );
        router.get(url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const set = (key: keyof T, value: string, debounce = false) => {
        const next = { ...filters, [key]: value };
        setFilters(next);

        if (timer.current) {
            clearTimeout(timer.current);
        }

        if (debounce) {
            timer.current = setTimeout(() => apply(next), 300);
        } else {
            apply(next);
        }
    };

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    return { filters, set };
}
