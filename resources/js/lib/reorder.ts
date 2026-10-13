import { router } from '@inertiajs/react';

/** Mueve un elemento una posición arriba (-1) o abajo (+1) y guarda el nuevo orden. */
export function reorder(
    url: string,
    ids: number[],
    index: number,
    delta: number,
): void {
    const next = [...ids];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    router.put(
        url,
        { ids: next },
        { preserveScroll: true, preserveState: true },
    );
}
