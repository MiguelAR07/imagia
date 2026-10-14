<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Throwable;

/**
 * Envía avisos al equipo. Un aviso que falla (por ejemplo, el correo) nunca
 * debe impedir que se guarde lo importante: se registra el error y se sigue.
 */
class Notify
{
    /**
     * A todos los usuarios activos que tienen el permiso (los administradores siempre).
     */
    public static function team(string $permission, Notification $notification, ?User $except = null): void
    {
        $users = User::query()->where('is_active', true)->get()
            ->filter(fn (User $u) => $u->can($permission) && $u->id !== $except?->id);

        foreach ($users as $user) {
            self::user($user, $notification);
        }
    }

    public static function user(User $user, Notification $notification): void
    {
        try {
            $user->notify($notification);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
