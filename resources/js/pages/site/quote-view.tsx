import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, Lock } from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { formatDate, formatMoney } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import { support, terms } from '@/routes/site';
import { accept } from '@/routes/site/quote';
import type { SiteProps } from '@/types';

type Props = SiteProps & {
    token: string;
    quote: {
        number: string;
        title: string;
        scope: string | null;
        status: string;
        currency: string;
        subtotal: string;
        discount_amount: string;
        tax_amount: string;
        total: string;
        payment_terms: string | null;
        exclusions: string | null;
        notes: string | null;
        recipient: string | null;
        valid_until: string | null;
        expired: boolean;
        items: {
            description: string;
            details: string | null;
            quantity: string;
            unit_price: string;
            discount_percent: string;
            line_total: number;
        }[];
    };
    deposit: {
        percent: number;
        amount: number;
        paid: boolean;
        payable: boolean;
    };
};

/**
 * La cotización vista por el cliente: la revisa, la acepta pagando el anticipo
 * y el saldo se paga al entregar el proyecto.
 */
export default function QuoteView({
    token,
    quote,
    deposit,
    seoTitle,
    site,
}: Props) {
    const { brand } = usePage<Props>().props;
    const [sending, setSending] = useState(false);
    const money = (v: string | number) => formatMoney(v, quote.currency);
    const balance = Number(quote.total) - deposit.amount;
    const help = whatsappLink(
        site.contact.whatsapp,
        `Hola, tengo una pregunta sobre la cotización ${quote.number}.`,
    );

    const acceptAndPay = () => {
        setSending(true);
        router.post(
            accept(token).url,
            {},
            {
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <>
            <Head title={seoTitle} />

            <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:px-8 lg:grid-cols-[1.6fr_1fr]">
                <article className="rounded-3xl border bg-card p-6 md:p-10">
                    <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-3">
                            <AppLogoIcon className="size-9" />
                            <div>
                                <p className="font-semibold">{brand.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    Propuesta comercial
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-mono">{quote.number}</p>
                            {quote.valid_until && (
                                <p className="text-muted-foreground">
                                    Válida hasta {formatDate(quote.valid_until)}
                                </p>
                            )}
                        </div>
                    </header>

                    <div className="py-6">
                        {quote.recipient && (
                            <p className="text-sm text-muted-foreground">
                                Para {quote.recipient}
                            </p>
                        )}
                        <h1 className="mt-1 text-3xl font-black tracking-tight">
                            {quote.title}
                        </h1>
                        {quote.scope && (
                            <p className="mt-3 whitespace-pre-line text-muted-foreground">
                                {quote.scope}
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead>
                                <tr className="border-y text-left text-xs text-muted-foreground">
                                    <th className="py-3 font-medium">
                                        Concepto
                                    </th>
                                    <th className="py-3 text-right font-medium">
                                        Cant.
                                    </th>
                                    <th className="py-3 text-right font-medium">
                                        Valor
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.items.map((i, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="py-3 pr-4">
                                            <p className="font-medium">
                                                {i.description}
                                            </p>
                                            {i.details && (
                                                <p className="text-xs whitespace-pre-line text-muted-foreground">
                                                    {i.details}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-3 text-right tabular-nums">
                                            {Number(i.quantity)}
                                        </td>
                                        <td className="py-3 text-right font-mono tabular-nums">
                                            {money(i.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                        <Row label="Subtotal" value={money(quote.subtotal)} />
                        {Number(quote.discount_amount) > 0 && (
                            <Row
                                label="Descuento"
                                value={`− ${money(quote.discount_amount)}`}
                            />
                        )}
                        {Number(quote.tax_amount) > 0 && (
                            <Row
                                label="Impuestos"
                                value={money(quote.tax_amount)}
                            />
                        )}
                        <div className="flex justify-between border-t pt-2 text-base font-bold">
                            <dt>Total</dt>
                            <dd className="font-mono tabular-nums">
                                {money(quote.total)}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
                        {quote.exclusions && (
                            <Block title="No incluye" text={quote.exclusions} />
                        )}
                        {quote.notes && (
                            <Block title="Observaciones" text={quote.notes} />
                        )}
                    </div>
                </article>

                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-3xl border bg-card p-6">
                        {deposit.paid || quote.status === 'accepted' ? (
                            <div className="flex gap-3">
                                <CheckCircle2 className="size-5 shrink-0 text-success" />
                                <div>
                                    <p className="font-semibold">
                                        Propuesta aceptada
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {deposit.paid
                                            ? 'Recibimos tu anticipo. El saldo se paga cuando te entreguemos el proyecto.'
                                            : 'Esta propuesta ya fue aceptada.'}
                                    </p>
                                </div>
                            </div>
                        ) : quote.expired ? (
                            <div className="flex gap-3">
                                <Clock className="size-5 shrink-0 text-warning" />
                                <p className="text-sm text-muted-foreground">
                                    Esta propuesta venció. Escríbenos y te
                                    enviamos una actualizada.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-semibold">
                                    ¿Cómo se paga?
                                </p>
                                <ol className="mt-4 space-y-4 text-sm">
                                    <li className="flex gap-3">
                                        <Step n={1} active />
                                        <div>
                                            <p className="font-medium">
                                                Al aceptar: {deposit.percent} %
                                            </p>
                                            <p className="font-display text-2xl font-bold tabular-nums">
                                                {money(deposit.amount)}
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <Step n={2} />
                                        <div>
                                            <p className="font-medium">
                                                Al entregar:{' '}
                                                {100 - deposit.percent} %
                                            </p>
                                            <p className="text-muted-foreground tabular-nums">
                                                {money(balance)}
                                            </p>
                                        </div>
                                    </li>
                                </ol>

                                {deposit.payable ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={acceptAndPay}
                                            disabled={sending}
                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 disabled:opacity-60"
                                        >
                                            <Lock className="size-4" />
                                            Aceptar y pagar{' '}
                                            {money(deposit.amount)}
                                        </button>
                                        <p className="mt-3 text-center text-xs text-muted-foreground">
                                            Tarjeta (también a cuotas), PSE o
                                            Nequi, con Wompi.
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-6 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                                        Para aceptar esta propuesta, escríbenos
                                        y acordamos el pago.
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    <p className="px-2 text-xs text-muted-foreground">
                        Al aceptar, aceptas también nuestros{' '}
                        <Link href={terms()} className="underline">
                            términos
                        </Link>{' '}
                        y la{' '}
                        <Link href={support()} className="underline">
                            política de soporte
                        </Link>
                        .
                    </p>
                    {help && (
                        <a
                            href={help}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            ¿Tienes dudas? Escríbenos por WhatsApp
                        </a>
                    )}
                </aside>
            </section>
        </>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono tabular-nums">{value}</dd>
        </div>
    );
}

function Block({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {title}
            </p>
            <p className="whitespace-pre-line text-muted-foreground">{text}</p>
        </div>
    );
}

function Step({ n, active = false }: { n: number; active?: boolean }) {
    return (
        <span
            className={
                active
                    ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background'
                    : 'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground'
            }
        >
            {n}
        </span>
    );
}
