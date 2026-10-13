<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->with('roles:id,name')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name,
                'is_active' => $user->is_active,
                'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => collect(Permissions::roleLabels())
                ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
                ->values(),
        ]);
    }

    /**
     * Crea la cuenta con una contraseña aleatoria y envía un enlace para que la persona
     * defina la suya. Solo se informa «enviado» si el envío realmente se completó.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Str::password(40),
            'is_active' => true,
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        $user->syncRoles([$data['role']]);

        $sent = $this->sendInvitation($user);

        Inertia::flash('toast', $sent
            ? ['type' => 'success', 'message' => "Usuario creado. Enviamos a {$user->email} un enlace para crear su contraseña."]
            : ['type' => 'warning', 'message' => 'Usuario creado, pero no se pudo enviar el correo. Revisa la configuración de correo e intenta reenviar la invitación.']);

        return to_route('admin.users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        $user->update(['name' => $data['name'], 'is_active' => $data['is_active']]);
        $user->syncRoles([$data['role']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario actualizado.']);

        return to_route('admin.users.index');
    }

    public function resendInvitation(User $user): RedirectResponse
    {
        $sent = $this->sendInvitation($user);

        Inertia::flash('toast', $sent
            ? ['type' => 'success', 'message' => "Enlace enviado a {$user->email}."]
            : ['type' => 'error', 'message' => 'No se pudo enviar el correo. Revisa la configuración de correo.']);

        return to_route('admin.users.index');
    }

    private function sendInvitation(User $user): bool
    {
        try {
            return Password::broker()->sendResetLink(['email' => $user->email]) === Password::RESET_LINK_SENT;
        } catch (Throwable $e) {
            report($e);

            return false;
        }
    }
}
