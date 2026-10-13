<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ContactSettingsRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $social = ['nullable', 'url:https', 'max:255'];

        return [
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'whatsapp' => ['nullable', 'regex:/^[1-9][0-9]{7,14}$/'],
            'whatsapp_message' => ['nullable', 'string', 'max:200'],
            'city' => ['nullable', 'string', 'max:80'],
            'instagram' => $social,
            'facebook' => $social,
            'linkedin' => $social,
            'tiktok' => $social,
            'github' => $social,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'whatsapp.regex' => 'Escribe el número con el indicativo del país y sin espacios ni «+». Ejemplo: 573001234567.',
            '*.url' => 'Escribe el enlace completo, empezando por https://',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('whatsapp')) {
            $this->merge(['whatsapp' => preg_replace('/\D+/', '', (string) $this->input('whatsapp'))]);
        }
    }
}
