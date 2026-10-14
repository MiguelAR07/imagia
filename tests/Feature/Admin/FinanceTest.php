<?php

namespace Tests\Feature\Admin;

use App\Models\Expense;
use App\Models\Payment;
use App\Models\Project;
use App\Models\Quote;
use App\Support\Finance;
use Database\Seeders\BaseDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaseDataSeeder::class);
    }

    private function project(?int $agreed = 1000000): Project
    {
        return Project::factory()->create(['agreed_amount' => $agreed, 'currency' => 'COP']);
    }

    private function pay(Project $project, int $amount, array $extra = [])
    {
        return $this->actingAs($this->admin())->post(route('admin.finance.payments.store'), [
            'project_id' => $project->id,
            'amount' => $amount,
            'paid_on' => today()->toDateString(),
            'method' => 'transfer',
            ...$extra,
        ]);
    }

    public function test_collaborators_cannot_see_or_record_money()
    {
        $project = $this->project();

        $this->actingAs($this->collaborator())->get(route('admin.finance.index'))->assertForbidden();
        $this->actingAs($this->collaborator())->post(route('admin.finance.payments.store'), [
            'project_id' => $project->id, 'amount' => 1000, 'paid_on' => today()->toDateString(), 'method' => 'cash',
        ])->assertForbidden();

        // En la ficha del proyecto tampoco ven cifras.
        $this->actingAs($this->collaborator())->get(route('admin.projects.show', $project))
            ->assertInertia(fn (Assert $page) => $page->where('finance', null));
    }

    public function test_payments_update_received_and_pending_and_are_logged_in_the_project()
    {
        $project = $this->project();

        $this->pay($project, 300000, ['reference' => 'TRX-1'])->assertSessionHasNoErrors();

        $this->assertSame(['agreed' => 1000000.0, 'received' => 300000.0, 'pending' => 700000.0, 'expenses' => 0.0, 'profit' => 300000.0], $project->finance());
        $this->assertSame('COP', Payment::query()->sole()->currency);
        $this->assertStringContainsString('Pago registrado: $300.000 COP', $project->activities()->value('description'));

        $this->actingAs($this->admin())->get(route('admin.projects.show', $project))
            ->assertInertia(fn (Assert $page) => $page->where('finance.pending', 700000)->has('finance.payments', 1));
    }

    public function test_a_payment_cannot_exceed_the_pending_balance_or_be_in_the_future()
    {
        $project = $this->project(500000);
        $this->pay($project, 400000);

        $this->pay($project, 200000)->assertSessionHasErrors('amount');
        $this->pay($project, 100000, ['paid_on' => today()->addDay()->toDateString()])->assertSessionHasErrors('paid_on');
        $this->pay($project, 0)->assertSessionHasErrors('amount');

        // Editar el mismo pago sí puede usar su propio valor.
        $payment = Payment::query()->sole();
        $this->actingAs($this->admin())->put(route('admin.finance.payments.update', $payment), [
            'amount' => 500000, 'paid_on' => today()->toDateString(), 'method' => 'cash',
        ])->assertSessionHasNoErrors();
        $this->assertSame(0.0, $project->finance()['pending']);
    }

    public function test_projects_without_agreed_amount_accept_any_payment()
    {
        $project = $this->project(null);

        $this->pay($project, 2500000)->assertSessionHasNoErrors();
        $this->assertNull($project->finance()['pending']);
    }

    public function test_expenses_create_categories_and_count_for_project_profit()
    {
        $project = $this->project();
        $this->pay($project, 600000);

        $this->actingAs($this->admin())->post(route('admin.finance.expenses.store'), [
            'description' => 'Plantilla premium',
            'category' => 'herramientas',
            'project_id' => $project->id,
            'amount' => 150000,
            'currency' => 'USD',
            'spent_on' => today()->toDateString(),
        ])->assertSessionHasNoErrors();

        $expense = Expense::query()->sole();
        $this->assertSame('COP', $expense->currency); // la moneda del proyecto
        $this->assertSame(450000.0, $project->finance()['profit']);

        // La categoría existente se reutiliza sin importar mayúsculas.
        $this->actingAs($this->admin())->post(route('admin.finance.expenses.store'), [
            'description' => 'Hosting', 'category' => 'Herramientas', 'amount' => 80000, 'spent_on' => today()->toDateString(),
        ]);
        $this->assertSame(1, Expense::query()->distinct('expense_category_id')->count('expense_category_id'));
    }

    public function test_the_summary_separates_quoted_from_received_money()
    {
        $project = $this->project();
        $this->pay($project, 250000);
        Quote::query()->forceCreate([
            'number' => 'COT-2026-001', 'title' => 'Propuesta', 'client_id' => $project->client_id,
            'status' => 'sent', 'currency' => 'COP', 'subtotal' => 9000000, 'total' => 9000000,
        ]);
        Expense::query()->create(['description' => 'Dominio', 'amount' => 50000, 'currency' => 'COP', 'spent_on' => today()]);

        $this->actingAs($this->admin())->get(route('admin.finance.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/finance/index')
                ->where('summary.0.received', 250000)
                ->where('summary.0.expenses', 50000)
                ->where('summary.0.profit', 200000)
                ->where('summary.0.receivable', 750000)
                ->has('monthly', 12)
                ->has('projects', 1));
    }

    public function test_periods_filter_the_movements()
    {
        $project = $this->project(null);
        $project->payments()->forceCreate(['amount' => 100, 'currency' => 'COP', 'paid_on' => today()->subMonthNoOverflow(), 'method' => 'cash']);

        [$from] = Finance::range('mes-anterior');
        $this->assertTrue($from->isSameMonth(today()->subMonthNoOverflow()));

        $this->actingAs($this->admin())->get(route('admin.finance.index', ['periodo' => 'mes']))
            ->assertInertia(fn (Assert $page) => $page->has('payments', 0));
        $this->actingAs($this->admin())->get(route('admin.finance.index', ['periodo' => 'mes-anterior']))
            ->assertInertia(fn (Assert $page) => $page->has('payments', 1));
    }

    public function test_csv_export_neutralizes_formulas()
    {
        Expense::query()->create(['description' => '=HYPERLINK("x")', 'amount' => 1000, 'currency' => 'COP', 'spent_on' => today()]);

        $content = $this->actingAs($this->admin())->get(route('admin.finance.export', 'gastos'))->assertOk()->streamedContent();

        $this->assertStringContainsString('Descripción;Proveedor', $content);
        $this->assertStringContainsString("'=HYPERLINK", $content);
    }

    public function test_deleting_a_payment_is_recorded_in_the_project_history()
    {
        $project = $this->project();
        $this->pay($project, 100000);

        $this->actingAs($this->admin())->delete(route('admin.finance.payments.destroy', Payment::query()->sole()))
            ->assertSessionHasNoErrors();

        $this->assertSame(0, Payment::query()->count());
        $this->assertStringContainsString('Pago eliminado', $project->activities()->value('description'));
    }
}
