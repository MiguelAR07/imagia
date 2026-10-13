<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\Project;
use App\Models\Quote;
use App\Models\TaxRate;
use App\Support\QuoteCalculator;
use Database\Seeders\BaseDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuoteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BaseDataSeeder::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_replace([
            'client_id' => Client::factory()->create()->id,
            'title' => 'Sistema de agenda',
            'currency' => 'COP',
            'items' => [['description' => 'Desarrollo', 'quantity' => 1, 'unit_price' => 1000000]],
        ], $overrides);
    }

    public function test_totals_apply_line_discounts_and_taxes()
    {
        $iva = TaxRate::query()->create(['name' => 'IVA', 'rate' => 19]);

        $totals = QuoteCalculator::totals([
            ['quantity' => 2, 'unit_price' => 500000, 'discount_percent' => 10, 'tax_rate_id' => $iva->id],
            ['quantity' => 1, 'unit_price' => 200000],
        ]);

        // Bruto 1.200.000 · descuento 100.000 · impuesto 19 % de 900.000 = 171.000
        $this->assertSame(['subtotal' => 1200000.0, 'discount_amount' => 100000.0, 'tax_amount' => 171000.0, 'total' => 1271000.0], $totals);
    }

    public function test_creating_a_quote_numbers_it_and_computes_totals_on_the_server()
    {
        $admin = $this->admin();
        $payload = $this->payload();
        $payload['total'] = 1; // se ignora: lo calcula el servidor

        $this->actingAs($admin)->post(route('admin.quotes.store'), $payload)->assertSessionHasNoErrors();
        $this->actingAs($admin)->post(route('admin.quotes.store'), $this->payload())->assertSessionHasNoErrors();

        $year = now()->year;
        $this->assertSame(["COT-{$year}-001", "COT-{$year}-002"], Quote::query()->orderBy('id')->pluck('number')->all());
        $this->assertSame('1000000.00', Quote::query()->first()->total);
        $this->assertSame('draft', Quote::query()->first()->status);
    }

    public function test_a_quote_needs_a_recipient_and_at_least_one_item()
    {
        $this->actingAs($this->admin())
            ->post(route('admin.quotes.store'), $this->payload(['client_id' => null, 'items' => []]))
            ->assertSessionHasErrors(['client_id', 'items']);
    }

    public function test_accepting_a_quote_does_not_register_any_payment()
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.quotes.store'), $this->payload());
        $quote = Quote::query()->firstOrFail();

        $this->actingAs($admin)->patch(route('admin.quotes.status', $quote), ['status' => 'sent']);
        $this->actingAs($admin)->patch(route('admin.quotes.status', $quote), ['status' => 'accepted']);

        $quote->refresh();
        $this->assertSame('accepted', $quote->status);
        $this->assertNotNull($quote->sent_at);
        $this->assertNotNull($quote->accepted_at);
        $this->assertSame(0, DB::table('payments')->count());
    }

    public function test_accepted_quotes_cannot_be_edited_or_deleted()
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.quotes.store'), $this->payload());
        $quote = Quote::query()->firstOrFail();
        $this->actingAs($admin)->patch(route('admin.quotes.status', $quote), ['status' => 'accepted']);

        $this->actingAs($admin)->put(route('admin.quotes.update', $quote), $this->payload())->assertForbidden();
        $this->actingAs($admin)->delete(route('admin.quotes.destroy', $quote))->assertForbidden();
    }

    public function test_sending_a_quote_moves_the_lead_forward_in_the_pipeline()
    {
        $admin = $this->admin();
        $lead = Lead::factory()->create();

        $this->actingAs($admin)->post(route('admin.quotes.store'), $this->payload(['client_id' => null, 'lead_id' => $lead->id]));
        $quote = Quote::query()->firstOrFail();
        $this->actingAs($admin)->patch(route('admin.quotes.status', $quote), ['status' => 'sent']);

        $this->assertSame('cotizacion-enviada', PipelineStage::query()->find($lead->fresh()->pipeline_stage_id)->slug);
    }

    public function test_an_accepted_quote_creates_a_project_with_the_agreed_amount()
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.quotes.store'), $this->payload());
        $quote = Quote::query()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.quotes.project', $quote))->assertSessionHasErrors('status');

        $this->actingAs($admin)->patch(route('admin.quotes.status', $quote), ['status' => 'accepted']);
        $this->actingAs($admin)->post(route('admin.quotes.project', $quote));
        $this->actingAs($admin)->post(route('admin.quotes.project', $quote));

        $this->assertSame(1, Project::query()->count());
        $project = Project::query()->firstOrFail();
        $this->assertSame($quote->id, $project->quote_id);
        $this->assertSame('1000000.00', $project->agreed_amount);
    }

    public function test_duplicating_creates_a_new_editable_version()
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.quotes.store'), $this->payload());
        $quote = Quote::query()->firstOrFail();
        $this->actingAs($admin)->patch(route('admin.quotes.status', $quote), ['status' => 'rejected']);

        $this->actingAs($admin)->post(route('admin.quotes.duplicate', $quote));

        $copy = Quote::query()->whereKeyNot($quote->id)->firstOrFail();
        $this->assertSame('draft', $copy->status);
        $this->assertNotSame($quote->number, $copy->number);
        $this->assertSame(1, $copy->items()->count());
    }

    public function test_the_print_view_renders_and_quotes_are_admin_only()
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.quotes.store'), $this->payload());
        $quote = Quote::query()->firstOrFail();

        $this->actingAs($admin)->get(route('admin.quotes.print', $quote))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/quotes/print')->where('quote.number', $quote->number));

        $this->actingAs($this->collaborator())->get(route('admin.quotes.index'))->assertForbidden();
    }
}
