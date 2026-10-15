import { router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ExpenseDialog } from '@/components/finance/expense-dialog';
import { MoneyStat } from '@/components/finance/money-chart';
import { OnlinePayments } from '@/components/finance/online-payments';
import { PaymentDialog } from '@/components/finance/payment-dialog';
import { Button } from '@/components/ui/button';
import { formatDate, formatMoney } from '@/lib/format';
import { destroy as destroyExpense } from '@/routes/admin/finance/expenses';
import { destroy as destroyPayment } from '@/routes/admin/finance/payments';
import type { ExpenseRow, PaymentRow, ProjectFinance } from '@/types';

/** Pestaña de dinero en la ficha del proyecto: contratado, recibido, por cobrar y gastos. */
export function ProjectFinancePanel({
    projectId,
    projectName,
    currency,
    finance,
    canManage,
}: {
    projectId: number;
    projectName: string;
    currency: string;
    finance: ProjectFinance;
    canManage: boolean;
}) {
    const [payment, setPayment] = useState<PaymentRow | 'new' | null>(null);
    const [expense, setExpense] = useState<ExpenseRow | 'new' | null>(null);
    const methodLabel = (v: string) =>
        finance.methods.find((m) => m.value === v)?.label ?? v;
    const paidPercent =
        finance.agreed && finance.agreed > 0
            ? Math.min(
                  100,
                  Math.round((finance.received / finance.agreed) * 100),
              )
            : null;

    return (
        <div className="space-y-6">
            <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
                <MoneyStat
                    label="Recibido"
                    value={finance.received}
                    currency={currency}
                    tone="brand"
                    hint={
                        paidPercent !== null
                            ? `${paidPercent}% de ${formatMoney(finance.agreed, currency)}`
                            : 'Sin valor contratado definido'
                    }
                />
                <MoneyStat
                    label="Por cobrar"
                    value={finance.pending ?? 0}
                    currency={currency}
                    hint={
                        finance.pending === null
                            ? 'Define el valor contratado en «Editar»'
                            : undefined
                    }
                />
                <MoneyStat
                    label="Gastos del proyecto"
                    value={finance.expenses}
                    currency={currency}
                />
                <MoneyStat
                    label="Utilidad"
                    value={finance.profit}
                    currency={currency}
                    tone={finance.profit < 0 ? 'negative' : 'positive'}
                    hint="Recibido menos gastos"
                />
            </section>

            {paidPercent !== null && (
                <div
                    role="progressbar"
                    aria-label="Porcentaje cobrado"
                    aria-valuenow={paidPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                >
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3b5bff] to-[#22d3ee]"
                        style={{ width: `${paidPercent}%` }}
                    />
                </div>
            )}

            <OnlinePayments
                projectId={projectId}
                projectName={projectName}
                online={finance.online}
                pending={finance.pending}
                canManage={canManage}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="font-semibold">Pagos recibidos</h3>
                        {canManage && finance.pending !== 0 && (
                            <Button size="sm" onClick={() => setPayment('new')}>
                                <Plus className="size-4" />
                                Registrar pago
                            </Button>
                        )}
                    </div>
                    {finance.payments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aún no hay pagos registrados.
                        </p>
                    ) : (
                        <ul className="divide-y text-sm">
                            {finance.payments.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex items-center gap-3 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-mono font-medium tabular-nums">
                                            {formatMoney(p.amount, p.currency)}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {formatDate(p.paid_on)} ·{' '}
                                            {methodLabel(p.method)}
                                            {p.reference && ` · ${p.reference}`}
                                        </p>
                                    </div>
                                    {canManage && (
                                        <Actions
                                            onEdit={() => setPayment(p)}
                                            title="Eliminar pago"
                                            text={`Se elimina el pago de ${formatMoney(p.amount, p.currency)} del ${formatDate(p.paid_on)}.`}
                                            onDelete={(done) =>
                                                router.delete(
                                                    destroyPayment(p.id).url,
                                                    {
                                                        preserveScroll: true,
                                                        onFinish: done,
                                                    },
                                                )
                                            }
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="font-semibold">Gastos</h3>
                        {canManage && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setExpense('new')}
                            >
                                <Plus className="size-4" />
                                Registrar gasto
                            </Button>
                        )}
                    </div>
                    {finance.expense_items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Sin gastos asociados a este proyecto.
                        </p>
                    ) : (
                        <ul className="divide-y text-sm">
                            {finance.expense_items.map((e) => (
                                <li
                                    key={e.id}
                                    className="flex items-center gap-3 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">
                                            {e.description}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {formatDate(e.spent_on)}
                                            {e.category && ` · ${e.category}`}
                                        </p>
                                    </div>
                                    <span className="font-mono tabular-nums">
                                        {formatMoney(e.amount, e.currency)}
                                    </span>
                                    {canManage && (
                                        <Actions
                                            onEdit={() => setExpense(e)}
                                            title="Eliminar gasto"
                                            text={`Se elimina «${e.description}».`}
                                            onDelete={(done) =>
                                                router.delete(
                                                    destroyExpense(e.id).url,
                                                    {
                                                        preserveScroll: true,
                                                        onFinish: done,
                                                    },
                                                )
                                            }
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {payment && (
                <PaymentDialog
                    payment={payment === 'new' ? undefined : payment}
                    projectId={projectId}
                    pending={finance.pending}
                    currency={currency}
                    methods={finance.methods}
                    onClose={() => setPayment(null)}
                />
            )}
            {expense && (
                <ExpenseDialog
                    expense={expense === 'new' ? undefined : expense}
                    projectId={projectId}
                    categories={finance.categories}
                    onClose={() => setExpense(null)}
                />
            )}
        </div>
    );
}

function Actions({
    onEdit,
    title,
    text,
    onDelete,
}: {
    onEdit: () => void;
    title: string;
    text: string;
    onDelete: (done: () => void) => void;
}) {
    return (
        <div className="flex shrink-0">
            <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={onEdit}
            >
                <Pencil className="size-4" />
            </Button>
            <ConfirmDialog
                trigger={
                    <Button variant="ghost" size="icon" aria-label="Eliminar">
                        <Trash2 className="size-4" />
                    </Button>
                }
                title={title}
                description={text}
                confirmLabel="Eliminar"
                destructive
                onConfirm={onDelete}
            />
        </div>
    );
}
