<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuoteRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['nullable', 'required_without:lead_id', Rule::exists('clients', 'id')->whereNull('deleted_at')],
            'lead_id' => ['nullable', 'required_without:client_id', Rule::exists('leads', 'id')->whereNull('deleted_at')],
            'plan_id' => ['nullable', 'exists:plans,id'],
            'title' => ['required', 'string', 'max:255'],
            'scope' => ['nullable', 'string', 'max:10000'],
            'currency' => ['required', 'string', 'size:3'],
            'payment_terms' => ['nullable', 'string', 'max:5000'],
            'valid_until' => ['nullable', 'date'],
            'exclusions' => ['nullable', 'string', 'max:5000'],
            'notes' => ['nullable', 'string', 'max:5000'],

            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.details' => ['nullable', 'string', 'max:2000'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:100000'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999999'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'between:0,100'],
            'items.*.tax_rate_id' => ['nullable', 'exists:tax_rates,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.required_without' => 'Elige el cliente o el prospecto al que va dirigida.',
            'lead_id.required_without' => 'Elige el cliente o el prospecto al que va dirigida.',
            'items.required' => 'Agrega al menos un concepto.',
            'items.min' => 'Agrega al menos un concepto.',
            'items.*.quantity.gt' => 'La cantidad debe ser mayor que cero.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['currency' => mb_strtoupper((string) ($this->input('currency') ?: 'COP'))]);
    }
}
