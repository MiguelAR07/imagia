export type Option = { value: string; label: string };

/** Respuesta paginada de Laravel (paginate()->through()). */
export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export type ActivityItem = {
    id: number;
    type: string;
    description: string;
    happened_at: string;
    user: { id: number; name: string } | null;
    is_manual: boolean;
};
