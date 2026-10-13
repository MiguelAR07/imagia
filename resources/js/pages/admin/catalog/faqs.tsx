import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import { PublishToggle } from '@/components/publish-toggle';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { reorder } from '@/lib/reorder';
import {
    destroy,
    index,
    reorder as reorderRoute,
    store,
    update,
} from '@/routes/admin/catalog/faqs';

type FaqRow = {
    id: number;
    question: string;
    answer: string;
    is_published: boolean;
};

export default function FaqsPage({ faqs }: { faqs: FaqRow[] }) {
    const [editing, setEditing] = useState<FaqRow | 'new' | null>(null);
    const ids = faqs.map((f) => f.id);

    return (
        <>
            <Head title="Preguntas frecuentes" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    Las publicadas aparecen en el sitio y el asistente las usa
                    para responder.
                </p>
                <Button onClick={() => setEditing('new')}>
                    <Plus className="size-4" />
                    Nueva pregunta
                </Button>
            </div>

            {faqs.length === 0 ? (
                <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                    Agrega las preguntas que más te hacen los clientes: tiempos,
                    forma de pago, dominio, mantenimiento…
                </p>
            ) : (
                <ol className="divide-y rounded-xl border bg-card">
                    {faqs.map((f, i) => (
                        <li key={f.id} className="flex items-start gap-3 p-4">
                            <div className="flex flex-col">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6"
                                    disabled={i === 0}
                                    aria-label="Subir"
                                    onClick={() =>
                                        reorder(reorderRoute().url, ids, i, -1)
                                    }
                                >
                                    <ArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-6"
                                    disabled={i === faqs.length - 1}
                                    aria-label="Bajar"
                                    onClick={() =>
                                        reorder(reorderRoute().url, ids, i, 1)
                                    }
                                >
                                    <ArrowDown className="size-3.5" />
                                </Button>
                            </div>
                            <button
                                type="button"
                                className="min-w-0 flex-1 space-y-1 text-left"
                                onClick={() => setEditing(f)}
                            >
                                <p className="font-medium hover:underline">
                                    {f.question}
                                </p>
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {f.answer}
                                </p>
                            </button>
                            {f.is_published ? (
                                <StatusBadge tone="success">
                                    Publicada
                                </StatusBadge>
                            ) : (
                                <StatusBadge tone="neutral">
                                    Borrador
                                </StatusBadge>
                            )}
                            <ConfirmDialog
                                trigger={
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Eliminar pregunta"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                }
                                title="Eliminar pregunta"
                                description={`«${f.question}»`}
                                confirmLabel="Eliminar"
                                destructive
                                onConfirm={(done) =>
                                    router.delete(destroy(f.id).url, {
                                        preserveScroll: true,
                                        onFinish: done,
                                    })
                                }
                            />
                        </li>
                    ))}
                </ol>
            )}

            {editing && (
                <FaqDialog
                    key={editing === 'new' ? 'new' : editing.id}
                    faq={editing === 'new' ? undefined : editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function FaqDialog({ faq, onClose }: { faq?: FaqRow; onClose: () => void }) {
    const form = useForm({
        question: faq?.question ?? '',
        answer: faq?.answer ?? '',
        is_published: faq?.is_published ?? true,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };

        if (faq) {
            form.put(update(faq.id).url, opts);
        } else {
            form.post(store().url, opts);
        }
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {faq ? 'Editar pregunta' : 'Nueva pregunta'}
                        </DialogTitle>
                    </DialogHeader>
                    <FormField
                        id="faq-question"
                        label="Pregunta"
                        error={form.errors.question}
                    >
                        <Input
                            id="faq-question"
                            value={form.data.question}
                            onChange={(e) =>
                                form.setData('question', e.target.value)
                            }
                            required
                            autoFocus
                        />
                    </FormField>
                    <FormField
                        id="faq-answer"
                        label="Respuesta"
                        hint="Escríbela como se la dirías al cliente."
                        error={form.errors.answer}
                    >
                        <Textarea
                            id="faq-answer"
                            rows={5}
                            value={form.data.answer}
                            onChange={(e) =>
                                form.setData('answer', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    <PublishToggle
                        id="faq-published"
                        checked={form.data.is_published}
                        onChange={(v) => form.setData('is_published', v)}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

FaqsPage.layout = {
    breadcrumbs: [{ title: 'Catálogo', href: index() }],
};
