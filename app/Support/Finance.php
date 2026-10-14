<?php

namespace App\Support;

use App\Models\Expense;
use App\Models\Payment;
use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Cuentas del control financiero interno. Recibido = pagos; gastos = gastos registrados;
 * por cobrar = valor contratado menos lo recibido. Lo cotizado nunca cuenta como dinero.
 *
 * Cada moneda se calcula por separado: no se convierten tasas de cambio.
 */
class Finance
{
    public const PERIODS = [
        'mes' => 'Este mes',
        'mes-anterior' => 'Mes anterior',
        'trimestre' => 'Últimos 3 meses',
        'anio' => 'Este año',
    ];

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public static function range(string $period): array
    {
        $today = CarbonImmutable::today();

        return match ($period) {
            'mes-anterior' => [$today->subMonthNoOverflow()->startOfMonth(), $today->subMonthNoOverflow()->endOfMonth()],
            'trimestre' => [$today->subMonthsNoOverflow(2)->startOfMonth(), $today->endOfMonth()],
            'anio' => [$today->startOfYear(), $today->endOfYear()],
            default => [$today->startOfMonth(), $today->endOfMonth()],
        };
    }

    /**
     * Recibido, gastado y utilidad del periodo, por moneda. Incluye lo pendiente por cobrar (sin periodo).
     *
     * @return list<array{currency: string, received: float, expenses: float, profit: float, receivable: float}>
     */
    public static function summary(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $received = Payment::query()->whereBetween('paid_on', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('currency, sum(amount) as total')->groupBy('currency')->pluck('total', 'currency');
        $expenses = Expense::query()->whereBetween('spent_on', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('currency, sum(amount) as total')->groupBy('currency')->pluck('total', 'currency');
        $receivable = self::receivable();

        $currencies = collect([...$received->keys(), ...$expenses->keys(), ...array_keys($receivable)])
            ->push(self::defaultCurrency())->unique()->values();

        return $currencies->map(fn (string $c) => [
            'currency' => $c,
            'received' => (float) ($received[$c] ?? 0),
            'expenses' => (float) ($expenses[$c] ?? 0),
            'profit' => (float) ($received[$c] ?? 0) - (float) ($expenses[$c] ?? 0),
            'receivable' => $receivable[$c] ?? 0.0,
        ])->all();
    }

    /**
     * Saldo por cobrar de los proyectos vigentes con valor contratado, por moneda.
     *
     * @return array<string, float>
     */
    public static function receivable(): array
    {
        return Project::query()->whereNotNull('agreed_amount')->where('status', '!=', 'cancelled')
            ->withSum('payments', 'amount')->get(['id', 'agreed_amount', 'currency'])
            ->groupBy('currency')
            ->map(fn (Collection $projects) => (float) $projects->sum(
                fn (Project $p) => max(0.0, (float) $p->agreed_amount - (float) $p->payments_sum_amount),
            ))->all();
    }

    /**
     * Recibido y gastado mes a mes (últimos 12 meses) en una moneda.
     *
     * @return list<array{month: string, received: float, expenses: float}>
     */
    public static function monthly(string $currency, int $months = 12): array
    {
        $from = CarbonImmutable::today()->subMonthsNoOverflow($months - 1)->startOfMonth();

        $sumByMonth = fn (Collection $rows, string $dateField) => $rows
            ->groupBy(fn ($r) => $r->{$dateField}->format('Y-m'))
            ->map(fn (Collection $g) => (float) $g->sum('amount'));

        $received = $sumByMonth(Payment::query()->where('currency', $currency)
            ->where('paid_on', '>=', $from->toDateString())->get(['amount', 'paid_on']), 'paid_on');
        $expenses = $sumByMonth(Expense::query()->where('currency', $currency)
            ->where('spent_on', '>=', $from->toDateString())->get(['amount', 'spent_on']), 'spent_on');

        return collect(range(0, $months - 1))->map(function (int $i) use ($from, $received, $expenses) {
            $month = $from->addMonthsNoOverflow($i)->format('Y-m');

            return ['month' => $month, 'received' => $received[$month] ?? 0.0, 'expenses' => $expenses[$month] ?? 0.0];
        })->all();
    }

    /**
     * Rentabilidad de cada proyecto con movimientos o valor contratado.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function projects(): Collection
    {
        return Project::query()
            ->with('client:id,name,deleted_at')
            ->withSum('payments', 'amount')
            ->withSum(['expenses' => fn ($q) => $q->whereColumn('expenses.currency', 'projects.currency')], 'amount')
            ->where(fn ($q) => $q->whereNotNull('agreed_amount')->orWhereHas('payments')->orWhereHas('expenses'))
            ->latest('updated_at')
            ->get()
            ->map(function (Project $p) {
                $received = (float) $p->payments_sum_amount;
                $expenses = (float) $p->expenses_sum_amount;
                $agreed = $p->agreed_amount !== null ? (float) $p->agreed_amount : null;

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'client' => $p->client?->name,
                    'status' => $p->status,
                    'currency' => $p->currency,
                    'agreed' => $agreed,
                    'received' => $received,
                    'pending' => $agreed !== null && $p->status !== 'cancelled' ? max(0.0, $agreed - $received) : null,
                    'expenses' => $expenses,
                    'profit' => $received - $expenses,
                    // Margen sobre lo recibido: cuánto de cada peso cobrado queda después de gastos.
                    'margin' => $received > 0 ? (int) round(($received - $expenses) * 100 / $received) : null,
                ];
            });
    }

    public static function defaultCurrency(): string
    {
        return 'COP';
    }
}
