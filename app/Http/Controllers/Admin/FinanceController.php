<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Payment;
use App\Models\Project;
use App\Support\Finance;
use App\Support\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Control financiero interno: pagos recibidos, gastos y rentabilidad.
 * No es un sistema contable certificado.
 */
class FinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $period = $this->period($request);
        [$from, $to] = Finance::range($period);

        return Inertia::render('admin/finance/index', [
            'period' => $period,
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => Finance::summary($from, $to),
            'monthly' => Finance::monthly(Finance::defaultCurrency()),
            'projects' => Finance::projects(),
            'payments' => Payment::query()
                ->with('project:id,name,client_id,deleted_at', 'project.client:id,name,deleted_at')
                ->whereBetween('paid_on', [$from->toDateString(), $to->toDateString()])
                ->latest('paid_on')->latest('id')->limit(300)->get()
                ->map(fn (Payment $p) => [
                    ...$p->only(['id', 'project_id', 'amount', 'currency', 'method', 'reference', 'notes']),
                    'paid_on' => $p->paid_on->toDateString(),
                    'project' => $p->project?->name,
                    'client' => $p->project?->client?->name,
                ]),
            'expenses' => Expense::query()->with('project:id,name,deleted_at', 'category:id,name')
                ->whereBetween('spent_on', [$from->toDateString(), $to->toDateString()])
                ->latest('spent_on')->latest('id')->limit(300)->get()
                ->map(fn (Expense $e) => [
                    ...$e->only(['id', 'project_id', 'description', 'vendor', 'amount', 'currency', 'is_recurring']),
                    'spent_on' => $e->spent_on->toDateString(),
                    'project' => $e->project?->name,
                    'category' => $e->category?->name,
                ]),
            'options' => [
                'periods' => Options::from(Finance::PERIODS),
                'methods' => Options::from(Payment::METHODS),
                'categories' => ExpenseCategory::query()->orderBy('name')->pluck('name'),
                'projects' => Project::query()->orderBy('name')->withSum('payments', 'amount')
                    ->get(['id', 'name', 'currency', 'agreed_amount', 'status'])
                    ->map(fn (Project $p) => [
                        'value' => (string) $p->id,
                        'label' => $p->name,
                        'currency' => $p->currency,
                        'pending' => $p->agreed_amount !== null
                            ? max(0, (float) $p->agreed_amount - (float) $p->payments_sum_amount)
                            : null,
                    ]),
            ],
        ]);
    }

    public function storePayment(Request $request): RedirectResponse
    {
        $data = $this->validatePayment($request);
        $project = Project::query()->findOrFail($data['project_id']);
        $this->ensureWithinBalance($project, (float) $data['amount']);

        $payment = new Payment($data);
        $payment->forceFill([
            'project_id' => $project->id,
            'currency' => $project->currency,
            'recorded_by' => $request->user()->id,
        ])->save();

        $project->logActivity('system', 'Pago registrado: '.$this->money($payment).' ('.Payment::METHODS[$payment->method].').');
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pago registrado.']);

        return back();
    }

    public function updatePayment(Request $request, Payment $payment): RedirectResponse
    {
        $data = $this->validatePayment($request, withProject: false);
        $this->ensureWithinBalance($payment->project, (float) $data['amount'], except: (float) $payment->amount);

        $before = $this->money($payment);
        $payment->update($data);

        $payment->project->logActivity('system', "Pago editado: {$before} → {$this->money($payment)}.");
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pago actualizado.']);

        return back();
    }

    public function destroyPayment(Payment $payment): RedirectResponse
    {
        $payment->project->logActivity('system', 'Pago eliminado: '.$this->money($payment).' del '.$payment->paid_on->format('d/m/Y').'.');
        $payment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pago eliminado.']);

        return back();
    }

    public function storeExpense(Request $request): RedirectResponse
    {
        $expense = new Expense($this->validateExpense($request));
        $expense->recorded_by = $request->user()->id;
        $expense->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gasto registrado.']);

        return back();
    }

    public function updateExpense(Request $request, Expense $expense): RedirectResponse
    {
        $expense->update($this->validateExpense($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gasto actualizado.']);

        return back();
    }

    public function destroyExpense(Expense $expense): RedirectResponse
    {
        $expense->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gasto eliminado.']);

        return back();
    }

    /**
     * Pagos o gastos del periodo en CSV (se abre en Excel).
     */
    public function export(Request $request, string $type): StreamedResponse
    {
        abort_unless(in_array($type, ['pagos', 'gastos'], true), 404);

        $period = $this->period($request);
        [$from, $to] = Finance::range($period);
        $between = [$from->toDateString(), $to->toDateString()];

        [$header, $rows] = $type === 'pagos'
            ? [
                ['Fecha', 'Proyecto', 'Cliente', 'Valor', 'Moneda', 'Medio', 'Referencia', 'Notas'],
                Payment::query()->with('project.client')->whereBetween('paid_on', $between)->orderBy('paid_on')->get()
                    ->map(fn (Payment $p) => [
                        $p->paid_on->toDateString(), $p->project?->name, $p->project?->client?->name, $p->amount,
                        $p->currency, Payment::METHODS[$p->method] ?? $p->method, $p->reference, $p->notes,
                    ]),
            ]
            : [
                ['Fecha', 'Descripción', 'Proveedor', 'Categoría', 'Proyecto', 'Valor', 'Moneda', 'Recurrente'],
                Expense::query()->with('project', 'category')->whereBetween('spent_on', $between)->orderBy('spent_on')->get()
                    ->map(fn (Expense $e) => [
                        $e->spent_on->toDateString(), $e->description, $e->vendor, $e->category?->name,
                        $e->project?->name ?? 'General', $e->amount, $e->currency, $e->is_recurring ? 'Sí' : 'No',
                    ]),
            ];

        return response()->streamDownload(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM: Excel reconoce las tildes.

            fputcsv($out, $header, ';');
            foreach ($rows as $row) {
                // Evita que Excel interprete textos como fórmulas.
                fputcsv($out, array_map(fn ($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'{$v}" : $v, $row), ';');
            }

            fclose($out);
        }, "{$type}-{$from->toDateString()}-a-{$to->toDateString()}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function period(Request $request): string
    {
        $period = $request->string('periodo')->toString();

        return array_key_exists($period, Finance::PERIODS) ? $period : 'mes';
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayment(Request $request, bool $withProject = true): array
    {
        return $request->validate([
            ...($withProject ? ['project_id' => ['required', Rule::exists('projects', 'id')->whereNull('deleted_at')]] : []),
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999'],
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'method' => ['required', Rule::in(array_keys(Payment::METHODS))],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'paid_on.before_or_equal' => 'Un pago recibido no puede tener fecha futura.',
            'amount.gt' => 'El valor debe ser mayor que cero.',
        ]);
    }

    /**
     * Con valor contratado, no se puede registrar más de lo que falta por cobrar.
     */
    private function ensureWithinBalance(Project $project, float $amount, float $except = 0): void
    {
        if ($project->agreed_amount === null) {
            return;
        }

        $pending = (float) $project->agreed_amount - (float) $project->payments()->sum('amount') + $except;

        if ($amount > $pending + 0.001) {
            throw ValidationException::withMessages([
                'amount' => 'El valor supera lo que falta por cobrar ('.number_format(max(0, $pending), 0, ',', '.')." {$project->currency}). Si el valor contratado cambió, actualízalo en el proyecto.",
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validateExpense(Request $request): array
    {
        $data = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'vendor' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:60'],
            'project_id' => ['nullable', Rule::exists('projects', 'id')],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999'],
            'currency' => ['nullable', 'string', 'size:3', 'alpha'],
            'spent_on' => ['required', 'date'],
            'is_recurring' => ['boolean'],
        ], ['amount.gt' => 'El valor debe ser mayor que cero.']);

        $category = trim((string) ($data['category'] ?? ''));
        $data['expense_category_id'] = $category !== ''
            ? ExpenseCategory::query()->whereRaw('lower(name) = ?', [mb_strtolower($category)])->value('id')
                ?? ExpenseCategory::query()->create(['name' => $category])->id
            : null;
        unset($data['category']);

        // Con proyecto, el gasto va en la moneda del proyecto para poder calcular su rentabilidad.
        $data['currency'] = isset($data['project_id'])
            ? Project::withTrashed()->whereKey($data['project_id'])->value('currency')
            : strtoupper($data['currency'] ?? Finance::defaultCurrency());

        return $data;
    }

    private function money(Payment $payment): string
    {
        return '$'.number_format((float) $payment->amount, 0, ',', '.')." {$payment->currency}";
    }
}
