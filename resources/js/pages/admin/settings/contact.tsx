import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { edit, update } from '@/routes/admin/contact';
import type { ContactSettings } from '@/types';

type Field = {
    key: keyof ContactSettings;
    label: string;
    type?: string;
    placeholder?: string;
    hint?: string;
};

const contactFields: Field[] = [
    {
        key: 'email',
        label: 'Correo de contacto',
        type: 'email',
        placeholder: 'hola@tudominio.com',
    },
    {
        key: 'phone',
        label: 'Teléfono',
        type: 'tel',
        placeholder: '+57 300 123 4567',
    },
    {
        key: 'whatsapp',
        label: 'WhatsApp',
        type: 'tel',
        placeholder: '573001234567',
        hint: 'Con el indicativo del país, sin «+» ni espacios. Se usa para el botón de WhatsApp del sitio.',
    },
    { key: 'city', label: 'Ciudad', placeholder: 'Ciudad, país' },
];

const socialFields: Field[] = [
    {
        key: 'instagram',
        label: 'Instagram',
        placeholder: 'https://instagram.com/…',
    },
    {
        key: 'facebook',
        label: 'Facebook',
        placeholder: 'https://facebook.com/…',
    },
    {
        key: 'linkedin',
        label: 'LinkedIn',
        placeholder: 'https://linkedin.com/in/…',
    },
    { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/…' },
];

export default function ContactSettingsPage({
    settings,
}: {
    settings: ContactSettings;
}) {
    const form = useForm<Record<keyof ContactSettings, string>>(
        Object.fromEntries(
            Object.entries(settings).map(([k, v]) => [k, v ?? '']),
        ) as Record<keyof ContactSettings, string>,
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update().url, { preserveScroll: true });
    };

    const renderField = (field: Field) => (
        <div key={field.key} className="grid gap-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
                id={field.key}
                type={field.type ?? 'text'}
                value={form.data[field.key]}
                placeholder={field.placeholder}
                onChange={(e) => form.setData(field.key, e.target.value)}
            />
            {field.hint && (
                <p className="text-xs text-muted-foreground">{field.hint}</p>
            )}
            <InputError message={form.errors[field.key]} />
        </div>
    );

    const waPreview = form.data.whatsapp
        ? `https://wa.me/${form.data.whatsapp.replace(/\D/g, '')}`
        : null;

    return (
        <>
            <Head title="Contacto y redes" />

            <form onSubmit={submit} className="space-y-10">
                <fieldset className="grid gap-6 sm:grid-cols-2">
                    <legend className="mb-4 text-base font-semibold">
                        Datos de contacto
                    </legend>
                    {contactFields.map(renderField)}
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="whatsapp_message">
                            Mensaje inicial de WhatsApp
                        </Label>
                        <Textarea
                            id="whatsapp_message"
                            value={form.data.whatsapp_message}
                            onChange={(e) =>
                                form.setData('whatsapp_message', e.target.value)
                            }
                            maxLength={200}
                            rows={2}
                        />
                        {waPreview && (
                            <p className="font-mono text-xs break-all text-muted-foreground">
                                El botón abrirá: {waPreview}
                            </p>
                        )}
                        <InputError message={form.errors.whatsapp_message} />
                    </div>
                </fieldset>

                <fieldset className="grid gap-6 sm:grid-cols-2">
                    <legend className="mb-4 text-base font-semibold">
                        Redes sociales
                    </legend>
                    {socialFields.map(renderField)}
                </fieldset>

                <div className="flex items-center gap-4 border-t pt-6">
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

ContactSettingsPage.layout = {
    breadcrumbs: [{ title: 'Configuración', href: edit() }],
};
