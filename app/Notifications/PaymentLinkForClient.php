<?php

namespace App\Notifications;

use App\Models\PaymentLink;
use App\Support\Settings;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Correo al cliente con un link de pago (p. ej. el saldo final al entregar).
 */
class PaymentLinkForClient extends Notification
{
    use Queueable;

    public function __construct(public readonly PaymentLink $link) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $brand = Settings::get(Settings::BRAND)['name'];
        $amount = '$'.number_format((float) $this->link->amount, 0, ',', '.')." {$this->link->currency}";
        $project = $this->link->project;

        return (new MailMessage)
            ->subject("Pago pendiente: {$this->link->description} · {$brand}")
            ->greeting($project?->client?->name ? "Hola, {$project->client->name}" : 'Hola')
            ->line($this->link->kind === 'balance'
                ? "¡Tu proyecto {$project?->name} está listo! Para terminar, queda el pago del saldo final: {$amount}."
                : "Te enviamos el link para pagar «{$this->link->description}» del proyecto {$project?->name}: {$amount}.")
            ->action("Pagar {$amount}", route('site.pay', $this->link))
            ->line('Puedes pagar con tarjeta (también a cuotas), PSE o Nequi. El pago es seguro, con Wompi.')
            ->line('Si tienes dudas, responde este correo.')
            ->salutation("Equipo {$brand}");
    }
}
