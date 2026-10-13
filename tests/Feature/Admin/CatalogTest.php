<?php

namespace Tests\Feature\Admin;

use App\Models\Faq;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Service;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_initial_catalog_is_loaded_as_unpriced_drafts_and_only_once()
    {
        $this->seed(CatalogSeeder::class);
        $this->seed(CatalogSeeder::class);

        $this->assertSame(6, Service::query()->count());
        $this->assertSame(4, Plan::query()->count());
        $this->assertSame(0, Plan::query()->where('is_published', true)->count());
        $this->assertSame(0, Plan::query()->whereNotNull('price')->count());
        $this->assertSame(['Presencia Digital', 'Web Profesional', 'Gestión Empresarial', 'Solución a Medida'], Plan::query()->orderBy('sort_order')->pluck('name')->all());
    }

    /**
     * @return array<string, mixed>
     */
    private function planPayload(array $overrides = []): array
    {
        $included = Feature::query()->firstOrCreate(['name' => 'Formulario de contacto']);
        $optional = Feature::query()->firstOrCreate(['name' => 'Blog']);

        return array_replace([
            'name' => 'Presencia Digital',
            'summary' => 'Para empezar en internet.',
            'price_type' => 'from',
            'price' => '1500000',
            'currency' => 'cop',
            'is_published' => true,
            'features' => [
                ['feature_id' => $included->id, 'kind' => 'included'],
                ['feature_id' => $optional->id, 'kind' => 'optional', 'extra_price_note' => 'Se cotiza aparte'],
            ],
            'addons' => [['name' => 'Mantenimiento mensual', 'note' => null]],
            'faqs' => [['question' => '¿Incluye dominio?', 'answer' => 'No, se contrata aparte.']],
        ], $overrides);
    }

    public function test_a_plan_is_saved_with_included_and_optional_features_addons_and_faqs()
    {
        $this->actingAs($this->admin())
            ->post(route('admin.catalog.plans.store'), $this->planPayload())
            ->assertSessionHasNoErrors();

        $plan = Plan::query()->with(['features', 'faqs'])->firstOrFail();
        $this->assertSame('presencia-digital', $plan->slug);
        $this->assertSame('COP', $plan->currency);
        $this->assertSame(['included', 'optional'], $plan->features->pluck('pivot.kind')->all());
        $this->assertSame('Se cotiza aparte', $plan->features->firstWhere('name', 'Blog')->pivot->extra_price_note);
        $this->assertSame('Mantenimiento mensual', $plan->addons[0]['name']);
        $this->assertSame('¿Incluye dominio?', $plan->faqs->first()->question);
    }

    public function test_a_priced_plan_cannot_be_published_without_a_price()
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.catalog.plans.store'), $this->planPayload(['price' => '']))
            ->assertSessionHasErrors('price');

        // Como borrador sí se puede guardar sin precio.
        $this->actingAs($admin)
            ->post(route('admin.catalog.plans.store'), $this->planPayload(['price' => '', 'is_published' => false]))
            ->assertSessionHasNoErrors();
    }

    public function test_quote_only_plans_discard_any_price()
    {
        $this->actingAs($this->admin())
            ->post(route('admin.catalog.plans.store'), $this->planPayload(['price_type' => 'quote', 'price' => '999']))
            ->assertSessionHasNoErrors();

        $this->assertNull(Plan::query()->value('price'));
    }

    public function test_updating_a_plan_replaces_its_faqs_without_touching_general_faqs()
    {
        $admin = $this->admin();
        Faq::query()->create(['question' => 'General', 'answer' => 'Sí', 'is_published' => true]);
        $this->actingAs($admin)->post(route('admin.catalog.plans.store'), $this->planPayload());
        $plan = Plan::query()->firstOrFail();

        $payload = $this->planPayload(['faqs' => [['question' => 'Nueva', 'answer' => 'Respuesta']]]);
        $payload['features'] = [];
        $this->actingAs($admin)->put(route('admin.catalog.plans.update', $plan), $payload)->assertSessionHasNoErrors();

        $this->assertSame(['Nueva'], $plan->faqs()->pluck('question')->all());
        $this->assertSame(0, $plan->features()->count());
        $this->assertTrue(Faq::query()->whereNull('faqable_type')->where('question', 'General')->exists());
    }

    public function test_services_keep_unique_slugs_and_their_features()
    {
        $admin = $this->admin();
        $feature = Feature::query()->create(['name' => 'Panel administrativo']);

        foreach ([1, 2] as $_) {
            $this->actingAs($admin)->post(route('admin.catalog.services.store'), [
                'name' => 'Páginas web',
                'summary' => 'Sitios corporativos.',
                'benefits' => ['Más clientes', ''],
                'icon' => 'Globe',
                'feature_ids' => [$feature->id],
            ])->assertSessionHasNoErrors();
        }

        $this->assertSame(['paginas-web', 'paginas-web-2'], Service::query()->orderBy('id')->pluck('slug')->all());
        $this->assertSame(['Más clientes'], Service::query()->first()->benefits);
        $this->assertSame(1, Service::query()->first()->features()->count());
    }

    public function test_feature_names_are_unique()
    {
        $admin = $this->admin();
        Feature::query()->create(['name' => 'Blog']);

        $this->actingAs($admin)->post(route('admin.catalog.features.store'), ['name' => 'Blog'])->assertSessionHasErrors('name');
    }

    public function test_plan_faqs_cannot_be_edited_as_general_faqs()
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.catalog.plans.store'), $this->planPayload());
        $planFaq = Faq::query()->whereNotNull('faqable_type')->firstOrFail();

        $this->actingAs($admin)
            ->put(route('admin.catalog.faqs.update', $planFaq), ['question' => 'X', 'answer' => 'Y'])
            ->assertNotFound();
    }

    public function test_the_catalog_is_only_for_admins()
    {
        $this->seed(CatalogSeeder::class);
        $collaborator = $this->collaborator();

        $this->actingAs($collaborator)->get(route('admin.catalog.plans.index'))->assertForbidden();

        $this->actingAs($this->admin())
            ->get(route('admin.catalog.plans.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/catalog/plans/index')->has('plans', 4)->where('plans.0.price_ready', false));
    }
}
