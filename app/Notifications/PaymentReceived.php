<?php

namespace App\Notifications;

use App\Models\PaymentLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Un cliente pagó en línea un link de pago.
 */
class PaymentReceived extends Notification
{
    use Queueable;

    public function __construct(public readonly PaymentLink $link) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    private function amount(): string
    {
        return '$'.number_format((float) $this->link->amount, 0, ',', '.')." {$this->link->currency}";
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Pago recibido: {$this->amount()}")
            ->greeting('¡Recibiste un pago en línea!')
            ->line("{$this->amount()} por «{$this->link->description}» del proyecto {$this->link->project?->name}.")
            ->action('Ver proyecto', route('admin.projects.show', $this->link->project_id))
            ->line('Ya quedó registrado en Finanzas.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Pago recibido: {$this->amount()}",
            'body' => "{$this->link->project?->name} · {$this->link->description}",
            'url' => route('admin.projects.show', $this->link->project_id, absolute: false),
            'icon' => 'payment',
        ];
    }
}
