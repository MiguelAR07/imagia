import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { planPriceLabel } from '@/lib/plan-price';
import { service as serviceRoute } from '@/routes/site';
import type { PublicPlan, PublicService } from '@/types';

type Line = {
    /** Slug del servicio en la base de datos. */
    slug: string;
    /** Como la gente lo busca y lo oye nombrar. */
    term: string;
    /** Qué significa la palabra, en español. */
    meaning: string;
    /** Qué es, en una sola frase. */
    what: string;
    idealFor: string;
    preview: ReactNode;
};

/**
 * Las cuatro cosas que construimos, explicadas para quien no es del medio:
 * un dibujo de cómo se ve, la palabra con su traducción y una sola frase.
 */
const LINES: Line[] = [
    {
        slug: 'landing-pages',
        term: 'Landing page',
        meaning: 'página de aterrizaje',
        what: 'Una sola página para vender un producto o una promoción y recibir mensajes por WhatsApp.',
        idealFor: 'Emprendimientos y campañas en redes',
        preview: <LandingPreview />,
    },
    {
        slug: 'paginas-web',
        term: 'Página web',
        meaning: 'tu negocio en internet',
        what: 'Varias secciones —inicio, servicios, galería y contacto— para que te encuentren y confíen en ti.',
        idealFor: 'Negocios que quieren verse profesionales',
        preview: <WebsitePreview />,
    },
    {
        slug: 'software-de-gestion',
        term: 'Software',
        meaning: 'programa o sistema a tu medida',
        what: 'Un programa para manejar citas, clientes, inventario y pagos desde el celular o el computador.',
        idealFor: 'Negocios que ya no dan abasto con cuaderno y Excel',
        preview: <SoftwarePreview />,
    },
    {
        slug: 'automatizacion-empresarial',
        term: 'Automatización',
        meaning: 'tareas que se hacen solas',
        what: 'Respuestas, recordatorios, cobros y reportes que pasan solos, sin que tengas que estar pendiente.',
        idealFor: 'Quien responde lo mismo todo el día',
        preview: <AutomationPreview />,
    },
];

