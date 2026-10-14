import { Link, usePage } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { whatsappLink } from '@/lib/whatsapp';
import { quote } from '@/routes/site';
import type { SiteProps } from '@/types';

/** Llamada a la acción final: conversar sobre el proyecto. */
export function CtaBand({
    title = '¿Tienes una idea? Hablemos de tu proyecto.',
}: {
    title?: string;
}) {
    const { site } = usePage<SiteProps>().props;
    const wa = whatsappLink(
        site.contact.whatsapp,
        site.contact.whatsapp_message,
    );

    return (
        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-brand-blue/30 bg-[linear-gradient(120deg,#1b2a8f_0%,#2643e6_45%,#0e7c93_100%)] px-6 py-14 text-white md:px-14">
                <AppLogoIcon
                    mono
                    className="pointer-events-none absolute -right-10 -bottom-16 size-72 opacity-15"
                />
                <div className="relative max-w-2xl space-y-5">
                    <h2 className="text-3xl font-extrabold md:text-4xl">
                        {title}
                    </h2>
                    <p className="text-lg text-white/80">
                        Cuéntanos qué quieres lograr y te enviamos una propuesta
                        personalizada, sin compromiso.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            href={quote()}
                            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0e1118] transition-transform hover:-translate-y-0.5"
                        >
                            Solicitar una propuesta
                        </Link>
                        {wa && (
                            <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                            >
                                <MessageCircle className="size-4" />
                                Escribir por WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
