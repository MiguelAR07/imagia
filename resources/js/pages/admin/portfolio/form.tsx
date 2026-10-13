import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Copy,
    Eye,
    EyeOff,
    ImagePlus,
    Lock,
    Plus,
    ShieldCheck,
    Star,
    Trash2,
    Upload,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { ListEditor } from '@/components/list-editor';
import { OptionSelect } from '@/components/option-select';
import { StatusBadge } from '@/components/status-badge';
import { TagsInput } from '@/components/tags-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    cover,
    destroy,
    duplicate,
    edit,
    index,
    publish,
    store,
    update,
} from '@/routes/admin/portfolio';
import {
    destroy as destroyImage,
    store as storeImages,
} from '@/routes/admin/portfolio/images';
import type { Option } from '@/types';

type TestimonialForm = {
    author_name: string;
    author_role: string | null;
    quote: string;
    authorized_at: string | null;
    authorization_note: string | null;
    is_published: boolean;
};

type Item = {
    id: number;
    title: string;
    slug: string;
    client_id: number | null;
    client_display_name: string | null;
    client_name_authorized: boolean;
    category: string;
    summary: string;
    problem: string | null;
    solution: string | null;
    public_url: string | null;
    status: string;
    is_confidential: boolean;
    is_featured: boolean;
    highlights: string[];
    completed_on: string | null;
    technologies: string[];
    cover_url: string | null;
    images: { id: number; url: string; caption: string | null }[];
    testimonials: TestimonialForm[];
    is_public: boolean;
};

type Props = {
    item: Item | null;
    categories: Option[];
    clients: Option[];
    technologies: string[];
};

