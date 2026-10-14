<?php

namespace Tests\Feature\Site;

use App\Models\Feature;
use App\Models\Lead;
use App\Models\Plan;
use App\Models\PortfolioItem;
use App\Models\Service;
use App\Models\Testimonial;
use App\Support\Settings;
use Database\Seeders\BaseDataSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicSiteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BaseDataSeeder::class, CatalogSeeder::class]);
    }

    private function portfolioItem(array $attributes = []): PortfolioItem
    {
        return PortfolioItem::query()->create([
            'title' => 'Agenda Spa',
            'slug' => 'agenda-spa-'.uniqid(),
            'category' => 'management',
            'summary' => 'Agenda en línea',
            'status' => 'published',
            'cover_path' => 'portfolio/x.jpg',
            ...$attributes,
        ]);
    }

    public function test_draft_services_and_plans_are_not_shown()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('site/home')->has('services', 0)->has('plans', 0));

        $slug = Service::query()->value('slug');
        $this->get(route('site.service', $slug))->assertNotFound();
    }

    public function test_published_content_appears_with_the_configured_price()
    {
        Service::query()->update(['is_published' => true]);
        Plan::query()->where('name', 'Presencia Digital')->update(['is_published' => true, 'price' => 1500000]);

        $this->get(route('site.plans'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('site/plans')
                ->has('plans', 1)
                ->where('plans.0.price_type', 'from')
                ->where('plans.0.price', '1500000.00'));

        $this->get(route('site.service', Service::query()->value('slug')))->assertOk();
    }

    public function test_a_published_plan_without_price_is_shown_as_quote_only()
    {
        Plan::query()->where('name', 'Web Profesional')->update(['is_published' => true, 'price_type' => 'from', 'price' => null]);

        $this->get(route('site.plans'))
            ->assertInertia(fn (Assert $page) => $page->where('plans.0.price_type', 'quote')->where('plans.0.price', null));
    }

    public function test_confidential_draft_and_coverless_projects_never_reach_the_public_site()
    {
        $public = $this->portfolioItem(['title' => 'Público']);
        $confidential = $this->portfolioItem(['title' => 'Secreto', 'is_confidential' => true]);
        $draft = $this->portfolioItem(['title' => 'Borrador', 'status' => 'draft']);
        $noCover = $this->portfolioItem(['title' => 'Sin portada', 'cover_path' => null]);

        $this->get(route('site.projects'))
            ->assertInertia(fn (Assert $page) => $page->has('projects', 1)->where('projects.0.title', 'Público'));

        $this->get(route('site.project', $public->slug))->assertOk();
        $this->get(route('site.project', $confidential->slug))->assertNotFound();
        $this->get(route('site.project', $draft->slug))->assertNotFound();
        $this->get(route('site.project', $noCover->slug))->assertNotFound();
    }

    public function test_client_name_and_testimonials_need_authorization()
    {
        $item = $this->portfolioItem(['client_display_name' => 'Spa Andrea', 'client_name_authorized' => false]);
        $item->testimonials()->create(['author_name' => 'Andrea', 'quote' => 'Sin autorizar', 'is_published' => true]);
        $item->testimonials()->create(['author_name' => 'Luis', 'quote' => 'Autorizado', 'is_published' => true, 'authorized_at' => now()]);

        $this->get(route('site.project', $item->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('project.client', null)
                ->has('project.testimonials', 1)
                ->where('project.testimonials.0.quote', 'Autorizado'));

        $this->assertSame(2, Testimonial::query()->count());
    }

    public function test_the_quote_form_creates_a_lead_with_consent_and_shows_the_confirmation()
    {
        $plan = Plan::query()->where('name', 'Gestión Empresarial')->firstOrFail();
        $plan->update(['is_published' => true]);

        $this->post(route('site.quote.store'), [
            'need' => 'organize',
            'plan' => $plan->slug,
            'business' => 'Spa con 4 terapeutas',
            'description' => 'Se nos cruzan las citas de WhatsApp.',
            'budget' => 'Entre 2 y 5 millones',
            'name' => 'Andrea Gómez',
            'email' => 'andrea@spa.co',
            'wants_meeting' => true,
            'consent' => true,
        ])->assertRedirect(route('site.thanks'));

        $lead = Lead::query()->firstOrFail();
        $this->assertSame('form', $lead->source);
        $this->assertNotNull($lead->consent_at);
        $this->assertSame($plan->id, $lead->recommended_plan_id);
        $this->assertSame('Entre 2 y 5 millones', $lead->budget_range);
        $this->assertSame('nuevo', $lead->stage->slug);
        $this->assertStringContainsString('reunión', $lead->activities()->first()->description);

        $this->get(route('site.thanks'))->assertOk()->assertInertia(fn (Assert $page) => $page->where('name', 'Andrea'));
    }

    public function test_forms_require_consent_and_a_way_to_reply()
    {
        $this->post(route('site.contact.store'), ['name' => 'Ana', 'message' => 'Hola, quiero una web.'])
            ->assertSessionHasErrors(['consent', 'email', 'phone']);

        $this->assertSame(0, Lead::query()->count());
    }

    public function test_bots_filling_the_hidden_field_are_ignored()
    {
        $this->post(route('site.contact.store'), [
            'name' => 'Bot', 'email' => 'bot@spam.com', 'message' => 'Compra seguidores baratos', 'consent' => true, 'website' => 'http://spam.com',
        ])->assertRedirect(route('site.thanks'));

        $this->assertSame(0, Lead::query()->count());
    }

    public function test_the_thanks_page_is_only_shown_after_a_real_submission()
    {
        $this->get(route('site.thanks'))->assertRedirect(route('home'));
    }

    public function test_forms_are_rate_limited()
    {
        foreach (range(1, 5) as $_) {
            $this->post(route('site.contact.store'), ['name' => 'X']);
        }

        $this->post(route('site.contact.store'), ['name' => 'X'])->assertTooManyRequests();
    }

    public function test_seo_tags_sitemap_and_robots()
    {
        Service::query()->update(['is_published' => true]);

        $html = $this->get(route('site.services'))->assertOk()->getContent();
        $this->assertStringContainsString('<meta name="description"', $html);
        $this->assertStringContainsString('<meta property="og:title" content="Servicios · IMAGIA">', $html);

        $sitemap = $this->get(route('sitemap'))->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8')->getContent();
        $this->assertStringContainsString(route('site.service', Service::query()->value('slug')), $sitemap);
        $this->assertStringNotContainsString('/admin', $sitemap);

        $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /admin')->assertSee(route('sitemap'));
    }

    public function test_legal_pages_replace_the_brand_and_email_placeholders()
    {
        Settings::put(Settings::CONTACT, [...Settings::get(Settings::CONTACT), 'email' => 'hola@imagia.dev']);

        $this->get(route('site.privacy'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('content', fn ($c) => str_contains($c, 'IMAGIA') && str_contains($c, 'hola@imagia.dev') && ! str_contains($c, '{marca}')));
    }

    public function test_admins_can_edit_the_legal_texts()
    {
        $this->actingAs($this->admin())
            ->put(route('admin.legal.update'), ['privacy' => "## Nuevo\n\nTexto", 'terms' => 'Términos'])
            ->assertSessionHasNoErrors();

        $this->assertSame("## Nuevo\n\nTexto", Settings::get(Settings::LEGAL)['privacy']);
        $this->actingAs($this->collaborator())->get(route('admin.legal.edit'))->assertForbidden();
    }

    public function test_service_features_shown_publicly_come_from_the_catalog()
    {
        $service = Service::query()->firstOrFail();
        $service->update(['is_published' => true]);
        $feature = Feature::query()->create(['name' => 'Exclusiva de prueba']);
        $service->features()->attach($feature);

        $this->get(route('site.service', $service->slug))
            ->assertInertia(fn (Assert $page) => $page->where('service.features', fn ($f) => collect($f)->contains('Exclusiva de prueba')));
    }
}
