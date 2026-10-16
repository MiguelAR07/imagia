export type QuoteListItem = {
    id: number;
    number: string;
    title: string;
    recipient: string | null;
    status: string;
    total: string;
    currency: string;
    valid_until: string | null;
    past_validity: boolean;
    created_at: string | null;
};

export type QuoteLine = {
    id: number;
    description: string;
    details: string | null;
    quantity: string;
    unit_price: string;
    discount_percent: string;
    tax: string | null;
    line_total: number;
};

export type QuoteDetail = {
    id: number;
    number: string;
    title: string;
    scope: string | null;
    status: string;
    currency: string;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total: string;
    payment_terms: string | null;
    exclusions: string | null;
    notes: string | null;
    valid_until: string | null;
    sent_at: string | null;
    accepted_at: string | null;
    created_at: string | null;
    created_by: string | null;
    recipient: string | null;
    client: { id: number; name: string } | null;
    lead: { id: number; name: string; client_id: number | null } | null;
    plan: { id: number; name: string } | null;
    project: { id: number; name: string } | null;
    editable: boolean;
    past_validity: boolean;
    public_url: string | null;
    recipient_phone: string | null;
    recipient_email: string | null;
    deposit: {
        percent: number;
        amount: number;
        link: {
            status: 'pending' | 'paid' | 'cancelled';
            paid_at: string | null;
            last_transaction_status: string | null;
        } | null;
    };
    items: QuoteLine[];
};

export type TaxOption = {
    value: string;
    label: string;
    rate: number;
    is_default: boolean;
};
