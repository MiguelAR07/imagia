import { Head, router, useForm } from '@inertiajs/react';
import { Check, Package, Plus, Settings2, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney } from '@/lib/format';
import {
    destroy,
    index,
    module as updateModule,
    store,
    update,
} from '@/routes/admin/catalog/features';
import type { Option } from '@/types';

type FeatureRow = {
    id: number;
    name: string;
    description: string | null;
    plans_count: number;
    services_count: number;
    is_module: boolean;
    category: string | null;
    size: string | null;
    module_price: string | null;
    module_order: number;
    goals: string[];
};

type Options = { categories: Option[]; sizes: Option[]; goals: Option[] };

export default function FeaturesPage({
    features,
    options,
}: {
    features: FeatureRow[];
    options: Options;
}) {
    const form = useForm({ name: '', description: '' });
    const modules = features.filter((f) => f.is_module).length;

    const add = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title="Funcionalidades y módulos" />

            <p className="text-sm text-muted-foreground">
                Escribe cada funcionalidad una sola vez y asígnala a varios
                planes. Las que configures como <strong>módulo</strong> se
                venden por separado con su precio: aparecen en la calculadora de
                presupuesto del sitio ({modules}{' '}
                {modules === 1 ? 'módulo' : 'módulos'}).
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
                    <FeatureRowView key={f.id} feature={f} options={options} />
                ))}
            </ul>
        </>
    );
}

function FeatureRowView({
    feature,
    options,
}: {
    feature: FeatureRow;
    options: Options;
}) {
    const form = useForm({
        name: feature.name,
        description: feature.description ?? '',
    });
    const [editingModule, setEditingModule] = useState(false);
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
                <div className="flex flex-wrap items-center gap-2 self-center text-xs whitespace-nowrap text-muted-foreground">
                    {feature.is_module && (
                        <StatusBadge tone="brand">
                            <Package className="mr-1 inline size-3" />
                            Módulo · {formatMoney(feature.module_price, 'COP')}
                        </StatusBadge>
                    )}
                    {feature.plans_count} planes · {feature.services_count}{' '}
                    servicios
                </div>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant={editingModule ? 'secondary' : 'ghost'}
                        aria-label={`Configurar ${feature.name} como módulo`}
                        title="Configurar como módulo"
                        onClick={() => setEditingModule((v) => !v)}
                    >
                        <Settings2 className="size-4" />
                    </Button>
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
            {editingModule && (
                <ModuleForm
                    feature={feature}
                    options={options}
                    onDone={() => setEditingModule(false)}
                />
            )}
        </li>
    );
}

function ModuleForm({
    feature,
    options,
    onDone,
}: {
    feature: FeatureRow;
    options: Options;
    onDone: () => void;
}) {
    const form = useForm({
        is_module: feature.is_module,
        category: feature.category ?? '',
        size: feature.size ?? '',
        module_price: feature.module_price ?? '',
        goals: feature.goals,
        module_order: String(feature.module_order ?? 0),
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(updateModule(feature.id).url, {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    const toggleGoal = (goal: string, on: boolean) =>
        form.setData(
            'goals',
            on
                ? [...form.data.goals, goal]
                : form.data.goals.filter((g) => g !== goal),
        );

    return (
        <form
            onSubmit={submit}
            className="mx-3 mb-3 grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2 lg:col-span-4">
                <Checkbox
                    checked={form.data.is_module}
                    onCheckedChange={(c) =>
                        form.setData('is_module', c === true)
                    }
                />
                Se vende como módulo adicional
            </label>
            <div className="grid gap-1.5">
                <Label htmlFor={`m-price-${feature.id}`}>Precio (COP)</Label>
                <Input
                    id={`m-price-${feature.id}`}
                    type="number"
                    min="0"
                    step="1000"
                    value={form.data.module_price}
                    onChange={(e) =>
                        form.setData('module_price', e.target.value)
                    }
                />
                <InputError message={form.errors.module_price} />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor={`m-cat-${feature.id}`}>Categoría</Label>
                <OptionSelect
                    id={`m-cat-${feature.id}`}
                    value={form.data.category}
                    options={options.categories}
                    onChange={(v) => form.setData('category', v)}
                />
                <InputError message={form.errors.category} />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor={`m-size-${feature.id}`}>Tamaño</Label>
                <OptionSelect
                    id={`m-size-${feature.id}`}
                    value={form.data.size}
                    options={options.sizes}
                    allLabel="Sin definir"
                    onChange={(v) => form.setData('size', v)}
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor={`m-order-${feature.id}`}>
                    Prioridad en la calculadora
                </Label>
                <Input
                    id={`m-order-${feature.id}`}
                    type="number"
                    min="0"
                    value={form.data.module_order}
                    onChange={(e) =>
                        form.setData('module_order', e.target.value)
                    }
                />
                <p className="text-xs text-muted-foreground">
                    Menor número = se sugiere primero.
                </p>
            </div>
            <fieldset className="sm:col-span-2 lg:col-span-4">
                <legend className="mb-2 text-sm font-medium">
                    Se sugiere para
                </legend>
                <div className="flex flex-wrap gap-4">
                    {options.goals.map((g) => (
                        <label
                            key={g.value}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                checked={form.data.goals.includes(g.value)}
                                onCheckedChange={(c) =>
                                    toggleGoal(g.value, c === true)
                                }
                            />
                            {g.label}
                        </label>
                    ))}
                </div>
            </fieldset>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                <Button type="submit" size="sm" disabled={form.processing}>
                    Guardar módulo
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onDone}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}

FeaturesPage.layout = {
    breadcrumbs: [{ title: 'Catálogo', href: index() }],
};
