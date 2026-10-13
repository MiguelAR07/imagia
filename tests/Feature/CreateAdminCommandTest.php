<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_verified_active_admin()
    {
        $this->artisan('imagia:admin', ['--name' => 'Miguel', '--email' => 'Miguel@Ejemplo.com'])
            ->expectsQuestion('Contraseña (mínimo 12 caracteres)', 'clave-segura-2026')
            ->assertSuccessful();

        $user = User::query()->where('email', 'miguel@ejemplo.com')->firstOrFail();
        $this->assertTrue($user->hasRole(Permissions::ROLE_ADMIN));
        $this->assertTrue($user->is_active);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue(Hash::check('clave-segura-2026', $user->password));
    }

    public function test_it_promotes_an_existing_user_without_changing_the_password()
    {
        $user = $this->collaborator(['email' => 'ana@ejemplo.com']);
        $hash = $user->password;

        $this->artisan('imagia:admin', ['--name' => 'Ana', '--email' => 'ana@ejemplo.com'])
            ->assertSuccessful();

        $user->refresh();
        $this->assertTrue($user->hasRole(Permissions::ROLE_ADMIN));
        $this->assertSame($hash, $user->password);
    }
}
