import type { Tone } from '@/components/status-badge';

/** Seguimiento de las conversaciones del asistente: mismo color en todo el panel. */
export const ATTENTION_TONE: Record<string, Tone> = {
    new: 'brand',
    in_review: 'warning',
    attended: 'success',
};

export const CONVERSATION_STATUS_TONE: Record<string, Tone> = {
    open: 'neutral',
    converted: 'info',
    closed: 'neutral',
};

export const ENGINE_LABELS: Record<string, string> = {
    ai: 'Con IA',
    rules: 'Flujo guiado',
};
