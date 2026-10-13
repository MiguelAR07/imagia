<?php

namespace App\Http\Requests\Admin;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['required', Rule::exists('clients', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'category' => ['nullable', Rule::in(array_keys(Project::CATEGORIES))],
            'status' => ['required', Rule::in(array_keys(Project::STATUSES))],
            'priority' => ['required', Rule::in(array_keys(Project::PRIORITIES))],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'agreed_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999999'],
            'currency' => ['required', 'string', 'size:3'],
            'progress_mode' => ['required', Rule::in(['tasks', 'manual'])],
            'manual_progress' => ['nullable', 'required_if:progress_mode,manual', 'integer', 'between:0,100'],
            'observations' => ['nullable', 'string', 'max:10000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.exists' => 'Elige un cliente activo.',
            'due_date.after_or_equal' => 'La entrega no puede ser antes del inicio.',
            'manual_progress.required_if' => 'Indica el porcentaje de avance.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'currency' => mb_strtoupper((string) ($this->input('currency') ?: 'COP')),
        ]);
    }
}
