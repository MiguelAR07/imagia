import type { PublicPlan } from '@/types/site';

/** Conversación del asistente tal como la devuelve el servidor. */
export type AssistantMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    quick_replies: string[];
    offer_actions: boolean;
};

export type AssistantState = {
    uuid: string;
    messages: AssistantMessage[];
    plan: PublicPlan | null;
    recommendation: string | null;
    summary: string | null;
    has_contact: boolean;
    limit_reached: boolean;
    max_length: number;
};

/** Panel: lista y detalle de conversaciones. */
export type ConversationListItem = {
    id: number;
    summary: string | null;
    recommendation: string | null;
    status: string;
    attention_status: string;
    engine: string;
    messages_count: number;
    lead: { id: number; name: string } | null;
    last_message_at: string | null;
};

export type ConversationDetail = {
    id: number;
    summary: string | null;
    recommendation: string | null;
    plan: { id: number; name: string } | null;
    status: string;
    attention_status: string;
    engine: string;
    lead: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        archived: boolean;
    } | null;
    created_at: string | null;
    last_message_at: string | null;
    messages: {
        id: number;
        role: 'user' | 'assistant';
        content: string;
        engine: string | null;
        created_at: string | null;
    }[];
};
