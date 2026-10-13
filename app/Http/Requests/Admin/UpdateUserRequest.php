<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateUserRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', Rule::in(array_keys(Permissions::roleLabels()))],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * Evita quedarse sin administradores activos o bloquearse a uno mismo.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                /** @var User $target */
                $target = $this->route('user');
                $losesAdmin = $this->input('role') !== Permissions::ROLE_ADMIN || ! $this->boolean('is_active');

                if ($target->is($this->user()) && $losesAdmin) {
                    $validator->errors()->add('role', 'No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.');

                    return;
                }

                if ($losesAdmin && $target->hasRole(Permissions::ROLE_ADMIN)) {
                    $otherActiveAdmins = User::role(Permissions::ROLE_ADMIN)
                        ->where('is_active', true)
                        ->whereKeyNot($target->getKey())
                        ->count();

                    if ($otherActiveAdmins === 0) {
                        $validator->errors()->add('role', 'Debe quedar al menos un administrador activo.');
                    }
                }
            },
        ];
    }
}
