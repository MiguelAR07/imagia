import { router, useForm } from '@inertiajs/react';
import {
    Ban,
    Check,
    Copy,
    CreditCard,
    ExternalLink,
    MessageCircle,
    PackageCheck,
    Plus,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import { StatusBadge } from '@/components/status-badge';
import type { Tone } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDate, formatMoney } from '@/lib/format';
import { cancel, store } from '@/routes/admin/finance/links';
import type { PaymentLinkRow, ProjectFinance } from '@/types';

const STATUS: Record<PaymentLinkRow['status'], { label: string; tone: Tone }> =
    {
        pending: { label: 'Pendiente', tone: 'warning' },
        paid: { label: 'Pagado', tone: 'success' },
        cancelled: { label: 'Anulado', tone: 'neutral' },
    };

const ATTEMPT: Record<string, string> = {
    DECLINED: 'El último intento fue rechazado',
    VOIDED: 'El último intento fue anulado',
    ERROR: 'El último intento tuvo un error',
    PENDING: 'Hay un pago en proceso',
    MISMATCH: 'Un intento no coincidía con el valor',
};

/**
 * Links de pago con Wompi: el cliente paga con tarjeta (también a cuotas), PSE o Nequi
 * y el pago se registra solo cuando Wompi lo confirma.
 */
