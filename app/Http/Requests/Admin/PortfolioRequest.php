<?php

namespace App\Http\Requests\Admin;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PortfolioRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'client_display_name' => ['nullable', 'string', 'max:255'],
            'client_name_authorized' => ['boolean'],
            'category' => ['required', Rule::in(array_keys(Project::CATEGORIES))],
            'summary' => ['required', 'string', 'max:300'],
            'problem' => ['nullable', 'string', 'max:5000'],
            'solution' => ['nullable', 'string', 'max:5000'],
            'highlights' => ['array', 'max:15'],
            'highlights.*' => ['required', 'string', 'max:160'],
            'technologies' => ['array', 'max:20'],
            'technologies.*' => ['required', 'string', 'max:60'],
            'completed_on' => ['nullable', 'date'],
            'public_url' => ['nullable', 'url:https,http', 'max:255'],
            'is_confidential' => ['boolean'],
            'is_featured' => ['boolean'],

            'testimonials' => ['array', 'max:10'],
            'testimonials.*.author_name' => ['required', 'string', 'max:255'],
            'testimonials.*.author_role' => ['nullable', 'string', 'max:255'],
            'testimonials.*.quote' => ['required', 'string', 'max:2000'],
            'testimonials.*.authorized_at' => ['nullable', 'date', 'before_or_equal:today', 'required_if_accepted:testimonials.*.is_published'],
            'testimonials.*.authorization_note' => ['nullable', 'string', 'max:255'],
            'testimonials.*.is_published' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'testimonials.*.authorized_at.required_if_accepted' => 'Para publicar un testimonio indica cuándo autorizó el cliente su publicación.',
            'public_url.url' => 'Escribe el enlace completo, empezando por https://',
        ];
    }

    protected function prepareForValidation(): void
    {
        $clean = fn ($items) => array_values(array_filter((array) $items, fn ($v) => filled($v)));

        $this->merge([
            'highlights' => $clean($this->input('highlights', [])),
            'technologies' => array_values(array_unique(array_map('trim', $clean($this->input('technologies', []))))),
        ]);
    }
}
