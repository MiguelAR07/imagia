import { contact, message, show, start } from '@/routes/assistant';
import type { AssistantState } from '@/types';

const STORAGE_KEY = 'imagia.assistant';
const OPEN_EVENT = 'imagia:open-assistant';

/** Abre el asistente desde cualquier botón del sitio. */
export function openAssistant(): void {
    window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenAssistant(handler: () => void): () => void {
    window.addEventListener(OPEN_EVENT, handler);

    return () => window.removeEventListener(OPEN_EVENT, handler);
}

/** El navegador recuerda la conversación para retomarla; si no hay almacenamiento, empieza de nuevo. */
export const savedConversation = {
    get(): string | null {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    },
    set(uuid: string | null): void {
        try {
            if (uuid) {
                window.localStorage.setItem(STORAGE_KEY, uuid);
            } else {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // Sin almacenamiento la conversación solo dura mientras la página esté abierta.
        }
    },
};

export class AssistantError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly fields: Record<string, string> = {},
    ) {
        super(message);
    }
}

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

async function request(
    url: string,
    method: 'GET' | 'POST',
    body?: unknown,
): Promise<AssistantState> {
    let response: Response;

    try {
        const init: RequestInit = {
            method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': xsrfToken(),
            },
            credentials: 'same-origin',
        };

        if (method === 'POST') {
            init.body = JSON.stringify(body ?? {});
        }

        response = await fetch(url, init);
    } catch {
        throw new AssistantError(
            'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
            0,
        );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const fields: Record<string, string> = {};

        for (const [key, messages] of Object.entries(data.errors ?? {})) {
            fields[key] = (messages as string[])[0];
        }

        const fallback =
            response.status === 429
                ? 'Vas muy rápido. Espera un momento e inténtalo de nuevo.'
                : response.status === 419
                  ? 'La página estuvo abierta mucho tiempo. Recárgala para continuar.'
                  : 'Algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.';

        throw new AssistantError(
            Object.values(fields)[0] ?? data.message ?? fallback,
            response.status,
            fields,
        );
    }

    return data as AssistantState;
}

export const assistantApi = {
    start: () => request(start().url, 'POST'),
    show: (uuid: string) => request(show(uuid).url, 'GET'),
    send: (uuid: string, content: string) =>
        request(message(uuid).url, 'POST', { content }),
    contact: (uuid: string, data: Record<string, unknown>) =>
        request(contact(uuid).url, 'POST', data),
};
