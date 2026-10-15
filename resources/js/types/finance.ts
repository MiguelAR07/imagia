import type { Option } from '@/types/common';

export type PaymentRow = {
    id: number;
    project_id: number;
    amount: string;
    currency: string;
    method: string;
    reference: string | null;
    notes: string | null;
    paid_on: string;
    project?: string | null;
    client?: string | null;
};

export type ExpenseRow = {
    id: number;
    project_id: number | null;
    description: string;
    vendor: string | null;
    amount: string;
    currency: string;
    is_recurring: boolean;
    spent_on: string;
    project?: string | null;
    category: string | null;
};

export type FinanceSummary = {
    currency: string;
    received: number;
    expenses: number;
    profit: number;
    receivable: number;
};

export type MonthlyPoint = {
    month: string;
    received: number;
    expenses: number;
};

export type ProjectProfit = {
    id: number;
    name: string;
    client: string | null;
    status: string;
    currency: string;
    agreed: number | null;
    received: number;
    pending: number | null;
    expenses: number;
    profit: number;
    margin: number | null;
};

/** Proyecto en el selector de pagos/gastos (con lo que falta por cobrar). */
export type FinanceProjectOption = Option & {
    currency: string;
    pending: number | null;
};

/** Cuentas de un proyecto en su ficha (solo con permiso de finanzas). */
export type ProjectFinance = {
    agreed: number | null;
    received: number;
    pending: number | null;
    expenses: number;
    profit: number;
    payments: PaymentRow[];
    expense_items: ExpenseRow[];
    methods: Option[];
    categories: string[];
    online: {
        enabled: boolean;
        sandbox: boolean;
        links: PaymentLinkRow[];
    };
};

/** Link de pago en línea (Wompi). */
export type PaymentLinkRow = {
    id: number;
    amount: string;
    currency: string;
    description: string;
    status: 'pending' | 'paid' | 'cancelled';
    last_transaction_status: string | null;
    payment_method_type: string | null;
    url: string;
    paid_at: string | null;
    created_at: string | null;
};
