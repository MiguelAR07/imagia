<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * A alguien le asignaron una tarea.
 */
class TaskAssigned extends Notification
{
    use Queueable;

    public function __construct(public readonly Task $task, public readonly ?User $by = null) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Te asignaron: {$this->task->title}",
            'body' => collect([
                $this->task->project?->name,
                $this->task->due_date ? 'vence el '.$this->task->due_date->format('d/m/Y') : null,
                $this->by ? "por {$this->by->name}" : null,
            ])->filter()->implode(' · '),
            'url' => route('admin.projects.show', $this->task->project_id, absolute: false),
            'icon' => 'task',
        ];
    }
}
