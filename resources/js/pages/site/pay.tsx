import { Head, usePage } from '@inertiajs/react';
import {
    Ban,
    CheckCircle2,
    CreditCard,
    Landmark,
    Lock,
    Smartphone,
    TriangleAlert,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { formatDate, formatMoney } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import type { SiteProps } from '@/types';

type Props = SiteProps & {
    link: {
        description: string;
        amount: string;
        currency: string;
        status: 'pending' | 'paid' | 'cancelled';
        last_transaction_status: string | null;
        project: string | null;
        client: string | null;
        paid_at: string | null;
    };
    checkout: {
        url: string;
        fields: Record<string, string | number>;
        sandbox: boolean;
    } | null;
};

const FAILED: Record<string, string> = {
    DECLINED:
        'Tu último intento de pago fue rechazado por el banco. Puedes intentarlo de nuevo o con otro medio de pago.',
    VOIDED: 'Tu último intento de pago fue anulado. Puedes intentarlo de nuevo.',
    ERROR: 'Hubo un error con tu último intento de pago. Puedes intentarlo de nuevo.',
    PENDING:
        'Tu pago está en proceso. Si ya pagaste, espera unos minutos y recarga esta página antes de volver a pagar.',
};

/**
 * Página del link de pago. El botón envía al checkout seguro de Wompi con los datos
 * firmados en el servidor; el pago se confirma con Wompi, no con esta página.
 */
export default function Pay({ link, checkout, seoTitle, site }: Props) {
    const { brand } = usePage<Props>().props;
    const amount = formatMoney(link.amount, link.currency);
    const help = whatsappLink(
        site.contact.whatsapp,
        `Hola, tengo una pregunta sobre el pago de ${link.description} (${amount}).`,
    );

    return (
        <>
            <Head title={seoTitle} />

            <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-14">
                <div className="overflow-hidden rounded-3xl border bg-card shadow-[0_30px_80px_-40px_rgba(59,91,255,.6)]">
                    <div className="flex items-center gap-3 border-b px-6 py-4">
                        <AppLogoIcon className="size-8" />
                        <div>
                            <p className="font-semibold">{brand.name}</p>
                            <p className="text-xs text-muted-foreground">
                                Pago en línea
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 p-6">
                        <div>
                            <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                {link.project}
                                {link.client && ` · ${link.client}`}
                            </p>
                            <h1 className="mt-1 text-xl font-bold">
                                {link.description}
                            </h1>
                            <p className="mt-3 font-display text-4xl font-black tabular-nums">
                                {amount}
                            </p>
                        </div>

                        {link.status === 'paid' && (
                            <div
                                role="status"
                                className="flex gap-3 rounded-xl border border-success/40 bg-success/10 p-4 text-sm"
                            >
                                <CheckCircle2 className="size-5 shrink-0 text-success" />
                                <p>
                                    <strong>¡Pago recibido!</strong> Wompi
                                    confirmó tu pago
                                    {link.paid_at &&
                                        ` el ${formatDate(link.paid_at)}`}
                                    . Gracias.
                                </p>
                            </div>
                        )}

                        {link.status === 'cancelled' && (
                            <div className="flex gap-3 rounded-xl border p-4 text-sm text-muted-foreground">
                                <Ban className="size-5 shrink-0" />
                                Este link de pago ya no está disponible.
                                Escríbenos si necesitas uno nuevo.
                            </div>
                        )}

                        {link.status === 'pending' && (
                            <>
                                {link.last_transaction_status &&
                                    FAILED[link.last_transaction_status] && (
                                        <div
                                            role="alert"
                                            className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm"
                                        >
                                            <TriangleAlert className="size-5 shrink-0 text-warning" />
                                            {
                                                FAILED[
                                                    link.last_transaction_status
                                                ]
                                            }
                                        </div>
                                    )}

                                {checkout ? (
                                    <form
                                        action={checkout.url}
                                        method="GET"
                                        className="space-y-4"
                                    >
                                        {Object.entries(checkout.fields).map(
                                            ([name, value]) => (
                                                <input
                                                    key={name}
                                                    type="hidden"
                                                    name={name}
                                                    value={value}
                                                />
                                            ),
                                        )}
                                        <ul className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                                            <li className="rounded-lg border p-3">
                                                <CreditCard className="mx-auto mb-1 size-5 text-brand-cyan" />
                                                Tarjeta (también a cuotas)
                                            </li>
                                            <li className="rounded-lg border p-3">
                                                <Landmark className="mx-auto mb-1 size-5 text-brand-cyan" />
                                                PSE
                                            </li>
                                            <li className="rounded-lg border p-3">
                                                <Smartphone className="mx-auto mb-1 size-5 text-brand-cyan" />
                                                Nequi
                                            </li>
                                        </ul>
                                        <button
                                            type="submit"
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3b5bff] to-[#22d3ee] px-5 py-3.5 font-semibold text-white shadow-[0_10px_30px_rgba(59,91,255,.4)] transition-transform motion-safe:hover:-translate-y-0.5"
                                        >
                                            <Lock className="size-4" />
                                            Pagar {amount} con Wompi
                                        </button>
                                        <p className="text-center text-xs text-muted-foreground">
                                            Serás llevado al sitio seguro de
                                            Wompi (Bancolombia). No guardamos
                                            los datos de tu tarjeta.
                                        </p>
                                        {checkout.sandbox && (
                                            <p className="rounded-lg bg-brand-cyan/10 p-2 text-center text-xs text-brand-cyan">
                                                Modo de prueba: no se cobra
                                                dinero real.
                                            </p>
                                        )}
                                    </form>
                                ) : (
                                    <p className="rounded-xl border p-4 text-sm text-muted-foreground">
                                        Los pagos en línea no están disponibles
                                        en este momento. Escríbenos para acordar
                                        otro medio de pago.
                                    </p>
                                )}
                            </>
                        )}

                        {help && (
                            <a
                                href={help}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                            >
                                ¿Tienes dudas? Escríbenos por WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
