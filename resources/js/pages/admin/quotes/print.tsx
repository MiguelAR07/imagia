import { Head, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { BrandWordmark } from '@/components/brand-wordmark';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney } from '@/lib/format';
import { support } from '@/routes/site';
import type { QuoteDetail } from '@/types';

type Props = {
    quote: QuoteDetail;
    recipient: {
        name: string;
        tax_id: string | null;
        email: string | null;
        phone: string | null;
        city: string | null;
    } | null;
    contact: {
        email: string | null;
        phone: string | null;
        whatsapp: string | null;
        city: string | null;
    };
};

/**
 * Documento de la cotización para imprimir o «Guardar como PDF» desde el navegador.
 * Siempre en tema claro, con la marca en el encabezado.
 */
export default function QuotePrint({ quote, recipient, contact }: Props) {
    const { brand } = usePage().props;
    const money = (v: string | number) => formatMoney(v, quote.currency);
    // Dirección completa (con dominio) para que se lea en el PDF impreso.
    const supportUrl = new URL(
        support().url,
        window.location.origin,
    ).href.replace(/^https?:\/\//, '');

    // El documento siempre se ve en claro, aunque el panel esté en oscuro.
    useEffect(() => {
        const root = document.documentElement;
        const wasDark = root.classList.contains('dark');
        root.classList.remove('dark');

        return () => {
            if (wasDark) {
                root.classList.add('dark');
            }
        };
    }, []);

    return (
        <>
            <Head title={`${quote.number} · ${quote.title}`} />
            <style>
                {
                    '@page { size: letter; margin: 14mm; } @media print { .no-print { display: none !important; } body { background: #fff !important; } }'
                }
            </style>

            <div className="min-h-svh bg-muted/60 py-8 print:bg-white print:py-0">
                <div className="no-print mx-auto mb-4 flex max-w-[816px] items-center justify-between gap-3 px-4">
                    <p className="text-sm text-muted-foreground">
                        Usa «Guardar como PDF» en la ventana de impresión.
                    </p>
                    <Button onClick={() => window.print()}>
                        <Printer className="size-4" />
                        Imprimir / Guardar PDF
                    </Button>
                </div>

                <article className="mx-auto max-w-[816px] bg-white px-12 py-12 text-[13px] text-[#0e1118] shadow-sm print:max-w-none print:p-0 print:shadow-none">
                    <header className="flex items-start justify-between gap-6 border-b border-[#e3e6ec] pb-6">
                        <div className="flex items-center gap-3">
                            <AppLogoIcon className="size-12 text-[#0e1118]" />
                            <div>
                                <BrandWordmark className="text-2xl" />
                                <p className="font-mono text-[9px] tracking-[0.24em] text-[#5d6472] uppercase">
                                    {brand.descriptor}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-display text-xl font-bold tracking-wide">
                                COTIZACIÓN
                            </p>
                            <p className="font-mono text-xs text-[#5d6472]">
                                {quote.number}
                            </p>
                            <p className="mt-2 text-xs text-[#5d6472]">
                                Fecha: {formatDate(quote.created_at)}
                            </p>
                            {quote.valid_until && (
                                <p className="text-xs text-[#5d6472]">
                                    Válida hasta:{' '}
                                    {formatDate(quote.valid_until)}
                                </p>
                            )}
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-6 py-6">
                        <div>
                            <p className="mb-1 font-mono text-[10px] tracking-wider text-[#5d6472] uppercase">
                                Para
                            </p>
                            {recipient ? (
                                <>
                                    <p className="font-semibold">
                                        {recipient.name}
                                    </p>
                                    {recipient.tax_id && (
                                        <p className="text-[#5d6472]">
                                            NIT/Documento: {recipient.tax_id}
                                        </p>
                                    )}
                                    {recipient.email && (
                                        <p className="text-[#5d6472]">
                                            {recipient.email}
                                        </p>
                                    )}
                                    {recipient.phone && (
                                        <p className="text-[#5d6472]">
                                            {recipient.phone}
                                        </p>
                                    )}
                                    {recipient.city && (
                                        <p className="text-[#5d6472]">
                                            {recipient.city}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-[#5d6472]">—</p>
                            )}
                        </div>
                        <div>
                            <p className="mb-1 font-mono text-[10px] tracking-wider text-[#5d6472] uppercase">
                                Proyecto
                            </p>
                            <p className="font-semibold">{quote.title}</p>
                        </div>
                    </section>

                    {quote.scope && (
                        <section className="pb-6">
                            <p className="mb-1 font-mono text-[10px] tracking-wider text-[#5d6472] uppercase">
                                Alcance
                            </p>
                            <p className="whitespace-pre-line">{quote.scope}</p>
                        </section>
                    )}

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-[#0e1118] text-left font-mono text-[10px] tracking-wider uppercase">
                                <th className="py-2 pr-2">Concepto</th>
                                <th className="py-2 text-right">Cant.</th>
                                <th className="py-2 text-right">Precio</th>
                                <th className="py-2 text-right">Desc.</th>
                                <th className="py-2 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map((i) => (
                                <tr
                                    key={i.id}
                                    className="break-inside-avoid border-b border-[#e3e6ec] align-top"
                                >
                                    <td className="py-2.5 pr-2">
                                        <p className="font-medium">
                                            {i.description}
                                        </p>
                                        {i.details && (
                                            <p className="text-xs whitespace-pre-line text-[#5d6472]">
                                                {i.details}
                                            </p>
                                        )}
                                        {i.tax && (
                                            <p className="text-xs text-[#5d6472]">
                                                {i.tax}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-2.5 text-right tabular-nums">
                                        {Number(i.quantity)}
                                    </td>
                                    <td className="py-2.5 text-right tabular-nums">
                                        {money(i.unit_price)}
                                    </td>
                                    <td className="py-2.5 text-right tabular-nums">
                                        {Number(i.discount_percent) > 0
                                            ? `${Number(i.discount_percent)} %`
                                            : '—'}
                                    </td>
                                    <td className="py-2.5 text-right tabular-nums">
                                        {money(i.line_total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <section className="mt-4 ml-auto w-72 break-inside-avoid space-y-1.5">
                        <TotalRow
                            label="Subtotal"
                            value={money(quote.subtotal)}
                        />
                        {Number(quote.discount_amount) > 0 && (
                            <TotalRow
                                label="Descuentos"
                                value={`− ${money(quote.discount_amount)}`}
                            />
                        )}
                        <TotalRow
                            label="Impuestos"
                            value={money(quote.tax_amount)}
                        />
                        <div className="flex justify-between border-t-2 border-[#0e1118] pt-2 font-display text-base font-bold">
                            <span>Total</span>
                            <span className="tabular-nums">
                                {money(quote.total)}
                            </span>
                        </div>
                    </section>

                    <section className="mt-8 grid break-inside-avoid grid-cols-2 gap-6">
                        {quote.payment_terms && (
                            <Terms
                                title="Forma de pago"
                                text={quote.payment_terms}
                            />
                        )}
                        {quote.exclusions && (
                            <Terms title="No incluye" text={quote.exclusions} />
                        )}
                        {quote.notes && (
                            <Terms title="Observaciones" text={quote.notes} />
                        )}
                    </section>

                    <p className="mt-8 break-inside-avoid text-[11px] text-[#5d6472]">
                        Al aceptar esta propuesta aceptas también nuestra
                        política de soporte y eximentes de responsabilidad
                        (horario de soporte, canales oficiales y alcance), que
                        puedes consultar en {supportUrl}.
                    </p>

                    <footer className="mt-10 flex items-center justify-between gap-4 border-t border-[#e3e6ec] pt-4 text-[11px] text-[#5d6472]">
                        <span>
                            {[
                                contact.email,
                                contact.phone,
                                contact.whatsapp
                                    ? `WhatsApp +${contact.whatsapp}`
                                    : null,
                                contact.city,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </span>
                        <span className="font-display font-semibold text-[#0e1118]">
                            {brand.tagline}
                        </span>
                    </footer>
                </article>
            </div>
        </>
    );
}

function TotalRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-[#5d6472]">{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    );
}

function Terms({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <p className="mb-1 font-mono text-[10px] tracking-wider text-[#5d6472] uppercase">
                {title}
            </p>
            <p className="whitespace-pre-line">{text}</p>
        </div>
    );
}
