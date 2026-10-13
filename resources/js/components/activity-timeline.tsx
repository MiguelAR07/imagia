import { router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Mail,
    MessageCircle,
    Phone,
    Settings2,
    StickyNote,
    Trash2,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime, formatRelative } from '@/lib/format';
import { destroy, store } from '@/routes/admin/activities';
import type { ActivityItem, Option } from '@/types';

const ICONS: Record<string, LucideIcon> = {
    note: StickyNote,
    call: Phone,
    email: Mail,
    meeting: Users,
    whatsapp: MessageCircle,
    status_change: CalendarClock,
    system: Settings2,
};

/**
 * Historial de un registro con formulario para agregar notas o interacciones.
 * `subjectType` es el segmento de la URL: «clientes», «prospectos» o «proyectos».
 */
export function ActivityTimeline({
    subjectType,
    subjectId,
    activities,
    types,
    canWrite,
}: {
    subjectType: string;
    subjectId: number;
    activities: ActivityItem[];
    types: Option[];
    canWrite: boolean;
}) {
    const { auth } = usePage().props;
    const isAdmin = auth.roles.includes('administrador');
    const form = useForm({ type: 'note', description: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store({ subjectType, subjectId }).url, {
            preserveScroll: true,
            onSuccess: () => form.reset('description'),
        });
    };

    const typeLabel = (type: string) =>
        types.find((t) => t.value === type)?.label ??
        (type === 'status_change' ? 'Cambio de estado' : 'Sistema');

    return (
        <div className="space-y-5">
            {canWrite && (
                <form
                    onSubmit={submit}
                    className="space-y-3 rounded-xl border bg-card p-4"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <label
                            htmlFor="activity-type"
                            className="text-sm font-medium"
                        >
                            Registrar
                        </label>
                        <OptionSelect
                            id="activity-type"
                            value={form.data.type}
                            options={types}
                            onChange={(v) => form.setData('type', v)}
                            className="h-8 w-40"
                        />
                    </div>
                    <Textarea
                        aria-label="Detalle"
                        value={form.data.description}
                        onChange={(e) =>
                            form.setData('description', e.target.value)
                        }
                        placeholder="Qué pasó o qué se acordó…"
                        rows={3}
                        maxLength={5000}
                        required
                    />
                    <InputError message={form.errors.description} />
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                form.processing || !form.data.description.trim()
                            }
                        >
                            {form.processing
                                ? 'Guardando…'
                                : 'Agregar al historial'}
                        </Button>
                    </div>
                </form>
            )}

            {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Todavía no hay registros en el historial.
                </p>
            ) : (
                <ol className="relative space-y-5 border-l pl-6">
                    {activities.map((a) => {
                        const Icon = ICONS[a.type] ?? Settings2;
                        const canDelete =
                            a.is_manual &&
                            (isAdmin || a.user?.id === auth.user.id);

                        return (
                            <li key={a.id} className="relative">
                                <span className="absolute top-0.5 -left-[35px] flex size-6 items-center justify-center rounded-full border bg-background">
                                    <Icon className="size-3.5 text-muted-foreground" />
                                </span>
                                <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {typeLabel(a.type)}
                                    </span>
                                    {a.user && <span>· {a.user.name}</span>}
                                    <time
                                        dateTime={a.happened_at}
                                        title={formatDateTime(a.happened_at)}
                                    >
                                        · {formatRelative(a.happened_at)}
                                    </time>
                                    {canDelete && (
                                        <ConfirmDialog
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="ml-auto rounded p-1 hover:bg-accent"
                                                    aria-label="Eliminar registro"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            }
                                            title="Eliminar registro"
                                            description="Se quitará del historial. Esta acción no se puede deshacer."
                                            confirmLabel="Eliminar"
                                            destructive
                                            onConfirm={(done) =>
                                                router.delete(
                                                    destroy(a.id).url,
                                                    {
                                                        preserveScroll: true,
                                                        onFinish: done,
                                                    },
                                                )
                                            }
                                        />
                                    )}
                                </div>
                                <p className="mt-1 text-sm whitespace-pre-line">
                                    {a.description}
                                </p>
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}
