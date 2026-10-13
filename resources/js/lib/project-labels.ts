import type { Tone } from '@/components/status-badge';

/** Color fijo de cada estado de proyecto en todo el panel. */
export const PROJECT_STATUS_TONE: Record<string, Tone> = {
    planning: 'neutral',
    in_progress: 'brand',
    review: 'info',
    delivered: 'success',
    paused: 'warning',
    cancelled: 'neutral',
};

export const PRIORITY_TONE: Record<string, Tone> = {
    low: 'neutral',
    medium: 'info',
    high: 'warning',
    urgent: 'danger',
};

export const TASK_STATUS_TONE: Record<string, Tone> = {
    todo: 'neutral',
    in_progress: 'brand',
    review: 'info',
    done: 'success',
};

export function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
