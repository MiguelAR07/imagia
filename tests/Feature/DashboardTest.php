<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_users_without_a_role_cannot_enter_the_panel()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertForbidden();
    }

    public function test_collaborators_can_visit_the_dashboard()
    {
        $this->actingAs($this->collaborator())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('brand.name', 'IMAGIA')
                ->has('brand.acronym', 6)
                ->where('stats.active_users', 1)
            );
    }

    public function test_the_brand_meaning_is_shared_with_every_page()
    {
        $this->actingAs($this->admin())
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('brand.acronym.0.letter', 'I')
                ->where('brand.acronym.0.word', 'Innovación')
                ->where('brand.tagline', 'Tú lo imaginas. Nosotros hacemos la magia.')
                ->has('story.logo_parts', 3)
            );
    }

    public function test_deactivated_users_are_logged_out()
    {
        $user = $this->collaborator(['is_active' => false]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('login'));

        $this->assertGuest();
    }
}
