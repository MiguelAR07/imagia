import { usePage } from '@inertiajs/react';

/**
 * Indica si el usuario actual tiene un permiso. Solo sirve para mostrar u ocultar
 * elementos: la autorización real siempre se valida en el servidor.
 */
export function useCan(): (permission: string) => boolean {
    const { auth } = usePage().props;
    const isAdmin = auth.roles?.includes('administrador') ?? false;

    return (permission: string) =>
        isAdmin || (auth.permissions?.includes(permission) ?? false);
}
