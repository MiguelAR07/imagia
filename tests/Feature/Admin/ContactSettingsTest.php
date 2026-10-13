<?php

namespace Tests\Feature\Admin;

use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admins_can_save_contact_data_and_the_whatsapp_number_is_normalized()
    {
        $this->actingAs($this->admin())
            ->put(route('admin.contact.update'), [
                'email' => 'hola@imagia.dev',
                'whatsapp' => '+57 300 123 4567',
                'whatsapp_message' => 'Hola',
                'instagram' => 'https://instagram.com/imagia',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.contact.edit'));

        $contact = Settings::get(Settings::CONTACT);
        $this->assertSame('573001234567', $contact['whatsapp']);
        $this->assertSame('hola@imagia.dev', $contact['email']);
    }

    public function test_invalid_social_links_and_numbers_are_rejected()
    {
        $this->actingAs($this->admin())
            ->put(route('admin.contact.update'), [
                'whatsapp' => '123',
                'instagram' => 'javascript:alert(1)',
                'facebook' => 'http://facebook.com/sin-https',
            ])
            ->assertSessionHasErrors(['whatsapp', 'instagram', 'facebook']);
    }
}
