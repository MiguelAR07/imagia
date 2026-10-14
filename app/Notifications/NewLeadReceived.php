<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Llegó un prospecto desde el sitio (formulario o asistente).
 */
class NewLeadReceived extends Notification
{
    use Queueable;

    public function __construct(public readonly Lead $lead) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $source = mb_strtolower(Lead::SOURCES[$this->lead->source] ?? 'el sitio');

        return (new MailMessage)
            ->subject("Nuevo prospecto: {$this->lead->name}")
            ->greeting('¡Llegó un nuevo prospecto!')
            ->line("{$this->lead->name}".($this->lead->company ? " ({$this->lead->company})" : '')." escribió desde {$source}.")
            ->when($this->lead->need, fn (MailMessage $m) => $m->line(mb_strimwidth((string) $this->lead->need, 0, 300, '…')))
            ->action('Ver prospecto', route('admin.leads.show', $this->lead))
            ->line('Responder pronto aumenta la probabilidad de cerrar la venta.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Nuevo prospecto: {$this->lead->name}",
            'body' => 'Desde '.mb_strtolower(Lead::SOURCES[$this->lead->source] ?? 'el sitio').($this->lead->company ? " · {$this->lead->company}" : ''),
            'url' => route('admin.leads.show', $this->lead, absolute: false),
            'icon' => 'lead',
        ];
    }
}
