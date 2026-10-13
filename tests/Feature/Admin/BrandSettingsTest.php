<?php

namespace Tests\Feature\Admin;

use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BrandSettingsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_replace([
            'name' => 'imagia',
            'tagline' => 'Tú lo imaginas. Nosotros hacemos la magia.',
            'descriptor' => 'Software · Apps · Automatización',
            'origin' => [['part' => 'Imagina', 'meaning' => 'lo que el cliente trae']],
            'acronym' => collect(['I', 'M', 'A', 'G', 'I', 'A'])
                ->map(fn ($l, $i) => ['letter' => $l, 'word' => "Palabra {$i}", 'description' => "Descripción {$i}"])
                ->all(),
        ], $overrides);
    }

    public function test_admins_see_the_brand_settings_loaded_from_brand_json()
    {
        $this->actingAs($this->admin())
            ->get(route('admin.brand.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/settings/brand')
                ->where('settings.name', 'IMAGIA')
                ->where('settings.acronym.2.word', 'Automatización')
                ->has('settings.origin', 3)
            );
    }

    public function test_admins_can_update_the_brand_and_it_is_shared_everywhere()
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->put(route('admin.brand.update'), $this->payload(['tagline' => 'Nuevo lema']))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.brand.edit'));

        $brand = Settings::get(Settings::BRAND);
        $this->assertSame('IMAGIA', $brand['name']);
        $this->assertSame('Nuevo lema', $brand['tagline']);
        $this->assertSame('Palabra 0', $brand['acronym'][0]['word']);
        $this->assertNotEmpty($brand['logo_parts'], 'Los significados del logo se conservan');

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->where('brand.tagline', 'Nuevo lema'));
    }

    public function test_the_acronym_must_have_one_word_per_letter_in_order()
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->put(route('admin.brand.update'), $this->payload(['name' => 'NOVA']))
            ->assertSessionHasErrors('acronym');

        $wrongOrder = $this->payload();
        $wrongOrder['acronym'][1]['letter'] = 'X';

        $this->actingAs($admin)
            ->put(route('admin.brand.update'), $wrongOrder)
            ->assertSessionHasErrors('acronym.1.letter');
    }

    public function test_the_name_only_accepts_letters()
    {
        $this->actingAs($this->admin())
            ->put(route('admin.brand.update'), $this->payload(['name' => 'IMAG 1A']))
            ->assertSessionHasErrors('name');
    }

    public function test_collaborators_cannot_edit_the_brand()
    {
        $collaborator = $this->collaborator();

        $this->actingAs($collaborator)->get(route('admin.brand.edit'))->assertForbidden();
        $this->actingAs($collaborator)->put(route('admin.brand.update'), $this->payload())->assertForbidden();
    }
}
