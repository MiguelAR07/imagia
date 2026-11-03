import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { planPriceLabel } from '@/lib/plan-price';
import { service as serviceRoute } from '@/routes/site';
import type { PublicPlan, PublicService } from '@/types';

type Line = {
    /** Slug del servicio en la base de datos. */
    slug: string;
    /** Como la gente lo busca y lo oye nombrar. */
    term: string;
    /** Qué es, comparado con algo que todos conocen. */
    meaning: string;
    /** Qué es, en una sola frase. */
    what: string;
    idealFor: string;
    /** Captura de un proyecto real del portafolio. */
    example: { image: string; project: string; url: string };
};

/**
 * Las cuatro cosas que construimos, explicadas para quien no es del medio:
 * un proyecto real de ejemplo, la palabra con una comparación sencilla y una sola frase.
 */
const LINES: Line[] = [
    {
        slug: 'landing-pages',
        term: 'Landing page',
        meaning: 'como un volante, pero en internet',
        what: 'Una sola página para vender un producto o una promoción y recibir mensajes por WhatsApp.',
        idealFor: 'Emprendimientos y campañas en redes',
        example: {
            image: '/img/ejemplos/landing-natural-love.webp',
            project: 'Natural Love',
            url: 'naturallove.com.co',
        },
    },
    {
        slug: 'paginas-web',
        term: 'Página web',
        meaning: 'tu local abierto 24 horas en internet',
        what: 'Varias secciones —inicio, servicios, galería y contacto— para que te encuentren y confíen en ti.',
        idealFor: 'Negocios que quieren verse profesionales',
        example: {
            image: '/img/ejemplos/web-glamping.webp',
            project: 'Glamping Los Bosques',
            url: 'glampinglosbosques.com',
        },
    },
    {
        slug: 'software-de-gestion',
        term: 'Software',
        meaning: 'el cuaderno de tu negocio, pero en el computador',
        what: 'Un programa para manejar citas, clientes, inventario y pagos desde el celular o el computador.',
        idealFor: 'Negocios que ya no dan abasto con cuaderno y Excel',
        example: {
            image: '/img/ejemplos/software-glamping.webp',
            project: 'Glamping Los Bosques · panel',
            url: 'glampinglosbosques.com/admin',
        },
    },
    {
        slug: 'automatizacion-empresarial',
        term: 'Automatización',
        meaning: 'un ayudante que trabaja solo',
        what: 'Respuestas, recordatorios, reservas y cobros que pasan solos, sin que tengas que estar pendiente.',
        idealFor: 'Quien responde lo mismo todo el día',
        example: {
            image: '/img/ejemplos/automatizacion-zona-elite.webp',
            project: 'Zona Élite · reservas solas',
            url: 'zonaelitemarinilla.com',
        },
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
                            <div className="relative overflow-hidden border-b bg-[radial-gradient(120%_90%_at_50%_0%,rgba(59,91,255,.22),transparent_70%)] px-6 pt-6">
                                <div className="overflow-hidden rounded-t-xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,.7)] transition-transform duration-500 group-hover:-translate-y-1">
                                    <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
                                        <i className="size-2 rounded-full bg-[#ff5f57]" />
                                        <i className="size-2 rounded-full bg-[#febc2e]" />
                                        <i className="size-2 rounded-full bg-[#28c840]" />
                                        <span className="ml-2 truncate rounded bg-white px-2 py-0.5 text-[10px] text-slate-500">
                                            {l.example.url}
                                        </span>
                                    </div>
                                    <img
                                        src={l.example.image}
                                        alt={`Ejemplo real de ${l.term}: ${l.example.project}`}
                                        loading="lazy"
                                        width={1200}
                                        height={750}
                                        className="aspect-[16/10] w-full object-cover object-top"
                                    />
                                </div>
                                <span className="absolute top-9 right-9 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                                    Ejemplo real
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col gap-3 p-6">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {l.example.project}
                                    </p>
                                    <h3 className="mt-1 text-2xl font-black tracking-tight">
                                        {l.term}
                                    </h3>
                                    <p className="mt-1 text-sm text-brand-cyan">
                                        = {l.meaning}
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
                                    Ver más y precios
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
