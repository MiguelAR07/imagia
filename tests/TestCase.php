<?php

namespace Tests;

use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    /**
     * Crea un usuario con el rol indicado (y siembra roles y permisos si hace falta).
     *
     * @param  array<string, mixed>  $attributes
     */
    protected function userWithRole(string $role, array $attributes = []): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        return User::factory()->create($attributes)->assignRole($role);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function admin(array $attributes = []): User
    {
        return $this->userWithRole(Permissions::ROLE_ADMIN, $attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function collaborator(array $attributes = []): User
    {
        return $this->userWithRole(Permissions::ROLE_COLLABORATOR, $attributes);
    }
}
