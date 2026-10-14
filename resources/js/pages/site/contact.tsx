import { Head, useForm, usePage } from '@inertiajs/react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { ContactFields } from '@/components/site/contact-fields';
import type { ContactData } from '@/components/site/contact-fields';
import { SectionHeading } from '@/components/site/section-heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { whatsappLink } from '@/lib/whatsapp';
import { store } from '@/routes/site/contact';
import type { SiteProps } from '@/types';

export default function Contact({ seoTitle }: SiteProps) {
    const { site } = usePage<SiteProps>().props;
    const wa = whatsappLink(
        site.contact.whatsapp,
        site.contact.whatsapp_message,
    );
    const form = useForm({
        message: '',
        name: '',
        company: '',
        email: '',
        phone: '',
        wants_meeting: false,
        consent: false,
        website: '',
    });
    const errors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-12 pb-20 md:px-8 lg:grid-cols-[1fr_1.4fr]">
                <div className="space-y-8">
                    <SectionHeading
                        as="h1"
                        eyebrow="Contacto"
                        title="Hablemos"
                        description="Escríbenos por el canal que prefieras. Respondemos en horario laboral."
                    />
                    <ul className="space-y-4">
                        {wa && (
                            <li>
                                <a
                                    href={wa}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-[#25d366]/60"
                                >
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#25d366] text-white">
                                        <MessageCircle className="size-5" />
                                    </span>
                                    <span>
                                        <span className="block font-semibold">
                                            WhatsApp
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            La forma más rápida de hablar con
                                            nosotros
                                        </span>
                                    </span>
                                </a>
                            </li>
                        )}
                        {site.contact.email && (
                            <InfoItem icon={Mail} title="Correo">
                                <a
                                    href={`mailto:${site.contact.email}`}
                                    className="break-all hover:underline"
                                >
                                    {site.contact.email}
                                </a>
                            </InfoItem>
                        )}
                        {site.contact.phone && (
                            <InfoItem icon={Phone} title="Teléfono">
                                {site.contact.phone}
                            </InfoItem>
                        )}
                        {site.contact.city && (
                            <InfoItem icon={MapPin} title="Ubicación">
                                {site.contact.city}
                            </InfoItem>
                        )}
                    </ul>
                </div>

                <form
                    onSubmit={submit}
                    className="relative space-y-6 rounded-2xl border bg-card p-6 md:p-8"
                >
                    <h2 className="text-xl font-bold">Envíanos un mensaje</h2>
                    <div className="grid gap-2">
                        <Label htmlFor="contact-message">Tu mensaje</Label>
                        <Textarea
                            id="contact-message"
                            rows={5}
                            value={form.data.message}
                            onChange={(e) =>
                                form.setData('message', e.target.value)
                            }
                            required
                        />
                        <InputError message={errors.message} />
                    </div>
                    <ContactFields
                        data={form.data as unknown as ContactData}
                        errors={errors}
                        set={(k, v) => form.setData(k, v as never)}
                    />
                    {errors.form && (
                        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                            {errors.form}
                        </p>
                    )}
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="w-full bg-gradient-to-r from-[#3b5bff] to-[#2f57f0] sm:w-auto"
                    >
                        {form.processing ? 'Enviando…' : 'Enviar mensaje'}
                    </Button>
                </form>
            </section>
        </>
    );
}

function InfoItem({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof Mail;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <li className="flex items-center gap-4 rounded-2xl border bg-card p-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-5 text-brand-cyan" />
            </span>
            <span>
                <span className="block text-sm text-muted-foreground">
                    {title}
                </span>
                <span className="font-medium">{children}</span>
            </span>
        </li>
    );
}
