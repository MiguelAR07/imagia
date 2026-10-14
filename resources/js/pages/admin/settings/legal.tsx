import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/format';
import { edit, update } from '@/routes/admin/legal';

type Props = {
    settings: {
        privacy: string;
        terms: string;
        support: string;
        updated_at: string | null;
    };
};

const DOCUMENTS = [
    { key: 'privacy', label: 'Política de privacidad (/privacidad)', rows: 16 },
    { key: 'terms', label: 'Términos y condiciones (/terminos)', rows: 14 },
    {
        key: 'support',
        label: 'Política de soporte y eximentes de responsabilidad (/soporte)',
        rows: 18,
    },
] as const;

export default function LegalSettingsPage({ settings }: Props) {
    const form = useForm({
        privacy: settings.privacy,
        terms: settings.terms,
        support: settings.support,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update().url, { preserveScroll: true });
    };

    const code = (text: string) => (
        <code className="rounded bg-muted px-1">{text}</code>
    );

    return (
        <>
            <Head title="Textos legales" />

            <form onSubmit={submit} className="space-y-8">
                <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <p>
                        Estos textos son una <strong>plantilla base</strong>.
                        Revísalos con un asesor legal para que cumplan la ley de
                        tu país antes de publicar el sitio.
                        {settings.updated_at &&
                            ` Última actualización: ${formatDate(settings.updated_at)}.`}
                    </p>
                </div>

                <p className="text-sm text-muted-foreground">
                    Formato: {code('## ')} y {code('### ')} son títulos, las
                    líneas que empiezan con {code('- ')} forman una lista,{' '}
                    {code('**texto**')} va en negrita y una línea en blanco
                    separa párrafos. {code('{marca}')}, {code('{correo}')} y{' '}
                    {code('{whatsapp}')} se reemplazan por los datos de
                    Configuración.
                </p>

                {DOCUMENTS.map((doc) => (
                    <FormField
                        key={doc.key}
                        id={`legal-${doc.key}`}
                        label={doc.label}
                        error={form.errors[doc.key]}
                    >
                        <Textarea
                            id={`legal-${doc.key}`}
                            rows={doc.rows}
                            className="font-mono text-xs"
                            value={form.data[doc.key]}
                            onChange={(e) =>
                                form.setData(doc.key, e.target.value)
                            }
                        />
                    </FormField>
                ))}

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