export default function PortfolioForm({
    item,
    categories,
    clients,
    technologies,
}: Props) {
    const form = useForm({
        title: item?.title ?? '',
        client_id: item?.client_id ? String(item.client_id) : '',
        client_display_name: item?.client_display_name ?? '',
        client_name_authorized: item?.client_name_authorized ?? false,
        category: item?.category ?? 'website',
        summary: item?.summary ?? '',
        problem: item?.problem ?? '',
        solution: item?.solution ?? '',
        highlights: item?.highlights ?? [],
        technologies: item?.technologies ?? [],
        completed_on: item?.completed_on ?? '',
        public_url: item?.public_url ?? '',
        is_confidential: item?.is_confidential ?? false,
        is_featured: item?.is_featured ?? false,
        testimonials: item?.testimonials ?? ([] as TestimonialForm[]),
    });
    const errors = form.errors as Record<string, string | undefined>;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Portafolio', href: index() },
            {
                title: item ? item.title : 'Nuevo proyecto',
                href: item ? edit(item.id) : index(),
            },
        ],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (item) {
            form.put(update(item.id).url, { preserveScroll: true });
        } else {
            form.post(store().url);
        }
    };

    const setTestimonial = (i: number, data: Partial<TestimonialForm>) =>
        form.setData(
            'testimonials',
            form.data.testimonials.map((t, j) =>
                j === i ? { ...t, ...data } : t,
            ),
        );

    return (
        <>
            <Head title={item ? item.title : 'Nuevo proyecto del portafolio'} />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Volver al portafolio
                </Link>

                <form
                    onSubmit={submit}
                    className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]"
                >
                    <div className="space-y-10">
                        <fieldset className="grid gap-5 sm:grid-cols-2">
                            <legend className="mb-4 text-base font-semibold">
                                El proyecto
                            </legend>
                            <FormField
                                id="pf-title"
                                label="Nombre"
                                error={errors.title}
                                className="sm:col-span-2"
                            >
                                <Input
                                    id="pf-title"
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData('title', e.target.value)
                                    }
                                    required
                                />
                            </FormField>
                            <FormField
                                id="pf-category"
                                label="Categoría"
                                error={errors.category}
                            >
                                <OptionSelect
                                    id="pf-category"
                                    value={form.data.category}
                                    options={categories}
                                    onChange={(v) =>
                                        form.setData('category', v)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="pf-date"
                                label="Fecha de realización"
                                error={errors.completed_on}
                            >
                                <Input
                                    id="pf-date"
                                    type="date"
                                    value={form.data.completed_on}
                                    onChange={(e) =>
                                        form.setData(
                                            'completed_on',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                id="pf-summary"
                                label="Descripción corta"
                                hint="Aparece en la tarjeta del portafolio."
                                error={errors.summary}
                                className="sm:col-span-2"
                            >
                                <Input
                                    id="pf-summary"
                                    value={form.data.summary}
                                    maxLength={300}
                                    onChange={(e) =>
                                        form.setData('summary', e.target.value)
                                    }
                                    required
                                />
                            </FormField>
                            <FormField
                                id="pf-problem"
                                label="El problema"
                                hint="¿Qué necesitaba resolver el cliente?"
                                error={errors.problem}
                            >
                                <Textarea
                                    id="pf-problem"
                                    rows={4}
                                    value={form.data.problem}
                                    onChange={(e) =>
                                        form.setData('problem', e.target.value)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="pf-solution"
                                label="La solución"
                                hint="¿Qué desarrollaste y cómo ayudó?"
                                error={errors.solution}
                            >
                                <Textarea
                                    id="pf-solution"
                                    rows={4}
                                    value={form.data.solution}
                                    onChange={(e) =>
                                        form.setData('solution', e.target.value)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="pf-highlights"
                                label="Funcionalidades principales"
                                error={errors.highlights}
                                className="sm:col-span-2"
                            >
                                <ListEditor
                                    id="pf-highlights"
                                    items={form.data.highlights}
                                    onChange={(v) =>
                                        form.setData('highlights', v)
                                    }
                                    placeholder="Ej.: Agenda en línea con recordatorios"
                                    addLabel="Agregar funcionalidad"
                                    max={15}
                                />
                            </FormField>
                            <FormField
                                id="pf-tech"
                                label="Tecnologías"
                                error={errors.technologies}
                                className="sm:col-span-2"
                            >
                                <TagsInput
                                    id="pf-tech"
                                    value={form.data.technologies}
                                    onChange={(v) =>
                                        form.setData('technologies', v)
                                    }
                                    suggestions={technologies}
                                    placeholder="Laravel, React, MySQL…"
                                />
                            </FormField>
                            <FormField
                                id="pf-url"
                                label="Enlace público"
                                hint="Si el proyecto está en línea."
                                error={errors.public_url}
                                className="sm:col-span-2"
                            >
                                <Input
                                    id="pf-url"
                                    type="url"
                                    placeholder="https://"
                                    value={form.data.public_url}
                                    onChange={(e) =>
                                        form.setData(
                                            'public_url',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                        </fieldset>

                        <fieldset className="grid gap-5 sm:grid-cols-2">
                            <legend className="mb-4 text-base font-semibold">
                                Cliente
                            </legend>
                            <FormField
                                id="pf-client"
                                label="Cliente (interno)"
                                hint="Solo para tu referencia."
                                error={errors.client_id}
                            >
                                <OptionSelect
                                    id="pf-client"
                                    value={form.data.client_id}
                                    options={clients}
                                    allLabel="Sin cliente"
                                    onChange={(v) =>
                                        form.setData('client_id', v)
                                    }
                                />
                            </FormField>
                            <FormField
                                id="pf-client-name"
                                label="Nombre a mostrar"
                                hint="Si queda vacío se usa el nombre del cliente."
                                error={errors.client_display_name}
                            >
                                <Input
                                    id="pf-client-name"
                                    value={form.data.client_display_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'client_display_name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <div className="flex items-start gap-3 rounded-lg border p-3 sm:col-span-2">
                                <Checkbox
                                    id="pf-client-ok"
                                    checked={form.data.client_name_authorized}
                                    onCheckedChange={(c) =>
                                        form.setData(
                                            'client_name_authorized',
                                            c === true,
                                        )
                                    }
                                />
                                <div className="grid gap-1">
                                    <Label htmlFor="pf-client-ok">
                                        El cliente autorizó mostrar su nombre
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Si no lo marcas, el sitio no mostrará
                                        quién es el cliente.
                                    </p>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="space-y-3">
                            <legend className="text-base font-semibold">
                                Testimonios
                            </legend>
                            <p className="-mt-1 text-sm text-muted-foreground">
                                Solo testimonios reales. Para publicarlos
                                registra cuándo te autorizó el cliente.
                            </p>
                            {form.data.testimonials.map((t, i) => (
                                <div
                                    key={i}
                                    className="space-y-3 rounded-xl border p-4"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input
                                            aria-label="Nombre de quien da el testimonio"
                                            placeholder="Nombre"
                                            value={t.author_name}
                                            onChange={(e) =>
                                                setTestimonial(i, {
                                                    author_name: e.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            aria-label="Cargo"
                                            placeholder="Cargo o empresa (opcional)"
                                            value={t.author_role ?? ''}
                                            onChange={(e) =>
                                                setTestimonial(i, {
                                                    author_role: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <Textarea
                                        aria-label="Testimonio"
                                        placeholder="Lo que dijo, tal cual"
                                        rows={3}
                                        value={t.quote}
                                        onChange={(e) =>
                                            setTestimonial(i, {
                                                quote: e.target.value,
                                            })
                                        }
                                    />
                                    <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                                        <div className="grid gap-1">
                                            <Label
                                                htmlFor={`t-auth-${i}`}
                                                className="text-xs"
                                            >
                                                Fecha de autorización
                                            </Label>
                                            <Input
                                                id={`t-auth-${i}`}
                                                type="date"
                                                value={t.authorized_at ?? ''}
                                                onChange={(e) =>
                                                    setTestimonial(i, {
                                                        authorized_at:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label
                                                htmlFor={`t-note-${i}`}
                                                className="text-xs"
                                            >
                                                Cómo autorizó
                                            </Label>
                                            <Input
                                                id={`t-note-${i}`}
                                                placeholder="Ej.: por correo del 10 de octubre"
                                                value={
                                                    t.authorization_note ?? ''
                                                }
                                                onChange={(e) =>
                                                    setTestimonial(i, {
                                                        authorization_note:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <InputError
                                        message={
                                            errors[
                                                `testimonials.${i}.authorized_at`
                                            ] ??
                                            errors[`testimonials.${i}.quote`] ??
                                            errors[
                                                `testimonials.${i}.author_name`
                                            ]
                                        }
                                    />
                                    <div className="flex items-center justify-between gap-3">
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={t.is_published}
                                                onCheckedChange={(c) =>
                                                    setTestimonial(i, {
                                                        is_published:
                                                            c === true,
                                                    })
                                                }
                                            />
                                            Publicar este testimonio
                                        </label>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                form.setData(
                                                    'testimonials',
                                                    form.data.testimonials.filter(
                                                        (_, j) => j !== i,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                            Quitar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    form.setData('testimonials', [
                                        ...form.data.testimonials,
                                        {
                                            author_name: '',
                                            author_role: '',
                                            quote: '',
                                            authorized_at: '',
                                            authorization_note: '',
                                            is_published: false,
                                        },
                                    ])
                                }
                            >
                                <Plus className="size-4" />
                                Agregar testimonio
                            </Button>
                        </fieldset>
                    </div>

                    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                        {item ? (
                            <>
                                <CoverUpload
                                    itemId={item.id}
                                    url={item.cover_url}
                                />
                                <div className="rounded-xl border bg-card p-4">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold">
                                            Estado
                                        </span>
                                        {item.is_confidential ? (
                                            <StatusBadge tone="warning">
                                                <Lock className="size-3" />
                                                Confidencial
                                            </StatusBadge>
                                        ) : item.is_public ? (
                                            <StatusBadge tone="success">
                                                Visible en el sitio
                                            </StatusBadge>
                                        ) : (
                                            <StatusBadge tone="neutral">
                                                Borrador
                                            </StatusBadge>
                                        )}
                                    </div>
                                    {item.status === 'published' ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() =>
                                                router.patch(
                                                    publish(item.id).url,
                                                    { published: false },
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            <EyeOff className="size-4" />
                                            Despublicar
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            className="w-full"
                                            disabled={!item.cover_url}
                                            onClick={() =>
                                                router.patch(
                                                    publish(item.id).url,
                                                    { published: true },
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            <Eye className="size-4" />
                                            Publicar
                                        </Button>
                                    )}
                                    {!item.cover_url && (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Agrega la portada para poder
                                            publicar.
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                Guarda el proyecto para poder subir la portada y
                                la galería.
                            </p>
                        )}

                        <div className="space-y-3 rounded-xl border bg-card p-4">
                            <label className="flex items-start gap-3">
                                <Checkbox
                                    checked={form.data.is_featured}
                                    onCheckedChange={(c) =>
                                        form.setData('is_featured', c === true)
                                    }
                                />
                                <span className="grid gap-0.5">
                                    <span className="flex items-center gap-1.5 text-sm font-medium">
                                        <Star className="size-3.5" />
                                        Destacado
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Aparece en la página de inicio.
                                    </span>
                                </span>
                            </label>
                            <label className="flex items-start gap-3">
                                <Checkbox
                                    checked={form.data.is_confidential}
                                    onCheckedChange={(c) =>
                                        form.setData(
                                            'is_confidential',
                                            c === true,
                                        )
                                    }
                                />
                                <span className="grid gap-0.5">
                                    <span className="flex items-center gap-1.5 text-sm font-medium">
                                        <ShieldCheck className="size-3.5" />
                                        Confidencial
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Nunca se mostrará en el sitio, aunque
                                        esté publicado.
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="flex-1"
                            >
                                {form.processing
                                    ? 'Guardando…'
                                    : item
                                      ? 'Guardar cambios'
                                      : 'Guardar borrador'}
                            </Button>
                            {item && (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        aria-label="Duplicar"
                                        title="Duplicar"
                                        onClick={() =>
                                            router.post(duplicate(item.id).url)
                                        }
                                    >
                                        <Copy className="size-4" />
                                    </Button>
                                    <ConfirmDialog
                                        trigger={
                                            <Button
                                                type="button"
                                                variant="outline"
                                                aria-label="Eliminar"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        }
                                        title={`Eliminar «${item.title}»`}
                                        description="Saldrá del portafolio y del sitio. Podrás restaurarlo desde el filtro «Eliminados»."
                                        confirmLabel="Eliminar"
                                        destructive
                                        onConfirm={(done) =>
                                            router.delete(
                                                destroy(item.id).url,
                                                { onFinish: done },
                                            )
                                        }
                                    />
                                </>
                            )}
                        </div>
                        {form.isDirty && !form.processing && (
                            <p className="text-xs text-muted-foreground">
                                Tienes cambios sin guardar.
                            </p>
                        )}
                    </aside>
                </form>

                {item && <Gallery itemId={item.id} images={item.images} />}
            </div>
        </>
    );
}

function CoverUpload({ itemId, url }: { itemId: number; url: string | null }) {
    const input = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const upload = (file: File) => {
        setBusy(true);
        setError(null);
        router.post(
            cover(itemId).url,
            { image: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (e) =>
                    setError(e.image ?? 'No se pudo subir la imagen.'),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div
                className={cn(
                    'relative aspect-[16/10] bg-muted',
                    !url && 'flex items-center justify-center',
                )}
            >
                {url ? (
                    <img
                        src={url}
                        alt="Portada"
                        className="size-full object-cover"
                    />
                ) : (
                    <ImagePlus className="size-8 text-muted-foreground" />
                )}
            </div>
            <div className="space-y-2 p-3">
                <input
                    ref={input}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="Imagen de portada"
                    onChange={(e) =>
                        e.target.files?.[0] && upload(e.target.files[0])
                    }
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={busy}
                    onClick={() => input.current?.click()}
                >
                    <Upload className="size-4" />
                    {busy
                        ? 'Subiendo…'
                        : url
                          ? 'Cambiar portada'
                          : 'Subir portada'}
                </Button>
                <p className="text-xs text-muted-foreground">
                    JPG, PNG o WebP, máximo 5 MB. Recomendado 1600×1000.
                </p>
                {error && <InputError message={error} />}
            </div>
        </div>
    );
}

function Gallery({
    itemId,
    images,
}: {
    itemId: number;
    images: { id: number; url: string; caption: string | null }[];
}) {
    const input = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const upload = (files: FileList) => {
        setBusy(true);
        setError(null);
        router.post(
            storeImages(itemId).url,
            { images: Array.from(files) },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (e) =>
                    setError(
                        Object.values(e)[0] ??
                            'No se pudieron subir las imágenes.',
                    ),
                onFinish: () => {
                    setBusy(false);
                    if (input.current) {
                        input.current.value = '';
                    }
                },
            },
        );
    };

    return (
        <section className="space-y-4 border-t pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold">Galería</h2>
                    <p className="text-sm text-muted-foreground">
                        Capturas de pantallas, vistas del celular, detalles del
                        diseño.
                    </p>
                </div>
                <input
                    ref={input}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="Imágenes de la galería"
                    onChange={(e) =>
                        e.target.files?.length && upload(e.target.files)
                    }
                />
                <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => input.current?.click()}
                >
                    <ImagePlus className="size-4" />
                    {busy ? 'Subiendo…' : 'Agregar imágenes'}
                </Button>
            </div>
            {error && <InputError message={error} />}
            {images.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Aún no hay imágenes en la galería.
                </p>
            ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((img) => (
                        <li
                            key={img.id}
                            className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                        >
                            <img
                                src={img.url}
                                alt={img.caption ?? ''}
                                loading="lazy"
                                className="size-full object-cover"
                            />
                            <ConfirmDialog
                                trigger={
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        aria-label="Eliminar imagen"
                                        className="absolute top-2 right-2 size-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                }
                                title="Eliminar imagen"
                                description="Se borrará de la galería."
                                confirmLabel="Eliminar"
                                destructive
                                onConfirm={(done) =>
                                    router.delete(
                                        destroyImage({
                                            item: itemId,
                                            image: img.id,
                                        }).url,
                                        {
                                            preserveScroll: true,
                                            onFinish: done,
                                        },
                                    )
                                }
                            />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
