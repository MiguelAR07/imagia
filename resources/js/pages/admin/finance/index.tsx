import { Head, Link, router } from '@inertiajs/react';
import { Download, Pencil, Plus, Repeat, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ExpenseDialog } from '@/components/finance/expense-dialog';
import { MoneyChart, MoneyStat } from '@/components/finance/money-chart';
import { PaymentDialog } from '@/components/finance/payment-dialog';
import { OptionSelect } from '@/components/option-select';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { exportMethod, index } from '@/routes/admin/finance';
import { destroy as destroyExpense } from '@/routes/admin/finance/expenses';
import { destroy as destroyPayment } from '@/routes/admin/finance/payments';
import { show as showProject } from '@/routes/admin/projects';
import type {
    ExpenseRow,
    FinanceProjectOption,
    FinanceSummary,
    MonthlyPoint,
    Option,
    PaymentRow,
    ProjectProfit,
} from '@/types';

type Props = {
    period: string;
    range: { from: string; to: string };
    summary: FinanceSummary[];
    monthly: MonthlyPoint[];
    projects: ProjectProfit[];
    payments: PaymentRow[];
    expenses: ExpenseRow[];
    options: {
        periods: Option[];
        methods: Option[];
        categories: string[];
        projects: FinanceProjectOption[];
    };
};

type Tab = 'payments' | 'expenses' | 'projects';