export function OnlinePayments({
    projectId,
    projectName,
    online,
    pending,
    canManage,
}: {
    projectId: number;
    projectName: string;
    online: ProjectFinance['online'];
    pending: number | null;
    canManage: boolean;
}) {
    const [creating, setCreating] = useState<'balance' | 'custom' | null>(null);
    // Con un pago en línea ya recibido (p. ej. el anticipo), lo siguiente es el saldo final.
    const balanceDue =
        pending !== null &&
        pending > 0 &&
        online.links.some((l) => l.status === 'paid') &&
        !online.links.some((l) => l.status === 'pending');
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState<number | null>(null);

    const copyLink = async (link: PaymentLinkRow) => {
        if (await copy(link.url)) {
            setCopied(link.id);
            setTimeout(() => setCopied(null), 2000);
        }
    };

    const whatsapp = (link: PaymentLinkRow) =>
        `https://wa.me/?text=${encodeURIComponent(
            `Hola, este es el link para pagar ${link.description} (${formatMoney(link.amount, link.currency)}) del proyecto ${projectName}. Puedes pagar con tarjeta (también a cuotas), PSE o Nequi:\n${link.url}`,
        )}`;

    return (
        <section className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                        <CreditCard className="size-4 text-brand-cyan" />
                        Cobro en línea
                        {online.sandbox && (
                            <StatusBadge tone="info">
                                Modo de prueba
                            </StatusBadge>
                        )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        El cliente paga con tarjeta (también a cuotas), PSE o
                        Nequi. El pago se registra solo cuando Wompi lo
                        confirma.
                    </p>
                </div>
                {canManage && online.enabled && pending !== 0 && (
                    <div className="flex flex-wrap gap-2">
                        {balanceDue && (
                            <Button
                                size="sm"
                                onClick={() => setCreating('balance')}
                            >
                                <PackageCheck className="size-4" />
                                Cobrar saldo final
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant={balanceDue ? 'outline' : 'default'}
                            onClick={() => setCreating('custom')}
                        >
                            <Plus className="size-4" />
                            {balanceDue ? 'Otro valor' : 'Crear link de pago'}
                        </Button>
                    </div>
                )}
            </div>

            {!online.enabled ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Para cobrar en línea, agrega las llaves de Wompi en el
                    archivo <code>.env</code> (WOMPI_PUBLIC_KEY,
                    WOMPI_INTEGRITY_SECRET y WOMPI_EVENTS_SECRET).
                </p>
            ) : online.links.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Aún no hay links de pago. Crea uno, por ejemplo, para el
                    anticipo.
                </p>
            ) : (
                <ul className="divide-y text-sm">
                    {online.links.map((link) => (
                        <li
                            key={link.id}
                            className="flex flex-wrap items-center gap-3 py-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono font-medium tabular-nums">
                                        {formatMoney(
                                            link.amount,
                                            link.currency,
                                        )}
                                    </span>
                                    <StatusBadge
                                        tone={STATUS[link.status].tone}
                                    >
                                        {STATUS[link.status].label}
                                    </StatusBadge>
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {link.description} ·{' '}
                                    {link.status === 'paid'
                                        ? `pagado el ${formatDate(link.paid_at)}${link.payment_method_type ? ` con ${link.payment_method_type}` : ''}`
                                        : `creado el ${formatDate(link.created_at)}`}
                                </p>
                                {link.status === 'pending' &&
                                    link.last_transaction_status &&
                                    ATTEMPT[link.last_transaction_status] && (
                                        <p className="text-xs text-warning">
                                            {
                                                ATTEMPT[
                                                    link.last_transaction_status
                                                ]
                                            }
                                        </p>
                                    )}
                            </div>
                            {link.status === 'pending' && (
                                <div className="flex shrink-0 gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void copyLink(link)}
                                    >
                                        {copied === link.id ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <Copy className="size-4" />
                                        )}
                                        {copied === link.id
                                            ? 'Copiado'
                                            : 'Copiar'}
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={whatsapp(link)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <MessageCircle className="size-4" />
                                            WhatsApp
                                        </a>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        aria-label="Abrir la página de pago"
                                    >
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="size-4" />
                                        </a>
                                    </Button>
                                    {canManage && (
                                        <ConfirmDialog
                                            trigger={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label="Anular link"
                                                >
                                                    <Ban className="size-4" />
                                                </Button>
                                            }
                                            title="Anular link de pago"
                                            description="El cliente ya no podrá pagar con este link."
                                            confirmLabel="Anular"
                                            destructive
                                            onConfirm={(done) =>
                                                router.patch(
                                                    cancel(link.id).url,
                                                    {},
                                                    {
                                                        preserveScroll: true,
                                                        onFinish: done,
                                                    },
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {creating && (
                <CreateLinkDialog
                    projectId={projectId}
                    pending={pending}
                    balance={creating === 'balance'}
                    onClose={() => setCreating(null)}
                />
            )}
        </section>
    );
}

function CreateLinkDialog({
    projectId,
    pending,
    balance,
    onClose,
}: {
    projectId: number;
    pending: number | null;
    balance: boolean;
    onClose: () => void;
}) {
    const form = useForm({
        amount: pending
            ? String(Math.round(balance ? pending : pending / 2))
            : '',
        description: balance
            ? 'Saldo final (entrega del proyecto)'
            : pending
              ? 'Anticipo del 50 %'
              : '',
        kind: balance ? 'balance' : 'other',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(store(projectId).url, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {balance ? 'Cobrar saldo final' : 'Crear link de pago'}
                    </DialogTitle>
                    <DialogDescription>
                        {balance
                            ? 'Envíaselo al cliente al entregarle el proyecto. Cuando pague, el proyecto queda pagado y se registra solo en Finanzas.'
                            : 'Envíaselo al cliente. Cuando pague, se registra solo en Finanzas.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <FormField
                        id="link-description"
                        label="Concepto"
                        error={form.errors.description}
                    >
                        <Input
                            id="link-description"
                            value={form.data.description}
                            maxLength={120}
                            placeholder="Ej.: Anticipo del 50 %, Saldo final"
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    <FormField
                        id="link-amount"
                        label="Valor (COP)"
                        error={form.errors.amount}
                        hint={
                            pending !== null
                                ? `Falta por cobrar: ${formatMoney(pending, 'COP')}`
                                : undefined
                        }
                    >
                        <Input
                            id="link-amount"
                            type="number"
                            inputMode="numeric"
                            min="1500"
                            step="1"
                            value={form.data.amount}
                            onChange={(e) =>
                                form.setData('amount', e.target.value)
                            }
                            required
                        />
                    </FormField>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Crear link
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
