import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Menu, MessageCircle, X } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandWordmark } from '@/components/brand-wordmark';
import { AssistantWidget } from '@/components/site/assistant-widget';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { whatsappLink } from '@/lib/whatsapp';
import { dashboard, home, login } from '@/routes';
import {
    budget,
    contact,
    plans,
    privacy,
    process,
    projects,
    quote,
    service,
    services,
    support,
    terms,
} from '@/routes/site';
import type { SiteProps } from '@/types';

const NAV = [
    { title: 'Servicios', href: services() },
    { title: 'Proyectos', href: projects() },
    { title: 'Planes', href: plans() },
    { title: 'Calcula tu proyecto', href: budget() },
    { title: 'Cómo trabajamos', href: process() },
    { title: 'Contacto', href: contact() },
];

const SOCIALS = [
    ['instagram', 'Instagram'],
    ['facebook', 'Facebook'],
    ['linkedin', 'LinkedIn'],
    ['tiktok', 'TikTok'],
    ['github', 'GitHub'],
] as const;

/**
 * Estructura del sitio público: menú, contenido, pie de página y botón de WhatsApp.
 * Siempre en tema oscuro, como la identidad de la marca.
 */
export default function SiteLayout({ children }: PropsWithChildren) {
    const { site, brand, auth } = usePage<SiteProps>().props;
    const { isCurrentOrParentUrl, currentUrl } = useCurrentUrl();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const wa = whatsappLink(
        site.contact.whatsapp,
        site.contact.whatsapp_message,
    );

    useEffect(() => setOpen(false), [currentUrl]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="dark min-h-svh bg-background text-foreground">
            <a
                href="#contenido"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
            >
                Saltar al contenido
            </a>

            <header
                className={cn(
                    'sticky top-0 z-40 border-b transition-colors duration-300',
                    scrolled || open
                        ? 'border-border/80 bg-background/85 backdrop-blur-lg'
                        : 'border-transparent bg-transparent',
                )}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
                    <Link
                        href={home()}
                        className="flex items-center gap-2.5"
                        aria-label={`${brand.name}, inicio`}
                    >
                        <AppLogoIcon className="size-8 text-foreground" />
                        <BrandWordmark className="text-base" />
                    </Link>

                    <nav
                        aria-label="Principal"
                        className="hidden items-center gap-1 lg:flex"
                    >
                        {NAV.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    'rounded-md px-3 py-2 text-sm transition-colors',
                                    isCurrentOrParentUrl(item.href)
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <Link
                            href={quote()}
                            className="hidden rounded-lg bg-gradient-to-r from-[#3b5bff] to-[#2f57f0] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(59,91,255,.35)] transition-transform hover:-translate-y-0.5 sm:inline-block"
                        >
                            Solicitar cotización
                        </Link>
                        <button
                            type="button"
                            className="rounded-md p-2 text-muted-foreground hover:text-foreground lg:hidden"
                            aria-expanded={open}
                            aria-controls="menu-movil"
                            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                            onClick={() => setOpen((o) => !o)}
                        >
                            {open ? (
                                <X className="size-5" />
                            ) : (
                                <Menu className="size-5" />
                            )}
                        </button>
                    </div>
                </div>

                {open && (
                    <nav
                        id="menu-movil"
                        aria-label="Principal"
                        className="border-t px-5 pb-5 lg:hidden"
                    >
                        <ul className="divide-y">
                            {NAV.map((item) => (
                                <li key={item.title}>
                                    <Link
                                        href={item.href}
                                        className="block py-3 text-base"
                                    >
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <Link
                            href={quote()}
                            className="mt-3 block rounded-lg bg-primary px-4 py-3 text-center font-semibold text-primary-foreground"
                        >
                            Solicitar cotización
                        </Link>
                    </nav>
                )}
            </header>

            <main id="contenido">{children}</main>

            <footer className="border-t">
                <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
                    <div className="space-y-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-2.5"
                        >
                            <AppLogoIcon className="size-9 text-foreground" />
                            <BrandWordmark className="text-lg" />
                        </Link>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            {brand.tagline}
                        </p>
                        <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/70 uppercase">
                            {brand.acronym.map((a) => a.word).join(' · ')}
                        </p>
                    </div>

                    <FooterColumn title="Servicios">
                        {site.services.map((s) => (
                            <li key={s.slug}>
                                <Link
                                    href={service(s.slug)}
                                    className="hover:text-foreground"
                                >
                                    {s.name}
                                </Link>
                            </li>
                        ))}
                        {site.services.length === 0 && (
                            <li>
                                <Link
                                    href={services()}
                                    className="hover:text-foreground"
                                >
                                    Ver servicios
                                </Link>
                            </li>
                        )}
                    </FooterColumn>

                    <FooterColumn title="Explora">
                        <li>
                            <Link
                                href={projects()}
                                className="hover:text-foreground"
                            >
                                Proyectos
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={plans()}
                                className="hover:text-foreground"
                            >
                                Planes
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={process()}
                                className="hover:text-foreground"
                            >
                                Cómo trabajamos
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={quote()}
                                className="hover:text-foreground"
                            >
                                Solicitar cotización
                            </Link>
                        </li>
                    </FooterColumn>

                    <FooterColumn title="Contacto">
                        {wa && (
                            <li>
                                <a
                                    href={wa}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground"
                                >
                                    WhatsApp
                                </a>
                            </li>
                        )}
                        {site.contact.email && (
                            <li>
                                <a
                                    href={`mailto:${site.contact.email}`}
                                    className="break-all hover:text-foreground"
                                >
                                    {site.contact.email}
                                </a>
                            </li>
                        )}
                        {site.contact.phone && <li>{site.contact.phone}</li>}
                        {site.contact.city && <li>{site.contact.city}</li>}
                        <li>
                            <Link
                                href={contact()}
                                className="hover:text-foreground"
                            >
                                Formulario de contacto
                            </Link>
                        </li>
                    </FooterColumn>
                </div>

                <div className="border-t">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-muted-foreground md:px-8">
                        <p>
                            © {new Date().getFullYear()} {brand.name}
                        </p>
                        <nav
                            aria-label="Redes sociales y legales"
                            className="flex flex-wrap items-center gap-x-5 gap-y-2"
                        >
                            {SOCIALS.filter(([k]) => site.contact[k]).map(
                                ([k, label]) => (
                                    <a
                                        key={k}
                                        href={site.contact[k] ?? '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 hover:text-foreground"
                                    >
                                        {label}
                                        <ArrowUpRight className="size-3.5" />
                                    </a>
                                ),
                            )}
                            <Link
                                href={privacy()}
                                className="hover:text-foreground"
                            >
                                Privacidad
                            </Link>
                            <Link
                                href={terms()}
                                className="hover:text-foreground"
                            >
                                Términos
                            </Link>
                            <Link
                                href={support()}
                                className="hover:text-foreground"
                            >
                                Soporte
                            </Link>
                            {/* Enlace normal (recarga): el panel usa su propio tema claro u oscuro. */}
                            <a
                                href={(auth.user ? dashboard() : login()).url}
                                className="hover:text-foreground"
                            >
                                {auth.user ? 'Panel' : 'Acceso privado'}
                            </a>
                        </nav>
                    </div>
                </div>
            </footer>

            {wa && (
                <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Escríbenos por WhatsApp"
                    className={cn(
                        'fixed right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_rgba(37,211,102,.35)] transition-transform motion-safe:hover:scale-105',
                        site.assistant ? 'bottom-[5.5rem]' : 'bottom-5',
                    )}
                    style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <MessageCircle className="size-6" />
                </a>
            )}

            {site.assistant && (
                <AssistantWidget
                    whatsapp={site.contact.whatsapp}
                    brandName={brand.name}
                />
            )}
        </div>
    );
}

function FooterColumn({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <p className="mb-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                {title}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
                {children}
            </ul>
        </div>
    );
}
