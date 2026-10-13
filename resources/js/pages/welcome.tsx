import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandWordmark } from '@/components/brand-wordmark';
import { dashboard, login } from '@/routes';
import type { ContactSettings, LogoPart, OriginPart } from '@/types';

type Props = {
    contact: Pick<
        ContactSettings,
        | 'email'
        | 'whatsapp'
        | 'whatsapp_message'
        | 'city'
        | 'instagram'
        | 'facebook'
        | 'linkedin'
        | 'tiktok'
        | 'github'
    >;
    story: { origin: OriginPart[]; logo_parts: LogoPart[] };
};

const socials = [
    ['instagram', 'Instagram'],
    ['facebook', 'Facebook'],
    ['linkedin', 'LinkedIn'],
    ['tiktok', 'TikTok'],
    ['github', 'GitHub'],
] as const;

/**
 * Página pública provisional (la versión comercial completa llega en la Fase 4).
 * Diseño oscuro fijo, como la identidad de la marca.
 */
export default function Welcome({ contact, story }: Props) {
    const { auth, brand } = usePage().props;
    const whatsappUrl = contact.whatsapp
        ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsapp_message ?? '')}`
        : null;

    return (
        <>
            <Head title={brand.tagline} />

            <div className="dark min-h-svh bg-[#06070b] text-[#eceef3]">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
                    <div className="flex items-center gap-2.5">
                        <AppLogoIcon className="size-8 text-[#eceef3]" />
                        <BrandWordmark className="text-base" />
                    </div>
                    <Link
                        href={auth.user ? dashboard() : login()}
                        className="rounded-lg border border-[#252a35] px-4 py-2 text-sm text-[#9097a6] transition-colors hover:border-[#3b5bff] hover:text-[#eceef3]"
                    >
                        {auth.user ? 'Ir al panel' : 'Acceso privado'}
                    </Link>
                </header>

                <main className="mx-auto max-w-6xl px-5 md:px-8">
                    <section className="relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl border border-[#1c2029] px-6 py-16 text-center md:py-24">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,91,255,.32),rgba(34,211,238,.08)_45%,transparent_70%)] blur-2xl"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(141,163,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(141,163,255,.06)_1px,transparent_1px)] [mask-image:radial-gradient(circle,#000_15%,transparent_65%)] bg-[size:44px_44px]"
                        />

                        <AppLogoIcon
                            animated
                            className="relative size-28 text-[#eceef3] drop-shadow-[0_0_30px_rgba(59,91,255,.55)] md:size-36"
                        />
                        <div className="relative space-y-3">
                            <BrandWordmark className="text-5xl md:text-7xl" />
                            <p className="font-mono text-[11px] tracking-[0.28em] text-[#9097a6] uppercase md:text-xs">
                                {brand.descriptor}
                            </p>
                        </div>
                        <h1 className="relative max-w-2xl text-3xl font-extrabold md:text-5xl">
                            {brand.tagline}
                        </h1>
                        <p className="relative max-w-xl text-[#9097a6] md:text-lg">
                            Estamos preparando nuestro sitio. Mientras tanto,
                            cuéntanos tu idea.
                        </p>

                        {(whatsappUrl || contact.email) && (
                            <div className="relative flex flex-wrap justify-center gap-3">
                                {whatsappUrl && (
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3b5bff] to-[#2f57f0] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(59,91,255,.45)] transition-transform hover:-translate-y-0.5"
                                    >
                                        <MessageCircle className="size-4" />
                                        Escríbenos por WhatsApp
                                    </a>
                                )}
                                {contact.email && (
                                    <a
                                        href={`mailto:${contact.email}`}
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#252a35] px-5 py-3 text-sm font-semibold transition-colors hover:border-[#22d3ee]"
                                    >
                                        <Mail className="size-4" />
                                        {contact.email}
                                    </a>
                                )}
                            </div>
                        )}
                    </section>

                    <section
                        aria-labelledby="significado"
                        className="grid gap-10 py-20 md:grid-cols-[1fr_1.4fr]"
                    >
                        <div className="space-y-4">
                            <p className="font-mono text-xs tracking-[0.16em] text-[#22d3ee] uppercase">
                                Por qué {brand.name}
                            </p>
                            <h2
                                id="significado"
                                className="text-3xl font-extrabold md:text-4xl"
                            >
                                Cada letra es algo que hacemos por tu negocio
                            </h2>
                            {story.origin.length > 0 && (
                                <p className="text-[#9097a6]">
                                    {story.origin.map((o, i) => (
                                        <span key={o.part}>
                                            {i > 0 && ' + '}
                                            <strong className="text-[#eceef3]">
                                                {o.part}
                                            </strong>
                                        </span>
                                    ))}
                                </p>
                            )}
                        </div>
                        <ol className="divide-y divide-[#1c2029] overflow-hidden rounded-2xl border border-[#1c2029]">
                            {brand.acronym.map((item, i) => (
                                <li
                                    key={`${item.letter}-${i}`}
                                    className="grid grid-cols-[56px_1fr] items-center gap-4 bg-[#0b0d13] px-5 py-4"
                                >
                                    <span
                                        className={
                                            'font-display text-4xl font-extrabold ' +
                                            (i >= brand.acronym.length - 2
                                                ? 'text-brand-gradient'
                                                : '')
                                        }
                                    >
                                        {item.letter}
                                    </span>
                                    <div>
                                        <p className="font-semibold">
                                            {item.word}
                                        </p>
                                        <p className="text-sm text-[#9097a6]">
                                            {item.description}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {story.logo_parts.length > 0 && (
                        <section
                            aria-labelledby="logo"
                            className="grid gap-6 border-t border-[#1c2029] py-16 md:grid-cols-3"
                        >
                            <h2 id="logo" className="sr-only">
                                Qué significa el logo
                            </h2>
                            {story.logo_parts.map((part) => (
                                <div key={part.shape} className="space-y-2">
                                    <p className="font-display text-lg font-bold">
                                        {part.shape}
                                    </p>
                                    <p className="text-sm text-[#9097a6]">
                                        {part.meaning}
                                    </p>
                                </div>
                            ))}
                        </section>
                    )}
                </main>

                <footer className="border-t border-[#1c2029]">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-[#5f6675] md:px-8">
                        <p>
                            © {new Date().getFullYear()} {brand.name}
                            {contact.city ? ` · ${contact.city}` : ''}
                        </p>
                        <nav
                            aria-label="Redes sociales"
                            className="flex flex-wrap gap-4"
                        >
                            {socials
                                .filter(([key]) => contact[key])
                                .map(([key, label]) => (
                                    <a
                                        key={key}
                                        href={contact[key] ?? '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 hover:text-[#eceef3]"
                                    >
                                        {label}
                                        <ArrowUpRight className="size-3.5" />
                                    </a>
                                ))}
                        </nav>
                    </div>
                </footer>
            </div>
        </>
    );
}
