import { Head, router, useForm } from '@inertiajs/react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { destroy, index, store, update } from '@/routes/admin/catalog/features';

type FeatureRow = {
    id: number;
    name: string;
    description: string | null;
    plans_count: number;
    services_count: number;
};

export default function FeaturesPage({ features }: { features: FeatureRow[] }) {
    const form = useForm({ name: '', description: '' });

    const add = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title="Funcionalidades" />

            <p className="text-sm text-muted-foreground">
                Escribe cada funcionalidad una sola vez y asígnala a varios
                planes. Si la renombras, cambia en todos.
            </p>

            <form
                onSubmit={add}
                className="grid gap-2 rounded-xl border border-dashed p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
                <div className="grid gap-1">
                    <Input
                        aria-label="Nueva funcionalidad"
                        placeholder="Nueva funcionalidad"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        required
                    />
                    <InputError message={form.errors.name} />
                </div>
                <Input
                    aria-label="Descripción"
                    placeholder="Descripción corta (opcional)"
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData('description', e.target.value)
                    }
                />
                <Button type="submit" disabled={form.processing}>
                    <Plus className="size-4" />
                    Agregar
                </Button>
            </form>

            <ul className="divide-y rounded-xl border bg-card">
                {features.map((f) => (
                    <FeatureRowView key={f.id} feature={f} />
                ))}
            </ul>
        </>
    );
}

function FeatureRowView({ feature }: { feature: FeatureRow }) {
    const form = useForm({
        name: feature.name,
        description: feature.description ?? '',
    });
    const usage = feature.plans_count + feature.services_count;

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.put(update(feature.id).url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <li>
            <form
                onSubmit={save}
                className="grid items-start gap-2 p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
                <div className="grid gap-1">
                    <Input
                        aria-label="Nombre"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        required
                    />
                    <InputError message={form.errors.name} />
                </div>
                <Input
                    aria-label="Descripción"
                    placeholder="Sin descripción"
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData('description', e.target.value)
                    }
                />
                <span className="self-center text-xs whitespace-nowrap text-muted-foreground">
                    {feature.plans_count} planes · {feature.services_count}{' '}
                    servicios
                </span>
                <div className="flex gap-1">
                    <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        disabled={!form.isDirty || form.processing}
                        aria-label={`Guardar ${feature.name}`}
                    >
                        <Check className="size-4" />
                    </Button>
                    <ConfirmDialog
                        trigger={
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Eliminar ${feature.name}`}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        }
                        title={`Eliminar «${feature.name}»`}
                        description={
                            usage > 0
                                ? `Se quitará de ${feature.plans_count} planes y ${feature.services_count} servicios.`
                                : 'No está en uso.'
                        }
                        confirmLabel="Eliminar"
                        destructive
                        onConfirm={(done) =>
                            router.delete(destroy(feature.id).url, {
                                preserveScroll: true,
                                onFinish: done,
                            })
                        }
                    />
                </div>
            </form>
        </li>
    );
}

FeaturesPage.layout = {
    breadcrumbs: [{ title: 'Catálogo', href: index() }],
};
