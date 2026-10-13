import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { edit, update } from '@/routes/admin/brand';
import type { AcronymItem, BrandSettings, OriginPart } from '@/types';

type FormData = {
    name: string;
    tagline: string;
    descriptor: string;
    origin: OriginPart[];
    acronym: AcronymItem[];
};

/**
 * Ajusta las filas de las siglas a las letras del nombre, conservando lo escrito.
 * El nombre solo admite letras, así que separar por caracteres es seguro.
 */
const syncAcronym = (name: string, current: AcronymItem[]): AcronymItem[] =>
    name
        .toUpperCase()
        .split('')
        .map((letter, i) => ({
            letter,
            word: current[i]?.word ?? '',
            description: current[i]?.description ?? '',
        }));

export default function BrandSettingsPage({
    settings,
}: {
    settings: BrandSettings;
}) {
    const form = useForm<FormData>({
        name: settings.name,
        tagline: settings.tagline,
        descriptor: settings.descriptor,
        origin: settings.origin,
        acronym: settings.acronym,
    });
    const errors = form.errors as Record<string, string | undefined>;

    const setName = (value: string) => {
        const clean = value.replace(/[^\p{L}]/gu, '').toUpperCase();
        form.setData((data) => ({
            ...data,
            name: clean,
            acronym: syncAcronym(clean, data.acronym),
        }));
    };

    const setAcronym = (
        i: number,
        field: 'word' | 'description',
        value: string,
    ) =>
        form.setData(
            'acronym',
            form.data.acronym.map((item, j) =>
                j === i ? { ...item, [field]: value } : item,
            ),
        );

    const setOrigin = (i: number, field: keyof OriginPart, value: string) =>
        form.setData(
            'origin',
            form.data.origin.map((item, j) =>
                j === i ? { ...item, [field]: value } : item,
            ),
        );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update().url, { preserveScroll: true });
    };

    const name = form.data.name || 'NOMBRE';
    const endsInIa = name.endsWith('IA') && name.length > 2;

    return (
        <>
            <Head title="Configuración de marca" />

            <form onSubmit={submit} className="space-y-10">
                {/* Vista previa en vivo */}
                <div className="flex flex-wrap items-center gap-5 rounded-2xl border bg-card p-6">
                    <AppLogoIcon className="size-16 text-foreground" />
                    <div className="space-y-1.5">
                        <p className="font-display text-3xl font-extrabold tracking-[0.06em]">
                            {endsInIa ? (
                                <>
                                    {name.slice(0, -2)}
                                    <span className="text-brand-gradient">
                                        IA
                                    </span>
                                </>
                            ) : (
                                name
                            )}
                        </p>
                        <p className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
                            {form.data.descriptor || 'Descriptor'}
                        </p>
                    </div>
                    <p className="w-full font-display text-lg font-semibold sm:ml-auto sm:w-auto sm:max-w-xs sm:text-right">
                        {form.data.tagline}
                    </p>
                </div>

                <fieldset className="grid gap-6 sm:grid-cols-2">
                    <legend className="mb-4 text-base font-semibold">
                        Identidad
                    </legend>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre comercial</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                            required
                            className="font-display font-bold tracking-[0.06em]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Solo letras. Las siglas de abajo se ajustan a cada
                            letra.
                        </p>
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="descriptor">Descriptor</Label>
                        <Input
                            id="descriptor"
                            value={form.data.descriptor}
                            onChange={(e) =>
                                form.setData('descriptor', e.target.value)
                            }
                            maxLength={80}
                            required
                        />
                        <InputError message={errors.descriptor} />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="tagline">Lema</Label>
                        <Input
                            id="tagline"
                            value={form.data.tagline}
                            onChange={(e) =>
                                form.setData('tagline', e.target.value)
                            }
                            maxLength={120}
                            required
                        />
                        <InputError message={errors.tagline} />
                    </div>
                </fieldset>

                <fieldset className="space-y-4">
                    <legend className="text-base font-semibold">
                        Significado de las siglas
                    </legend>
                    <p className="-mt-2 text-sm text-muted-foreground">
                        Se muestra en el inicio del panel, en el sitio público y
                        en las respuestas del asistente.
                    </p>
                    <InputError message={errors.acronym} />
                    <ol className="divide-y rounded-xl border">
                        {form.data.acronym.map((item, i) => (
                            <li
                                key={i}
                                className="grid gap-3 p-4 sm:grid-cols-[48px_200px_1fr] sm:items-start"
                            >
                                <span
                                    aria-hidden="true"
                                    className="font-display text-3xl leading-9 font-extrabold"
                                >
                                    {item.letter}
                                </span>
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor={`acronym-${i}-word`}
                                        className="sr-only"
                                    >
                                        Palabra para la letra {item.letter}
                                    </Label>
                                    <Input
                                        id={`acronym-${i}-word`}
                                        value={item.word}
                                        placeholder={`Palabra con «${item.letter}»`}
                                        onChange={(e) =>
                                            setAcronym(
                                                i,
                                                'word',
                                                e.target.value,
                                            )
                                        }
                                        maxLength={40}
                                        required
                                    />
                                    <InputError
                                        message={
                                            errors[`acronym.${i}.word`] ??
                                            errors[`acronym.${i}.letter`]
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor={`acronym-${i}-description`}
                                        className="sr-only"
                                    >
                                        Qué representa la letra {item.letter}
                                    </Label>
                                    <Textarea
                                        id={`acronym-${i}-description`}
                                        value={item.description}
                                        placeholder="Qué representa"
                                        onChange={(e) =>
                                            setAcronym(
                                                i,
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        maxLength={160}
                                        rows={2}
                                        required
                                    />
                                    <InputError
                                        message={
                                            errors[`acronym.${i}.description`]
                                        }
                                    />
                                </div>
                            </li>
                        ))}
                    </ol>
                </fieldset>

                <fieldset className="space-y-4">
                    <legend className="text-base font-semibold">
                        Origen del nombre
                    </legend>
                    <p className="-mt-2 text-sm text-muted-foreground">
                        Las palabras que se combinan para formar el nombre.
                    </p>
                    <div className="space-y-3">
                        {form.data.origin.map((item, i) => (
                            <div
                                key={i}
                                className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-start"
                            >
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor={`origin-${i}-part`}
                                        className="sr-only"
                                    >
                                        Palabra de origen {i + 1}
                                    </Label>
                                    <Input
                                        id={`origin-${i}-part`}
                                        value={item.part}
                                        placeholder="Palabra"
                                        onChange={(e) =>
                                            setOrigin(i, 'part', e.target.value)
                                        }
                                        maxLength={30}
                                        required
                                    />
                                    <InputError
                                        message={errors[`origin.${i}.part`]}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label
                                        htmlFor={`origin-${i}-meaning`}
                                        className="sr-only"
                                    >
                                        Significado {i + 1}
                                    </Label>
                                    <Input
                                        id={`origin-${i}-meaning`}
                                        value={item.meaning}
                                        placeholder="Qué aporta al nombre"
                                        onChange={(e) =>
                                            setOrigin(
                                                i,
                                                'meaning',
                                                e.target.value,
                                            )
                                        }
                                        maxLength={80}
                                        required
                                    />
                                    <InputError
                                        message={errors[`origin.${i}.meaning`]}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Quitar «${item.part || 'palabra'}»`}
                                    onClick={() =>
                                        form.setData(
                                            'origin',
                                            form.data.origin.filter(
                                                (_, j) => j !== i,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    {form.data.origin.length < 5 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                form.setData('origin', [
                                    ...form.data.origin,
                                    { part: '', meaning: '' },
                                ])
                            }
                        >
                            <Plus className="size-4" />
                            Agregar palabra
                        </Button>
                    )}
                </fieldset>

                <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t bg-background/90 px-4 py-4 backdrop-blur md:-mx-6 md:px-6">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                    {form.isDirty && !form.processing && (
                        <span className="text-sm text-muted-foreground">
                            Tienes cambios sin guardar
                        </span>
                    )}
                </div>
            </form>
        </>
    );
}

BrandSettingsPage.layout = {
    breadcrumbs: [{ title: 'Configuración', href: edit() }],
};
