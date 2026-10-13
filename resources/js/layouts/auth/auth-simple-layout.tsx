import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandWordmark } from '@/components/brand-wordmark';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

/**
 * Pantallas de acceso: a la izquierda la marca y su significado, a la derecha el formulario.
 * En celular solo se muestra el logo sobre el formulario.
 */
export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { brand } = usePage().props;

    return (
        <div className="grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]">
            <aside className="relative hidden overflow-hidden bg-[#06070b] p-10 text-[#eceef3] lg:flex lg:flex-col">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/3 left-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,91,255,.38),rgba(34,211,238,.08)_45%,transparent_70%)] blur-2xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(141,163,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(141,163,255,.06)_1px,transparent_1px)] [mask-image:radial-gradient(circle_at_40%_35%,#000_15%,transparent_65%)] bg-[size:44px_44px]"
                />

                <Link
                    href={home()}
                    className="relative flex items-center gap-3 self-start"
                >
                    <AppLogoIcon className="size-9 text-[#eceef3]" />
                    <BrandWordmark className="text-lg" />
                </Link>

                <div className="relative my-auto space-y-8">
                    <AppLogoIcon
                        animated
                        className="size-28 text-[#eceef3] drop-shadow-[0_0_28px_rgba(59,91,255,.55)]"
                    />
                    <p className="max-w-md font-display text-4xl leading-tight font-extrabold tracking-tight">
                        {brand.tagline}
                    </p>
                    <ul className="grid max-w-md grid-cols-2 gap-x-6 gap-y-2.5">
                        {brand.acronym.map((item, i) => (
                            <li
                                key={`${item.letter}-${i}`}
                                className="flex items-baseline gap-2.5 text-sm text-[#9097a6]"
                            >
                                <span className="w-4 font-display text-base font-extrabold text-[#eceef3]">
                                    {item.letter}
                                </span>
                                {item.word}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative font-mono text-[11px] tracking-[0.24em] text-[#5f6675] uppercase">
                    {brand.descriptor}
                </p>
            </aside>

            <main className="flex flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4 lg:items-start">
                            <Link
                                href={home()}
                                className="flex items-center gap-2.5 lg:hidden"
                            >
                                <AppLogoIcon className="size-10 text-foreground" />
                                <BrandWordmark className="text-xl" />
                            </Link>

                            <div className="space-y-2 text-center lg:text-left">
                                <h1 className="text-2xl font-bold">{title}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
