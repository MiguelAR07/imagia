import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/whatsapp';
import { projects } from '@/routes/site';
import type { SiteProps } from '@/types';

const NEXT_STEPS = [
    {
        title: 'Te contactamos',
        text: 'Aclaramos lo que necesitas, sin compromiso.',
    },
    {
        title: 'Recibes tu propuesta',
        text: 'Con alcance, valor y tiempos, en un enlace privado.',
    },
    {
        title: 'Aceptas con el 50 %',
        text: 'Pagas el anticipo en línea y empezamos.',
    },
    {
        title: 'Entrega y saldo',
        text: 'El otro 50 % se paga cuando te entregamos.',
    },
];

/** Confirmación. Solo se muestra si el servidor guardó la solicitud. */
export default function Thanks({
    kind,
    name,
    seoTitle,
}: SiteProps & { kind: string; name: string | null }) {
    const { site } = usePage<SiteProps>().props;
    const wa = whatsappLink(
        site.contact.whatsapp,
        site.contact.whatsapp_message,
    );

    return (
        <>
            <Head title={seoTitle} />
            <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-5 py-24 text-center md:px-8">
                <CheckCircle2 className="size-16 text-success" />
                <h1 className="text-4xl font-black tracking-tight">
                    {name ? `¡Gracias, ${name}!` : '¡Gracias!'}
                </h1>
                <p className="text-lg text-muted-foreground">
                    Recibimos tu solicitud y la estamos revisando. Te
                    responderemos por el correo o el teléfono que nos dejaste.
                </p>
                {kind === 'cotizacion' && (
                    <ol className="grid w-full gap-3 pt-2 text-left text-sm sm:grid-cols-2">
                        {NEXT_STEPS.map((step, i) => (
                            <li
                                key={step.title}
                                className="flex gap-3 rounded-2xl border bg-card p-4"
                            >
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                                    {i + 1}
                                </span>
                                <span>
                                    <span className="block font-semibold">
                                        {step.title}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {step.text}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {wa && (
                        <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-5 py-3 text-sm font-semibold text-white"
                        >
                            <MessageCircle className="size-4" />
                            ¿Es urgente? Escríbenos por WhatsApp
                        </a>
                    )}
                    <Link
                        href={projects()}
                        className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-accent"
                    >
                        Ver nuestros proyectos
                    </Link>
                </div>
            </section>
        </>
    );
}
