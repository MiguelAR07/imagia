import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Lista editable de textos cortos (beneficios, viñetas). */
export function ListEditor({
    id,
    items,
    onChange,
    placeholder,
    addLabel = 'Agregar',
    max = 10,
}: {
    id: string;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    addLabel?: string;
    max?: number;
}) {
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                    <Input
                        id={i === 0 ? id : undefined}
                        aria-label={`Elemento ${i + 1}`}
                        value={item}
                        placeholder={placeholder}
                        onChange={(e) =>
                            onChange(
                                items.map((v, j) =>
                                    j === i ? e.target.value : v,
                                ),
                            )
                        }
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar elemento ${i + 1}`}
                        onClick={() =>
                            onChange(items.filter((_, j) => j !== i))
                        }
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            ))}
            {items.length < max && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...items, ''])}
                >
                    <Plus className="size-4" />
                    {addLabel}
                </Button>
            )}
        </div>
    );
}
