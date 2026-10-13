<?php

namespace App\Http\Requests\Admin;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeadRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'source' => ['required', Rule::in(array_keys(Lead::SOURCES))],
            'need' => ['nullable', 'string', 'max:5000'],
            'budget_range' => ['nullable', 'string', 'max:80'],
            'urgency' => ['nullable', 'string', 'max:80'],
            'pipeline_stage_id' => ['nullable', 'exists:pipeline_stages,id'],
            'assigned_to' => ['nullable', Rule::exists('users', 'id')->where('is_active', true)],
            'next_follow_up_at' => ['nullable', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }
}
