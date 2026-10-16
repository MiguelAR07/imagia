<?php

namespace App\Notifications;

use App\Models\Quote;
use App\Support\Settings;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Correo al cliente con el enlace privado de su cotización para revisarla y aceptarla pagando el anticipo.
 */
class QuoteForClient extends Notification
{
    use Queueable;

    public function __construct(public readonly Quote $quote) {}

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
        $money = fn (float $v) => '$'.number_format($v, 0, ',', '.')." {$this->quote->currency}";
        $name = $this->quote->recipientName();

        $mail = (new MailMessage)
            ->subject("Tu propuesta {$this->quote->number} · {$brand}")
            ->greeting($name ? "Hola, {$name}" : 'Hola')
            ->line("Te compartimos la propuesta «{$this->quote->title}» por un total de {$money((float) $this->quote->total)}.")
            ->line('Para empezar se paga el '.Quote::DEPOSIT_PERCENT.' % ('.$money($this->quote->depositAmount()).') y el resto cuando te entreguemos el proyecto. Puedes pagar con tarjeta (también a cuotas), PSE o Nequi.')
            ->action('Ver propuesta y aceptar', route('site.quote.view', $this->quote->public_token));

        if ($this->quote->valid_until) {
            $mail->line('La propuesta es válida hasta el '.$this->quote->valid_until->format('d/m/Y').'.');
        }

        return $mail
            ->line('Si tienes dudas, responde este correo y con gusto te ayudamos.')
            ->salutation("Equipo {$brand}");
    }
}
