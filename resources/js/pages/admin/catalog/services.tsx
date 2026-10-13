import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import { ListEditor } from '@/components/list-editor';
import { PublishToggle } from '@/components/publish-toggle';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { reorder } from '@/lib/reorder';
import { SERVICE_ICONS, serviceIcon } from '@/lib/service-icons';
import { cn } from '@/lib/utils';
import {
    destroy,
    index,
    reorder as reorderRoute,
    store,
    update,
} from '@/routes/admin/catalog/services';

type ServiceRow = {
    id: number;
    name: string;
    slug: string;
    summary: string;
    description: string | null;
    icon: string | null;
    is_published: boolean;
    plans_count: number;
    benefits: string[];
    feature_ids: number[];
};

type Props = {
    services: ServiceRow[];
    features: { id: number; name: string }[];
    icons: string[];
};

export default function ServicesPage({ services, features, icons }: Props) {
    const [editing, setEditing] = useState<ServiceRow | 'new' | null>(null);
    const ids = services.map((s) => s.id);

    return (
        <>
            <Head title="Servicios" />

            <div className="flex justify-end">
                <Button onClick={() => setEditing('new')}>
                    <Plus className="size-4" />
                    Nuevo servicio
                </Button>
            </div>

            <ol className="divide-y rounded-xl border bg-card">
                {services.length === 0 && (
                    <li className="p-6 text-sm text-muted-foreground">
                        Aún no hay servicios.
                    </li>
                )}
                {services.map((s, i) => {
                    const Icon = serviceIcon(s.icon);

                    return (
                        <li key={s.id} className="flex items-start gap-4 p-4">
                            <div className="flex flex-col">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6"
                                    disabled={i === 0}
                                    aria-label={`Subir ${s.name}`}
                                    onClick={() =>
                                        reorder(reorderRoute().url, ids, i, -1)
                                    }
                                >
                                    <ArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6"
                                    disabled={i === services.length - 1}
                                    aria-label={`Bajar ${s.name}`}
                                    onClick={() =>
                                        reorder(reorderRoute().url, ids, i, 1)
                                    }
                                >
                                    <ArrowDown className="size-3.5" />
                                </Button>
                            </div>
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Icon className="size-5 text-primary dark:text-[#8da3ff]" />
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">{s.name}</p>
                                    {s.is_published ? (
                                        <StatusBadge tone="success">
                                            Publicado
                                        </StatusBadge>
                                    ) : (
                                        <StatusBadge tone="neutral">
                                            Borrador
                                        </StatusBadge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {s.summary}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {s.feature_ids.length} funcionalidades ·{' '}
                                    {s.benefits.length} beneficios ·{' '}
                                    {s.plans_count} planes
                                </p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Editar ${s.name}`}
                                    onClick={() => setEditing(s)}
                                >
                                    <Pencil className="size-4" />
                                </Button>
                                <ConfirmDialog
                                    trigger={
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            aria-label={`Eliminar ${s.name}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    }
                                    title={`Eliminar «${s.name}»`}
                                    description={
                                        s.plans_count > 0
                                            ? `Tiene ${s.plans_count} planes asociados: quedarán sin servicio, pero no se borran.`
                                            : 'Se eliminará del catálogo.'
                                    }
                                    confirmLabel="Eliminar"
                                    destructive
                                    onConfirm={(done) =>
                                        router.delete(destroy(s.id).url, {
                                            preserveScroll: true,
                                            onFinish: done,
                                        })
                                    }
                                />
                            </div>
                        </li>
                    );
                })}
            </ol>

            {editing && (
                <ServiceDialog
                    key={editing === 'new' ? 'new' : editing.id}
                    service={editing === 'new' ? undefined : editing}
                    features={features}
                    icons={icons}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function ServiceDialog({
    service,
    features,
    icons,
    onClose,
}: {
    service?: ServiceRow;
    features: { id: number; name: string }[];
    icons: string[];
    onClose: () => void;
}) {
    const form = useForm({
        name: service?.name ?? '',
        summary: service?.summary ?? '',
        description: service?.description ?? '',
        icon: service?.icon ?? 'Rocket',
        benefits: service?.benefits ?? [],
        feature_ids: service?.feature_ids ?? [],
        is_published: service?.is_published ?? false,
    });
    const errors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };

        if (service) {
            form.put(update(service.id).url, opts);
        } else {
            form.post(store().url, opts);
        }
    };

    const toggleFeature = (id: number, on: boolean) =>
        form.setData(
            'feature_ids',
            on
                ? [...form.data.feature_ids, id]
                : form.data.feature_ids.filter((f) => f !== id),
        );

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {service ? 'Editar servicio' : 'Nuevo servicio'}
                        </DialogTitle>
                    </DialogHeader>
                    <FormField
                        id="service-name"
                        label="Nombre"
                        error={form.errors.name}
                    >
                        <Input
                            id="service-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                            autoFocus
                        />
                    </FormField>
                    <FormField
                        id="service-summary"
                        label="Resumen"
                        hint="Una frase. Aparece en las tarjetas del sitio."
                        error={form.errors.summary}
                    >
                        <Input
                            id="service-summary"
                            value={form.data.summary}
                            maxLength={300}
                            onChange={(e) =>
                                form.setData('summary', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    <FormField
                        id="service-description"
                        label="Descripción"
                        error={form.errors.description}
                    >
                        <Textarea
                            id="service-description"
                            rows={3}
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                    </FormField>
                    <div className="grid gap-2">
                        <span className="text-sm font-medium">Ícono</span>
                        <div
                            role="radiogroup"
                            aria-label="Ícono"
                            className="flex flex-wrap gap-2"
                        >
                            {icons.map((name) => {
                                const Icon = SERVICE_ICONS[name];

                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        role="radio"
                                        aria-checked={form.data.icon === name}
                                        aria-label={name}
                                        onClick={() =>
                                            form.setData('icon', name)
                                        }
                                        className={cn(
                                            'flex size-10 items-center justify-center rounded-lg border transition-colors',
                                            form.data.icon === name
                                                ? 'border-primary bg-primary/10'
                                                : 'hover:bg-accent',
                                        )}
                                    >
                                        {Icon && <Icon className="size-5" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <FormField
                        id="service-benefits"
                        label="Beneficios"
                        hint="Qué gana el cliente. Uno por línea."
                        error={errors.benefits}
                    >
                        <ListEditor
                            id="service-benefits"
                            items={form.data.benefits}
                            onChange={(v) => form.setData('benefits', v)}
                            placeholder="Ej.: Recibe solicitudes las 24 horas"
                            addLabel="Agregar beneficio"
                        />
                    </FormField>
                    <fieldset className="grid gap-2">
                        <legend className="mb-2 text-sm font-medium">
                            Funcionalidades típicas
                        </legend>
                        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                            {features.map((f) => (
                                <label
                                    key={f.id}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={form.data.feature_ids.includes(
                                            f.id,
                                        )}
                                        onCheckedChange={(c) =>
                                            toggleFeature(f.id, c === true)
                                        }
                                    />
                                    {f.name}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <PublishToggle
                        id="service-published"
                        checked={form.data.is_published}
                        onChange={(v) => form.setData('is_published', v)}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Guardando…' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

ServicesPage.layout = {
    breadcrumbs: [{ title: 'Catálogo', href: index() }],
};
