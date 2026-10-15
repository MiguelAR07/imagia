<?php

namespace Tests\Feature\Site;

use App\Models\Feature;
use App\Models\Plan;
use App\Models\Service;
use App\Support\BudgetPlanner;
use Database\Seeders\BaseDataSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BudgetPlannerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BaseDataSeeder::class, CatalogSeeder::class]);

        Service::query()->update(['is_published' => true]);
        Plan::query()->where('slug', 'presencia-digital')->update(['is_published' => true, 'price_type' => 'from', 'price' => 900000]);
        Plan::query()->where('slug', 'web-profesional')->update(['is_published' => true, 'price_type' => 'from', 'price' => 2400000]);
        Plan::query()->where('slug', 'gestion-empresarial')->update(['is_published' => true, 'price_type' => 'from', 'price' => 6500000]);

        $this->module('Blog', 500000, ['website'], 2);
        $this->module('Pagos en línea', 1200000, ['website', 'management'], 1);
        $this->module('Varios idiomas', 900000, ['website'], 3);
        $this->module('Inventario', 1300000, ['management'], 1);
        Feature::query()->create(['name' => 'Borrador sin precio', 'is_module' => true, 'goals' => ['website']]);
    }

    private function module(string $name, int $price, array $goals, int $order): Feature
    {
        $feature = Feature::query()->firstOrNew(['name' => $name]);
        $feature->fill(['is_module' => true, 'category' => 'operation', 'module_price' => $price, 'goals' => $goals, 'module_order' => $order])->save();

        return $feature;
    }

    public function test_it_picks_the_best_plan_that_fits_and_fills_with_modules_by_priority()
    {
        $result = BudgetPlanner::plan(4500000, 'website');

        $this->assertTrue($result['fits']);
        $this->assertSame('web-profesional', $result['plan']['slug']);
        // 2.400.000 + Pagos (1.200.000) + Blog (500.000) = 4.100.000; Idiomas (900.000) ya no cabe.
        $this->assertSame(['Pagos en línea', 'Blog'], collect($result['modules'])->pluck('name')->all());
        $this->assertSame(4100000.0, (float) $result['total']);
        $this->assertSame(400000.0, (float) $result['remaining']);
        $this->assertSame(['name' => 'Varios idiomas', 'kind' => 'module', 'extra' => 500000.0], $result['next']);
    }

    public function test_modules_without_price_or_for_other_goals_are_never_offered()
    {
        $names = collect(BudgetPlanner::plan(20000000, 'website')['modules'])->pluck('name');

        $this->assertNotContains('Borrador sin precio', $names);
        $this->assertNotContains('Inventario', $names);
    }

    public function test_when_the_budget_is_short_it_says_how_much_is_missing_and_suggests_alternatives()
    {
        $result = BudgetPlanner::plan(1000000, 'management');

        $this->assertFalse($result['fits']);
        $this->assertSame(5500000.0, (float) $result['shortfall']['missing']);
        $this->assertSame('presencia-digital', collect($result['alternatives'])->firstWhere('goal', 'landing')['plan']['slug']);
    }

    public function test_unpublished_plans_are_ignored()
    {
        Plan::query()->where('slug', 'web-profesional')->update(['is_published' => false]);

        $this->assertFalse(BudgetPlanner::plan(3000000, 'website')['fits']);
    }

    public function test_the_public_page_calculates_and_prefills_the_quote_form()
    {
        $this->get(route('site.budget', ['objetivo' => 'website', 'presupuesto' => '4.500.000']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('site/budget')
                ->where('result.plan.slug', 'web-profesional')
                ->where('summary', fn ($s) => str_contains($s, 'Plan sugerido: Web Profesional.')));

        $this->get(route('site.budget', ['objetivo' => 'website', 'presupuesto' => '1000']))
            ->assertInertia(fn (Assert $page) => $page->where('result', null));

        $this->get(route('site.quote', ['plan' => 'web-profesional', 'objetivo' => 'website', 'presupuesto' => '4500000', 'detalle' => '<b>Hola</b> calculadora']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedPlan', 'web-profesional')
                ->where('prefill.need', 'website')
                ->where('prefill.budget', 'Entre 2 y 5 millones')
                ->where('prefill.description', 'Hola calculadora'));
    }

    public function test_admins_configure_modules_and_collaborators_cannot()
    {
        $feature = Feature::query()->create(['name' => 'Chat interno']);

        $this->actingAs($this->admin())->put(route('admin.catalog.features.module', $feature), [
            'is_module' => true, 'category' => 'communication', 'size' => 'M', 'module_price' => '', 'goals' => ['management'],
        ])->assertSessionHasErrors('module_price');

        $this->actingAs($this->admin())->put(route('admin.catalog.features.module', $feature), [
            'is_module' => true, 'category' => 'communication', 'size' => 'M', 'module_price' => 800000, 'goals' => ['management', 'management'],
        ])->assertSessionHasNoErrors();

        $this->assertSame(['management'], $feature->refresh()->goals);
        $this->assertTrue($feature->is_module);

        $this->actingAs($this->collaborator())->put(route('admin.catalog.features.module', $feature), ['is_module' => false])
            ->assertForbidden();
    }
}