export function WhatWeBuild({
    services,
    plans,
}: {
    services: PublicService[];
    plans: PublicPlan[];
}) {
    const published = new Set(services.map((s) => s.slug));

    return (
        <ul className="grid gap-5 sm:grid-cols-2">
            {LINES.filter((l) => published.has(l.slug)).map((l) => {
                // El precio de entrada es el plan más barato de esa línea.
                const entry = plans
                    .filter(
                        (p) =>
                            p.service?.slug === l.slug &&
                            p.price_type !== 'quote',
                    )
                    .sort((a, b) => Number(a.price) - Number(b.price))[0];

                return (
                    <li key={l.slug}>
                        <Link
                            href={serviceRoute(l.slug)}
                            className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-colors hover:border-brand-cyan/60"
                        >
                            <div className="relative aspect-[16/10] overflow-hidden border-b bg-[radial-gradient(120%_90%_at_50%_0%,rgba(59,91,255,.22),transparent_70%)] p-6">
                                <div className="h-full transition-transform duration-500 group-hover:scale-[1.03]">
                                    {l.preview}
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 p-6">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">
                                        {l.term}
                                    </h3>
                                    <p className="mt-1 text-sm text-brand-cyan">
                                        En español: {l.meaning}
                                    </p>
                                </div>
                                <p className="text-muted-foreground">
                                    {l.what}
                                </p>
                                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
                                    <div className="text-sm">
                                        <p className="text-muted-foreground">
                                            Ideal para
                                        </p>
                                        <p className="font-medium">
                                            {l.idealFor}
                                        </p>
                                    </div>
                                    {entry && (
                                        <p className="rounded-full bg-brand-blue/15 px-3 py-1.5 text-sm font-semibold tabular-nums">
                                            {planPriceLabel(
                                                entry.price_type,
                                                entry.price,
                                                entry.currency,
                                            )}
                                        </p>
                                    )}
                                </div>
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan">
                                    Ver ejemplos y precios
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

/* ---------- Dibujos de cómo se ve cada cosa (decorativos) ---------- */

function Browser({ children, url }: { children: ReactNode; url: string }) {
    return (
        <div
            aria-hidden="true"
            className="flex h-full flex-col overflow-hidden rounded-xl bg-white text-[#0f172a] shadow-[0_20px_50px_-20px_rgba(0,0,0,.7)]"
        >
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
                <i className="size-2 rounded-full bg-[#ff5f57]" />
                <i className="size-2 rounded-full bg-[#febc2e]" />
                <i className="size-2 rounded-full bg-[#28c840]" />
                <span className="ml-2 truncate rounded bg-white px-2 py-0.5 text-[10px] text-slate-500">
                    {url}
                </span>
            </div>
            <div className="relative min-h-0 flex-1">{children}</div>
        </div>
    );
}

function LandingPreview() {
    return (
        <Browser url="tupromo.com">
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-orange-50 to-white px-4 text-center">
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold text-orange-600">
                    PROMO -30 %
                </span>
                <p className="text-sm leading-tight font-black sm:text-base">
                    Tu producto estrella
                </p>
                <div className="h-1.5 w-2/3 rounded bg-slate-200" />
                <span className="mt-1 rounded-full bg-[#25D366] px-4 py-1.5 text-[10px] font-bold text-white shadow">
                    Pedir por WhatsApp
                </span>
                <p className="text-[8px] text-slate-400">
                    Una sola página · un solo objetivo
                </p>
            </div>
        </Browser>
    );
}

function WebsitePreview() {
    return (
        <Browser url="tunegocio.com">
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-3 py-1.5 text-[8px] font-semibold text-slate-500">
                    <b className="text-[10px] text-[#0f172a]">TU NEGOCIO</b>
                    <span className="flex gap-2">
                        <span>Inicio</span>
                        <span>Servicios</span>
                        <span>Galería</span>
                        <span>Contacto</span>
                    </span>
                </div>
                <div className="mx-3 flex-1 rounded-md bg-gradient-to-br from-[#3b5bff] to-[#22d3ee] p-2">
                    <div className="h-2 w-1/2 rounded bg-white/80" />
                    <div className="mt-1 h-1.5 w-1/3 rounded bg-white/50" />
                </div>
                <div className="m-3 grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-6 rounded bg-slate-100" />
                    ))}
                </div>
            </div>
        </Browser>
    );
}

function SoftwarePreview() {
    return (
        <Browser url="tunegocio.com/panel">
            <div className="flex h-full bg-[#0b0f1a] text-white">
                <div className="w-1/5 space-y-1.5 border-r border-white/10 p-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded ${i === 0 ? 'bg-[#22d3ee]' : 'bg-white/15'}`}
                        />
                    ))}
                </div>
                <div className="flex-1 space-y-2 p-2">
                    <div className="grid grid-cols-3 gap-1.5">
                        {['Citas', 'Clientes', 'Ventas'].map((k, i) => (
                            <div key={k} className="rounded bg-white/5 p-1.5">
                                <p className="text-[7px] text-white/50">{k}</p>
                                <p className="text-[11px] font-bold text-[#22d3ee]">
                                    {[24, 186, '$4,8M'][i]}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="flex h-16 items-end gap-1 rounded bg-white/5 p-1.5">
                        {[30, 45, 38, 60, 52, 75, 90].map((h, i) => (
                            <div
                                key={i}
                                style={{ height: `${h}%` }}
                                className="flex-1 rounded-sm bg-gradient-to-t from-[#3b5bff] to-[#22d3ee]"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Browser>
    );
}

function AutomationPreview() {
    return (
        <div
            aria-hidden="true"
            className="flex h-full items-center justify-center gap-2 text-[10px] font-semibold sm:gap-3"
        >
            {[
                ['💬', 'Llega un mensaje'],
                ['🤖', 'Se responde solo'],
                ['📅', 'Agenda la cita'],
                ['✅', 'Cobra y avisa'],
            ].map(([icon, label], i, all) => (
                <div key={label} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex w-16 flex-col items-center gap-1.5 text-center sm:w-20">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-card text-lg ring-1 ring-brand-cyan/50 sm:size-12">
                            {icon}
                        </span>
                        <span className="leading-tight text-muted-foreground">
                            {label}
                        </span>
                    </div>
                    {i < all.length - 1 && (
                        <ArrowRight className="mb-5 size-3.5 shrink-0 text-brand-cyan" />
                    )}
                </div>
            ))}
        </div>
    );
}
