import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandWordmark } from '@/components/brand-wordmark';
import { useCan } from '@/hooks/use-can';
import { dashboard } from '@/routes';
import { edit as editBrand } from '@/routes/admin/brand';
import { index as usersIndex } from '@/routes/admin/users';
import type { LogoPart, OriginPart } from '@/types';

type Props = {
    story: { origin: OriginPart[]; logo_parts: LogoPart[] };
    stats: { active_users: number };
};

const greeting = (): string => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Buenos días';
    }

    return hour < 19 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Dashboard({ story, stats }: Props) {
    const { auth, brand } = usePage().props;
    const can = useCan();
    const firstName = auth.user.name.split(' ')[0];

    return (
        <>
            <Head title="Inicio" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                            Panel de {brand.name}
                        </p>
                        <h1 className="text-2xl font-bold md:text-3xl">
                            {greeting()}, {firstName}
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {stats.active_users}{' '}
                        {stats.active_users === 1
                            ? 'usuario activo'
                            : 'usuarios activos'}{' '}
                        en la plataforma
                    </p>
                </header>

                {/* Identidad: la marca y su significado siempre presentes */}
                <section className="relative overflow-hidden rounded-2xl border bg-card">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-blue/20 blur-3xl"
                    />
                    <div className="relative grid gap-8 p-6 md:grid-cols-[auto_1fr] md:p-8">
                        <div className="flex items-center gap-5">
                            <AppLogoIcon
                                animated
                                className="size-20 text-foreground md:size-24"
                            />
                            <div className="space-y-2">
                                <BrandWordmark className="text-3xl md:text-4xl" />
                                <p className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
                                    {brand.descriptor}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center gap-3 md:border-l md:pl-8">
                            <p className="font-display text-xl font-semibold md:text-2xl">
                                {brand.tagline}
                            </p>
                            {story.origin.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {story.origin.map((o, i) => (
                                        <span key={o.part}>
                                            {i > 0 && ' + '}
                                            <strong className="font-semibold text-foreground">
                                                {o.part}
                                            </strong>{' '}
                                            ({o.meaning})
                                        </span>
                                    ))}
                                </p>
                            )}
                        </div>
                    </div>

                    <ol className="relative grid border-t sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {brand.acronym.map((item, i) => (
                            <li
                                key={`${item.letter}-${i}`}
                                className="flex gap-3 border-b p-4 sm:border-r xl:border-b-0"
                            >
                                <span
                                    className={
                                        'font-display text-3xl leading-none font-extrabold ' +
                                        (i >= brand.acronym.length - 2
                                            ? 'text-brand-gradient'
                                            : '')
                                    }
                                >
                                    {item.letter}
                                </span>
                                <div className="min-w-0 space-y-1">
                                    <p className="text-sm font-semibold">
                                        {item.word}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-2xl border bg-card p-6">
                        <h2 className="text-lg font-semibold">
                            Qué significa el logo
                        </h2>
                        <ul className="mt-4 space-y-4">
                            {story.logo_parts.map((part) => (
                                <li
                                    key={part.shape}
                                    className="grid grid-cols-[8px_1fr] gap-3"
                                >
                                    <span className="mt-2 size-2 rounded-full bg-brand-cyan" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {part.shape}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {part.meaning}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-2xl border bg-card p-6">
                        <h2 className="text-lg font-semibold">Accesos</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Los indicadores de clientes, proyectos y finanzas
                            aparecerán aquí a medida que se habiliten esos
                            módulos.
                        </p>
                        <div className="mt-4 grid gap-2">
                            {can('configuracion.gestionar') && (
                                <QuickLink
                                    href={editBrand().url}
                                    title="Editar marca y siglas"
                                />
                            )}
                            {can('usuarios.gestionar') && (
                                <QuickLink
                                    href={usersIndex().url}
                                    title="Invitar a un colaborador"
                                />
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function QuickLink({ href, title }: { href: string; title: string }) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:border-primary/60 hover:bg-accent"
        >
            {title}
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Inicio', href: dashboard() }],
};
