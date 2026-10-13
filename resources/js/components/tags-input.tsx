import { X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';

/** Etiquetas (tecnologías, palabras clave). Enter o coma para agregar; sugiere las existentes. */
export function TagsInput({
    id,
    value,
    onChange,
    suggestions = [],
    placeholder = 'Escribe y presiona Enter',
    max = 20,
}: {
    id: string;
    value: string[];
    onChange: (value: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    max?: number;
}) {
    const [text, setText] = useState('');
    const listId = useId();

    const add = (raw: string) => {
        const tag = raw.trim().replace(/,$/, '');

        if (
            tag &&
            !value.some((v) => v.toLowerCase() === tag.toLowerCase()) &&
            value.length < max
        ) {
            onChange([...value, tag]);
        }

        setText('');
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(text);
        } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
            {value.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
                >
                    {tag}
                    <button
                        type="button"
                        aria-label={`Quitar ${tag}`}
                        onClick={() => onChange(value.filter((t) => t !== tag))}
                        className="rounded hover:text-destructive-foreground"
                    >
                        <X className="size-3" />
                    </button>
                </span>
            ))}
            <Input
                id={id}
                list={listId}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => text.trim() && add(text)}
                placeholder={value.length === 0 ? placeholder : ''}
                className="h-7 min-w-32 flex-1 border-0 px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <datalist id={listId}>
                {suggestions
                    .filter((s) => !value.includes(s))
                    .map((s) => (
                        <option key={s} value={s} />
                    ))}
            </datalist>
        </div>
    );
}
