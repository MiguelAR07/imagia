import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/** Casilla «Publicado en el sitio» con su explicación. */
export function PublishToggle({
    id,
    checked,
    onChange,
    hint = 'Si no está publicado, solo lo ves tú en el panel.',
}: {
    id: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    hint?: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(c) => onChange(c === true)}
            />
            <div className="grid gap-1">
                <Label htmlFor={id}>Publicado en el sitio</Label>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
        </div>
    );
}
