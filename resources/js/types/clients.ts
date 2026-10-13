export type ClientListItem = {
    id: number;
    name: string;
    type: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    status: string;
    contacts_count: number;
    archived: boolean;
};

export type ContactItem = {
    id: number;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    is_primary: boolean;
};

export type ClientDetail = {
    id: number;
    type: string;
    name: string;
    tax_id: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    city: string | null;
    website: string | null;
    status: string;
    notes: string | null;
    created_at: string | null;
    created_by: string | null;
    archived: boolean;
    contacts: ContactItem[];
};
