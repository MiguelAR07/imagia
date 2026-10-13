<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admins_see_the_user_list()
    {
        $admin = $this->admin();
        $this->collaborator(['name' => 'Ana']);

        $this->actingAs($admin)
            ->get(route('admin.users.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users/index')
                ->has('users', 2)
                ->has('roles', 2)
            );
    }

    public function test_admins_can_invite_a_collaborator()
    {
        Notification::fake();

        $this->actingAs($this->admin())
            ->post(route('admin.users.store'), [
                'name' => 'Ana Pérez',
                'email' => 'ANA@ejemplo.com',
                'role' => Permissions::ROLE_COLLABORATOR,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.users.index'));

        $user = User::query()->where('email', 'ana@ejemplo.com')->firstOrFail();
        $this->assertTrue($user->hasRole(Permissions::ROLE_COLLABORATOR));
        $this->assertTrue($user->is_active);
        $this->assertNotNull($user->email_verified_at);
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_emails_must_be_unique()
    {
        $admin = $this->admin();
        $this->collaborator(['email' => 'ana@ejemplo.com']);

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Otra Ana',
                'email' => 'ana@ejemplo.com',
                'role' => Permissions::ROLE_COLLABORATOR,
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_admins_can_change_role_and_deactivate_users()
    {
        $admin = $this->admin();
        $user = $this->collaborator();

        $this->actingAs($admin)
            ->put(route('admin.users.update', $user), [
                'name' => 'Nombre nuevo',
                'role' => Permissions::ROLE_ADMIN,
                'is_active' => false,
            ])
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('Nombre nuevo', $user->name);
        $this->assertTrue($user->hasRole(Permissions::ROLE_ADMIN));
        $this->assertFalse($user->hasRole(Permissions::ROLE_COLLABORATOR));
        $this->assertFalse($user->is_active);
    }

    public function test_admins_cannot_demote_or_deactivate_themselves()
    {
        $admin = $this->admin();
        $this->admin();

        $this->actingAs($admin)
            ->put(route('admin.users.update', $admin), [
                'name' => $admin->name,
                'role' => Permissions::ROLE_COLLABORATOR,
                'is_active' => true,
            ])
            ->assertSessionHasErrors('role');

        $this->assertTrue($admin->fresh()->hasRole(Permissions::ROLE_ADMIN));
    }

    public function test_the_last_active_admin_cannot_be_removed()
    {
        $onlyAdmin = $this->admin();
        $this->admin(['is_active' => false]);

        // Un colaborador con permiso para gestionar usuarios intenta quitarle el rol.
        $manager = $this->collaborator();
        $manager->givePermissionTo(Permissions::MANAGE_USERS);

        $this->actingAs($manager)
            ->put(route('admin.users.update', $onlyAdmin), [
                'name' => $onlyAdmin->name,
                'role' => Permissions::ROLE_COLLABORATOR,
                'is_active' => true,
            ])
            ->assertSessionHasErrors('role');

        $this->assertTrue($onlyAdmin->fresh()->hasRole(Permissions::ROLE_ADMIN));
    }

    public function test_collaborators_cannot_manage_users()
    {
        $collaborator = $this->collaborator();

        $this->actingAs($collaborator)->get(route('admin.users.index'))->assertForbidden();
        $this->actingAs($collaborator)
            ->post(route('admin.users.store'), [
                'name' => 'X',
                'email' => 'x@ejemplo.com',
                'role' => Permissions::ROLE_ADMIN,
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'x@ejemplo.com']);
    }
}
