import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Option } from '@/types';

/** Selector a partir de una lista de opciones `{ value, label }`. */
export function OptionSelect({
    id,
    value,
    options,
    onChange,
    placeholder = 'Elige una opción',
    allLabel,
    className,
}: {
    id?: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    /** Si se indica, agrega una opción para «todos» (valor vacío). */
    allLabel?: string;
    className?: string;
}) {
    const ALL = '__all__';

    return (
        <Select
            value={value === '' && allLabel ? ALL : value}
            onValueChange={(v) => onChange(v === ALL ? '' : v)}
        >
            <SelectTrigger id={id} className={cn('w-full', className)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
                {options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
