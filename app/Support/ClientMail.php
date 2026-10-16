<?php

namespace App\Support;

use Illuminate\Notifications\Notification as BaseNotification;
use Illuminate\Support\Facades\Notification;
use Throwable;

/**
 * Correos que se envían al cliente. Si el servidor de correo falla (p. ej. clave mal
 * configurada) se registra el error y se informa en el panel, sin romper la acción.
 */
class ClientMail
{
    public static function send(string $email, BaseNotification $notification): bool
    {
        try {
            Notification::route('mail', $email)->notify($notification);

            return true;
        } catch (Throwable $e) {
            report($e);

            return false;
        }
    }
}
