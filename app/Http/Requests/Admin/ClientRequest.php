<?php

namespace App\Http\Requests\Admin;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(array_keys(Client::TYPES))],
            'name' => ['required', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'whatsapp' => ['nullable', 'regex:/^[1-9][0-9]{7,14}$/'],
            'city' => ['nullable', 'string', 'max:80'],
            'website' => ['nullable', 'url:http,https', 'max:255'],
            'status' => ['required', Rule::in(array_keys(Client::STATUSES))],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'whatsapp.regex' => 'Escribe el número con indicativo del país, sin «+» ni espacios. Ejemplo: 573001234567.',
            'website.url' => 'Escribe el enlace completo, empezando por https://',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('whatsapp')) {
            $this->merge(['whatsapp' => preg_replace('/\D+/', '', (string) $this->input('whatsapp'))]);
        }

        if ($this->filled('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }
}
