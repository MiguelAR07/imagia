import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowUpRight,
    Globe,
    LayoutDashboard,
    Lightbulb,
    Rocket,
    Settings2,
    Workflow,
} from 'lucide-react';
import { SectionHeading } from '@/components/site/section-heading';
import { project } from '@/routes/site';
import type { SiteProps } from '@/types';

export type Explainer = {
    key: string;
    icon: LucideIcon;
    title: string;
    /** Comparación fácil de entender. */
    analogy: string;
    what: string;
    idealFor: string;
    example?: { slug: string; text: string };
};

/**
 * Qué es cada cosa, en palabras sencillas. Los ejemplos enlazan a proyectos reales
 * del portafolio solo si están publicados.
 */
export const EXPLAINERS: Explainer[] = [
    {
        key: 'landing',
        icon: Rocket,
        title: 'Landing page',
        analogy: 'Es como un volante o un afiche, pero en internet.',
        what: 'Una sola página, enfocada en un producto, servicio o promoción, con un objetivo claro: que la persona te escriba o te compre (por WhatsApp o un formulario).',
        idealFor:
            'Emprendimientos que están empezando, campañas en redes sociales o lanzar algo nuevo rápido.',
        example: {
            slug: 'natural-love',
            text: 'Natural Love: muestra sus productos y lleva cada pedido a WhatsApp.',
        },
    },
    {
        key: 'website',
        icon: Globe,
        title: 'Página web',
        analogy: 'Es tu local en internet, abierto las 24 horas.',
        what: 'Un sitio con varias secciones (inicio, servicios, quiénes somos, galería, contacto) que presenta tu negocio completo, da confianza y ayuda a que te encuentren en Google.',
        idealFor:
            'Negocios que ofrecen varios servicios y quieren verse profesionales y confiables.',
        example: {
            slug: 'glamping-los-bosques',
            text: 'Glamping Los Bosques: presenta sus cabañas, promociones y ubicación.',
        },
    },
    {
        key: 'panel',
        icon: LayoutDashboard,
        title: 'Panel de control',
        analogy:
            'Es la oficina privada de tu negocio: la página web es la vitrina, el panel es donde manejas todo.',
        what: 'Una parte privada a la que solo entran tú y tu equipo con usuario y contraseña. Desde ahí cambias textos y fotos, y ves reservas, clientes o pagos, sin saber programar.',
        idealFor:
            'Quien quiere actualizar su información sin depender de nadie, o controlar lo que pasa en su negocio desde el celular o el computador.',
        example: {
            slug: 'zona-elite',
            text: 'Zona Élite: el equipo programa horarios y ve qué atletas reservaron cada turno.',
        },
    },
    {
        key: 'management',
        icon: Settings2,
        title: 'Software de gestión',
        analogy:
            'Reemplaza el cuaderno, el Excel y los mensajes sueltos por un solo sistema ordenado.',
        what: 'Un sistema hecho a la medida para organizar tu negocio: citas o reservas, clientes, inventario, pagos y reportes, todo conectado y con permisos para cada persona del equipo.',
        idealFor:
            'Negocios que ya tienen clientes y procesos, y sienten que se les está saliendo de las manos.',
        example: {
            slug: 'glamping-los-bosques',
            text: 'Glamping Los Bosques: reservas, pagos, saldos, facturas y 13 módulos en un panel.',
        },
    },
    {
        key: 'automation',
        icon: Workflow,
        title: 'Automatización',
        analogy:
            'Es como tener un asistente que nunca olvida hacer las tareas repetitivas.',
        what: 'Hacemos que ciertas tareas se hagan solas: enviar recordatorios, generar reportes, avisar cuando algo pasa o pasar datos de una herramienta a otra.',
        idealFor:
            'Quien pierde horas cada semana copiando datos, respondiendo lo mismo o recordando pagos.',
    },
];

/** «¿Con o sin panel?»: la duda más común al elegir una página web. */
function PanelOrNot() {
    return (
        <div className="grid gap-4 rounded-2xl border bg-card p-6 md:grid-cols-2">
            <div>
                <p className="font-semibold">Página web sin panel</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Cuando quieras cambiar un texto, una foto o un precio, nos
                    lo pides y nosotros lo hacemos. Ideal si la información
                    cambia poco.
                </p>
            </div>
            <div>
                <p className="font-semibold">Página web con panel</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Entras con tu usuario y cambias tú mismo textos, fotos,
                    servicios o productos cuando quieras. Ideal si actualizas
                    seguido o tienes catálogo.
                </p>
            </div>
        </div>
    );
}

/**
 * Sección «¿Qué es cada cosa?» para el sitio público.
 */
export function Explainers({
    title = '¿Qué es cada cosa?',
    description = 'Sin palabras técnicas: así puedes saber qué necesita tu negocio.',
}: {
    title?: string;
    description?: string;
}) {
    const { site } = usePage<SiteProps>().props;

    return (
        <section className="space-y-8">
            <SectionHeading
                eyebrow="Guía rápida"
                title={title}
                description={description}
            />
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {EXPLAINERS.map((e) => {
                    const Icon = e.icon;
                    const showExample =
                        e.example && site.portfolio.includes(e.example.slug);

                    return (
                        <li
                            key={e.key}
                            id={`que-es-${e.key}`}
                            className="flex scroll-mt-24 flex-col rounded-2xl border bg-card p-6"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/15">
                                    <Icon className="size-5 text-brand-cyan" />
                                </span>
                                <h3 className="text-lg font-bold">{e.title}</h3>
                            </div>
                            <p className="mt-4 flex gap-2 rounded-xl bg-brand-cyan/10 p-3 text-sm font-medium">
                                <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                                {e.analogy}
                            </p>
                            <p className="mt-4 text-sm text-muted-foreground">
                                {e.what}
                            </p>
                            <p className="mt-3 text-sm">
                                <span className="font-semibold">
                                    Ideal para:{' '}
                                </span>
                                <span className="text-muted-foreground">
                                    {e.idealFor}
                                </span>
                            </p>
                            {showExample && e.example && (
                                <Link
                                    href={project(e.example.slug)}
                                    className="mt-auto flex items-start gap-2 pt-4 text-sm text-brand-cyan hover:underline"
                                >
                                    <ArrowUpRight className="mt-0.5 size-4 shrink-0" />
                                    Ejemplo: {e.example.text}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ul>
            <PanelOrNot />
        </section>
    );
}
