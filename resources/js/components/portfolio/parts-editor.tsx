import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { ListEditor } from '@/components/list-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Option } from '@/types';

export type PortfolioPart = {
    type: string;
    title: string | null;
    description: string | null;
    features: string[];
};

/**
 * Partes de un sistema entregado (sitio web, panel administrativo…), cada una con
 * su texto y sus funciones. Las imágenes se asignan a cada parte en la galería.
 */
export function PartsEditor({
    parts,
    types,
    errors,
    onChange,
}: {
    parts: PortfolioPart[];
    types: Option[];
    errors: Record<string, string | undefined>;
    onChange: (parts: PortfolioPart[]) => void;
}) {
    const used = new Set(parts.map((p) => p.type));
    const available = types.filter((t) => !used.has(t.value));
    const label = (type: string) =>
        types.find((t) => t.value === type)?.label ?? type;

    const set = (i: number, data: Partial<PortfolioPart>) =>
        onChange(parts.map((p, j) => (j === i ? { ...p, ...data } : p)));

    const move = (i: number, step: -1 | 1) => {
        const next = [...parts];
        [next[i], next[i + step]] = [next[i + step], next[i]];
        onChange(next);
    };

    return (
        <div className="space-y-4">
            {parts.map((part, i) => (
                <div
                    key={part.type}
                    className="space-y-4 rounded-xl border bg-card p-4"
                >
                    <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">
                            <span className="mr-2 font-mono text-xs text-muted-foreground">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            {label(part.type)}
                        </p>
                        <div className="flex">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={i === 0}
                                onClick={() => move(i, -1)}
                                aria-label={`Subir «${label(part.type)}»`}
                            >
                                <ArrowUp className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={i === parts.length - 1}
                                onClick={() => move(i, 1)}
                                aria-label={`Bajar «${label(part.type)}»`}
                            >
                                <ArrowDown className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    onChange(parts.filter((_, j) => j !== i))
                                }
                                aria-label={`Quitar «${label(part.type)}»`}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`part-${i}-title`}>
                            Título (opcional)
                        </Label>
                        <Input
                            id={`part-${i}-title`}
                            value={part.title ?? ''}
                            maxLength={80}
                            placeholder={`Ej.: ${label(part.type)} para reservar en minutos`}
                            onChange={(e) => set(i, { title: e.target.value })}
                        />
                        <InputError message={errors[`parts.${i}.title`]} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`part-${i}-desc`}>Qué hace</Label>
                        <Textarea
                            id={`part-${i}-desc`}
                            rows={3}
                            value={part.description ?? ''}
                            onChange={(e) =>
                                set(i, { description: e.target.value })
                            }
                        />
                        <InputError
                            message={errors[`parts.${i}.description`]}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`part-${i}-features`}>Funciones</Label>
                        <ListEditor
                            id={`part-${i}-features`}
                            items={part.features}
                            onChange={(v) => set(i, { features: v })}
                            placeholder="Ej.: Calendario con fechas bloqueadas"
                            addLabel="Agregar función"
                            max={30}
                        />
                        <InputError message={errors[`parts.${i}.type`]} />
                    </div>
                </div>
            ))}

            {available.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {available.map((t) => (
                        <Button
                            key={t.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onChange([
                                    ...parts,
                                    {
                                        type: t.value,
                                        title: '',
                                        description: '',
                                        features: [],
                                    },
                                ])
                            }
                        >
                            <Plus className="size-4" />
                            {t.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