export default function FinanceIndex({
    period,
    range,
    summary,
    monthly,
    projects,
    payments,
    expenses,
    options,
}: Props) {
    const can = useCan();
    const canManage = can('finanzas.gestionar');
    const [tab, setTab] = useState<Tab>('payments');
    const [payment, setPayment] = useState<PaymentRow | 'new' | null>(null);
    const [expense, setExpense] = useState<ExpenseRow | 'new' | null>(null);
    const main = summary[0];
    const others = summary.slice(1);
    const methodLabel = (v: string) =>
        options.methods.find((m) => m.value === v)?.label ?? v;

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'payments', label: 'Pagos recibidos', count: payments.length },
        { id: 'expenses', label: 'Gastos', count: expenses.length },
        {
            id: 'projects',
            label: 'Rentabilidad por proyecto',
            count: projects.length,
        },
    ];

    return (
        <>
            <Head title="Finanzas" />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Finanzas"
                    description={`Del ${formatDate(range.from)} al ${formatDate(range.to)}. Control interno: no reemplaza la contabilidad oficial.`}
                    actions={
                        <>
                            <OptionSelect
                                value={period}
                                options={options.periods}
                                onChange={(v) =>
                                    router.get(
                                        index({ query: { periodo: v } }).url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                                className="w-44"
                            />
                            {canManage && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setExpense('new')}
                                    >
                                        <Plus className="size-4" />
                                        Gasto
                                    </Button>
                                    <Button onClick={() => setPayment('new')}>
                                        <Plus className="size-4" />
                                        Pago recibido
                                    </Button>
                                </>
                            )}
                        </>
                    }
                />

                <section
                    aria-label="Resumen del periodo"
                    className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4"
                >
                    <MoneyStat
                        label="Recibido"
                        value={main.received}
                        currency={main.currency}
                        tone="brand"
                        hint="Pagos de clientes en el periodo"
                    />
                    <MoneyStat
                        label="Gastos"
                        value={main.expenses}
                        currency={main.currency}
                        hint="De proyectos y generales"
                    />
                    <MoneyStat
                        label="Utilidad"
                        value={main.profit}
                        currency={main.currency}
                        tone={main.profit < 0 ? 'negative' : 'positive'}
                        hint="Recibido menos gastos"
                    />
                    <MoneyStat
                        label="Por cobrar"
                        value={main.receivable}
                        currency={main.currency}
                        hint="Saldo de proyectos vigentes (hoy)"
                    />
                </section>

                {others.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Otras monedas:{' '}
                        {others
                            .map(
                                (s) =>
                                    `${s.currency} · recibido ${formatMoney(s.received, s.currency)}, gastos ${formatMoney(s.expenses, s.currency)}, por cobrar ${formatMoney(s.receivable, s.currency)}`,
                            )
                            .join(' | ')}
                    </p>
                )}

                <section className="rounded-xl border bg-card p-5">
                    <h2 className="mb-4 text-base font-semibold">
                        Últimos 12 meses ({main.currency})
                    </h2>
                    <MoneyChart data={monthly} currency={main.currency} />
                </section>

                <div>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b">
                        <div
                            role="tablist"
                            aria-label="Movimientos"
                            className="flex gap-1 overflow-x-auto"
                        >
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    role="tab"
                                    type="button"
                                    aria-selected={tab === t.id}
                                    onClick={() => setTab(t.id)}
                                    className={cn(
                                        '-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                                        tab === t.id
                                            ? 'border-primary text-foreground'
                                            : 'border-transparent text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {t.label}
                                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                                        {t.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {tab !== 'projects' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="mb-1.5"
                            >
                                <a
                                    href={
                                        exportMethod(
                                            tab === 'payments'
                                                ? 'pagos'
                                                : 'gastos',
                                            { query: { periodo: period } },
                                        ).url
                                    }
                                >
                                    <Download className="size-4" />
                                    Descargar para Excel
                                </a>
                            </Button>
                        )}
                    </div>

                    {tab === 'payments' && (
                        <Table
                            empty={payments.length === 0}
                            emptyTitle="Sin pagos en este periodo"
                            emptyText="Registra aquí el dinero que recibes de tus clientes, abono por abono."
                            head={['Fecha', 'Proyecto', 'Medio', 'Valor', '']}
                        >
                            {payments.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {formatDate(p.paid_on)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={showProject(p.project_id)}
                                            className="font-medium hover:underline"
                                        >
                                            {p.project}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {[p.client, p.reference]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {methodLabel(p.method)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                        {formatMoney(p.amount, p.currency)}
                                    </td>
                                    <RowActions
                                        canManage={canManage}
                                        onEdit={() => setPayment(p)}
                                        deleteTitle="Eliminar pago"
                                        deleteText={`Se elimina el pago de ${formatMoney(p.amount, p.currency)} del ${formatDate(p.paid_on)}. Queda registrado en el historial del proyecto.`}
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
                                </tr>
                            ))}
                        </Table>
                    )}

                    {tab === 'expenses' && (
                        <Table
                            empty={expenses.length === 0}
                            emptyTitle="Sin gastos en este periodo"
                            emptyText="Registra herramientas, suscripciones o pagos a terceros para conocer tu utilidad real."
                            head={['Fecha', 'Gasto', 'Proyecto', 'Valor', '']}
                        >
                            {expenses.map((e) => (
                                <tr
                                    key={e.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {formatDate(e.spent_on)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium">
                                            {e.description}
                                        </span>
                                        {e.is_recurring && (
                                            <Repeat
                                                className="ml-1.5 inline size-3.5 text-muted-foreground"
                                                aria-label="Recurrente"
                                            />
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                            {[e.category, e.vendor]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {e.project ?? 'General'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                        {formatMoney(e.amount, e.currency)}
                                    </td>
                                    <RowActions
                                        canManage={canManage}
                                        onEdit={() => setExpense(e)}
                                        deleteTitle="Eliminar gasto"
                                        deleteText={`Se elimina «${e.description}» por ${formatMoney(e.amount, e.currency)}.`}
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
                                </tr>
                            ))}
                        </Table>
                    )}

                    {tab === 'projects' && (
                        <Table
                            empty={projects.length === 0}
                            emptyTitle="Aún no hay proyectos con valores"
                            emptyText="Define el valor contratado de tus proyectos y registra pagos y gastos para ver su rentabilidad."
                            head={[
                                'Proyecto',
                                'Contratado',
                                'Recibido',
                                'Por cobrar',
                                'Gastos',
                                'Utilidad',
                            ]}
                        >
                            {projects.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={showProject(p.id)}
                                            className="font-medium hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {p.client}
                                        </div>
                                    </td>
                                    <Money
                                        value={p.agreed}
                                        currency={p.currency}
                                    />
                                    <Money
                                        value={p.received}
                                        currency={p.currency}
                                    />
                                    <Money
                                        value={p.pending}
                                        currency={p.currency}
                                    />
                                    <Money
                                        value={p.expenses}
                                        currency={p.currency}
                                    />
                                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                                        <span
                                            className={cn(
                                                p.profit < 0
                                                    ? 'text-destructive-foreground'
                                                    : 'text-success',
                                            )}
                                        >
                                            {formatMoney(p.profit, p.currency)}
                                        </span>
                                        {p.margin !== null && (
                                            <div className="text-xs text-muted-foreground">
                                                margen {p.margin}%
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </div>
            </div>

            {payment && (
                <PaymentDialog
                    payment={payment === 'new' ? undefined : payment}
                    projects={options.projects}
                    methods={options.methods}
                    onClose={() => setPayment(null)}
                />
            )}
            {expense && (
                <ExpenseDialog
                    expense={expense === 'new' ? undefined : expense}
                    projects={options.projects}
                    categories={options.categories}
                    onClose={() => setExpense(null)}
                />
            )}
        </>
    );
}

function Table({
    head,
    empty,
    emptyTitle,
    emptyText,
    children,
}: {
    head: string[];
    empty: boolean;
    emptyTitle: string;
    emptyText: string;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-x-auto rounded-xl border bg-card">
            {empty ? (
                <EmptyState
                    icon={Wallet}
                    title={emptyTitle}
                    description={emptyText}
                />
            ) : (
                <table className="w-full min-w-[680px] text-sm">
                    <thead>
                        <tr className="border-b text-left font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                            {head.map((h, i) => (
                                <th
                                    key={`${h}-${i}`}
                                    className={cn(
                                        'px-4 py-3 font-medium',
                                        i > 0 && i >= head.length - 2 && h
                                            ? 'text-right'
                                            : '',
                                    )}
                                >
                                    {h ? (
                                        h
                                    ) : (
                                        <span className="sr-only">
                                            Acciones
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>{children}</tbody>
                </table>
            )}
        </div>
    );
}

function Money({
    value,
    currency,
}: {
    value: number | null;
    currency: string;
}) {
    return (
        <td className="px-4 py-3 text-right font-mono tabular-nums">
            {formatMoney(value, currency)}
        </td>
    );
}

function RowActions({
    canManage,
    onEdit,
    deleteTitle,
    deleteText,
    onDelete,
}: {
    canManage: boolean;
    onEdit: () => void;
    deleteTitle: string;
    deleteText: string;
    onDelete: (done: () => void) => void;
}) {
    if (!canManage) {
        return <td />;
    }

    return (
        <td className="px-2 py-3 text-right whitespace-nowrap">
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
                title={deleteTitle}
                description={deleteText}
                confirmLabel="Eliminar"
                destructive
                onConfirm={onDelete}
            />
        </td>
    );
}
