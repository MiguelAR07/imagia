export type Stage = {
    id: number;
    name: string;
    color: string;
    is_won: boolean;
    is_lost: boolean;
};

export type LeadCard = {
    id: number;
    name: string;
    company: string | null;
    source: string;
    need_excerpt: string;
    pipeline_stage_id: number;
    assignee: { id: number; name: string } | null;
    next_follow_up_at: string | null;
    follow_up_overdue: boolean;
    is_client: boolean;
    created_at: string | null;
};

export type LeadDetail = LeadCard & {
    email: string | null;
    phone: string | null;
    need: string | null;
    budget_range: string | null;
    urgency: string | null;
    assigned_to: number | null;
    lost_reason: string | null;
    consent_at: string | null;
    last_contacted_at: string | null;
    client: { id: number; name: string } | null;
    archived: boolean;
};
