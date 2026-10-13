<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_public_page_shows_the_brand_and_only_public_contact_data()
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('welcome')
                ->where('brand.name', 'IMAGIA')
                ->has('brand.acronym', 6)
                ->has('contact.whatsapp')
                ->missing('contact.phone')
            );
    }
}
