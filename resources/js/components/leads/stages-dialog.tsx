import { router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { STAGE_COLORS, stageDot } from '@/lib/stage-colors';
import { cn } from '@/lib/utils';
import { destroy, reorder, store, update } from '@/routes/admin/stages';
import type { Stage } from '@/types';

const COLOR_OPTIONS = Object.entries(STAGE_COLORS).map(([value, c]) => ({
    value,
    label: c.label,
}));

const KIND_OPTIONS = [
    { value: 'open', label: 'En curso' },
    { value: 'won', label: 'Ganado' },
    { value: 'lost', label: 'Perdido' },
];

const kindOf = (s: Stage) => (s.is_won ? 'won' : s.is_lost ? 'lost' : 'open');

/** Editar las etapas del embudo: nombre, color, tipo, orden. */
export function StagesDialog({
    stages,
    onClose,
}: {
    stages: Stage[];
    onClose: () => void;
}) {
    const move = (index: number, delta: number) => {
        const ids = stages.map((s) => s.id);
        const [moved] = ids.splice(index, 1);
        ids.splice(index + delta, 0, moved);
        router.put(
            reorder().url,
            { ids },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Etapas del embudo</DialogTitle>
                    <DialogDescription>
                        Las etapas «Ganado» y «Perdido» marcan el cierre de una
                        oportunidad. Solo puedes eliminar etapas vacías.
                    </DialogDescription>
                </DialogHeader>

                <ol className="space-y-2">
                    {stages.map((stage, i) => (
                        <StageRow
                            key={stage.id}
                            stage={stage}
                            canUp={i > 0}
                            canDown={i < stages.length - 1}
                            onUp={() => move(i, -1)}
                            onDown={() => move(i, 1)}
                        />
                    ))}
                </ol>

                <NewStage />
            </DialogContent>
        </Dialog>
    );
}

function StageRow({
    stage,
    canUp,
    canDown,
    onUp,
    onDown,
}: {
    stage: Stage;
    canUp: boolean;
    canDown: boolean;
    onUp: () => void;
    onDown: () => void;
}) {
    const form = useForm({
        name: stage.name,
        color: stage.color,
        kind: kindOf(stage),
    });
    const save = (data: Partial<typeof form.data>) => {
        form.transform((d) => ({ ...d, ...data }));
        form.put(update(stage.id).url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <li className="grid grid-cols-[auto_1fr] items-start gap-2 rounded-lg border p-2 sm:grid-cols-[auto_1fr_120px_120px_auto]">
            <div className="flex flex-col">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    disabled={!canUp}
                    onClick={onUp}
                    aria-label={`Subir «${stage.name}»`}
                >
                    <ArrowUp className="size-3.5" />
                </Button>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    disabled={!canDown}
                    onClick={onDown}
                    aria-label={`Bajar «${stage.name}»`}
                >
                    <ArrowDown className="size-3.5" />
                </Button>
            </div>
            <div className="grid gap-1">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'size-2.5 shrink-0 rounded-full',
                            stageDot(form.data.color),
                        )}
                    />
                    <Input
                        aria-label="Nombre de la etapa"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        onBlur={() => form.isDirty && save({})}
                        maxLength={60}
                    />
                </div>
                <InputError message={form.errors.name} />
            </div>
            <OptionSelect
                value={form.data.color}
                options={COLOR_OPTIONS}
                onChange={(v) => {
                    form.setData('color', v);
                    save({ color: v });
                }}
                className="col-start-2 sm:col-start-auto"
            />
            <OptionSelect
                value={form.data.kind}
                options={KIND_OPTIONS}
                onChange={(v) => {
                    form.setData('kind', v);
                    save({ kind: v });
                }}
                className="col-start-2 sm:col-start-auto"
            />
            <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Eliminar «${stage.name}»`}
                className="col-start-2 justify-self-end sm:col-start-auto"
                onClick={() =>
                    router.delete(destroy(stage.id).url, {
                        preserveScroll: true,
                        preserveState: true,
                    })
                }
            >
                <Trash2 className="size-4" />
            </Button>
        </li>
    );
}

function NewStage() {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', color: 'slate', kind: 'open' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };

    if (!open) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
            >
                <Plus className="size-4" />
                Agregar etapa
            </Button>
        );
    }

    return (
        <form
            onSubmit={submit}
            className="flex flex-wrap items-start gap-2 rounded-lg border border-dashed p-2"
        >
            <div className="grid min-w-48 flex-1 gap-1">
                <Input
                    aria-label="Nombre de la nueva etapa"
                    placeholder="Nombre de la etapa"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    autoFocus
                    required
                />
                <InputError message={form.errors.name} />
            </div>
            <OptionSelect
                value={form.data.color}
                options={COLOR_OPTIONS}
                onChange={(v) => form.setData('color', v)}
                className="w-32"
            />
            <OptionSelect
                value={form.data.kind}
                options={KIND_OPTIONS}
                onChange={(v) => form.setData('kind', v)}
                className="w-32"
            />
            <Button type="submit" disabled={form.processing}>
                Agregar
            </Button>
        </form>
    );
}
