import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/format';
import { edit, update } from '@/routes/admin/legal';

type Props = {
    settings: { privacy: string; terms: string; updated_at: string | null };
};

export default function LegalSettingsPage({ settings }: Props) {
    const form = useForm({ privacy: settings.privacy, terms: settings.terms });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Textos legales" />

            <form onSubmit={submit} className="space-y-8">
                <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p>
                        Estos textos son una <strong>plantilla base</strong>.
                        Revísalos con un asesor legal para que cumplan la ley de
                        protección de datos de tu país antes de publicar el
                        sitio.
                        {settings.updated_at &&
                            ` Última actualización: ${formatDate(settings.updated_at)}.`}
                    </p>
                </div>

                <p className="text-sm text-muted-foreground">
                    Formato: las líneas que empiezan con{' '}
                    <code className="rounded bg-muted px-1">## </code> son
                    títulos; deja una línea en blanco entre párrafos. Puedes
                    usar{' '}
                    <code className="rounded bg-muted px-1">{'{marca}'}</code> y{' '}
                    <code className="rounded bg-muted px-1">{'{correo}'}</code>:
                    se reemplazan por el nombre y el correo de contacto.
                </p>

                <FormField
                    id="legal-privacy"
                    label="Política de privacidad (/privacidad)"
                    error={form.errors.privacy}
                >
                    <Textarea
                        id="legal-privacy"
                        rows={16}
                        className="font-mono text-xs"
                        value={form.data.privacy}
                        onChange={(e) =>
                            form.setData('privacy', e.target.value)
                        }
                    />
                </FormField>

                <FormField
                    id="legal-terms"
                    label="Términos y condiciones (/terminos)"
                    error={form.errors.terms}
                >
                    <Textarea
                        id="legal-terms"
                        rows={14}
                        className="font-mono text-xs"
                        value={form.data.terms}
                        onChange={(e) => form.setData('terms', e.target.value)}
                    />
                </FormField>

                <div className="flex items-center gap-4 border-t pt-6">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                </div>
            </form>
        </>
    );
}

LegalSettingsPage.layout = {
    breadcrumbs: [{ title: 'Configuración', href: edit() }],
};
