<?php

namespace App\Http\Requests\Admin;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaskRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $projectId = $this->route('task')?->project_id ?? $this->input('project_id');

        return [
            'project_id' => [$this->route('task') ? 'prohibited' : 'required', Rule::exists('projects', 'id')->whereNull('deleted_at')],
            'milestone_id' => ['nullable', Rule::exists('milestones', 'id')->where('project_id', $projectId)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['required', Rule::in(array_keys(Task::STATUSES))],
            'priority' => ['required', Rule::in(array_keys(Project::PRIORITIES))],
            'assignee_id' => ['nullable', Rule::exists('users', 'id')->where('is_active', true)],
            'due_date' => ['nullable', 'date'],
            'weight' => ['required', 'integer', 'between:1,10'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'project_id.exists' => 'Elige un proyecto activo.',
            'milestone_id.exists' => 'El hito no pertenece a este proyecto.',
            'weight.between' => 'El peso va de 1 (tarea pequeña) a 10 (tarea muy grande).',
        ];
    }
}
