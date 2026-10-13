<?php

namespace App\Http\Requests\Admin;

use App\Models\Plan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PlanRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'summary' => ['required', 'string', 'max:300'],
            'description' => ['nullable', 'string', 'max:5000'],
            'service_id' => ['nullable', 'exists:services,id'],
            'price_type' => ['required', Rule::in(array_keys(Plan::PRICE_TYPES))],
            'price' => ['nullable', 'numeric', 'min:0', 'max:999999999999'],
            'currency' => ['required', 'string', 'size:3'],
            'estimated_time' => ['nullable', 'string', 'max:100'],
            'limits' => ['nullable', 'string', 'max:5000'],
            'exclusions' => ['nullable', 'string', 'max:5000'],
            'badge' => ['nullable', 'string', 'max:40'],
            'is_published' => ['boolean'],

            'features' => ['array', 'max:60'],
            'features.*.feature_id' => ['required', 'integer', 'distinct', 'exists:features,id'],
            'features.*.kind' => ['required', Rule::in(['included', 'optional'])],
            'features.*.extra_price_note' => ['nullable', 'string', 'max:100'],

            'addons' => ['array', 'max:20'],
            'addons.*.name' => ['required', 'string', 'max:120'],
            'addons.*.note' => ['nullable', 'string', 'max:160'],

            'faqs' => ['array', 'max:30'],
            'faqs.*.question' => ['required', 'string', 'max:255'],
            'faqs.*.answer' => ['required', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'features.*.feature_id.distinct' => 'Esta funcionalidad está repetida.',
        ];
    }

    /**
     * No se publica un plan con precio fijo o «desde» sin el valor.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $needsPrice = in_array($this->input('price_type'), ['fixed', 'from'], true);
                $price = (float) $this->input('price');

                if ($needsPrice && $price <= 0 && $this->boolean('is_published')) {
                    $validator->errors()->add('price', 'Para publicar el plan escribe el precio, o cambia el tipo a «Solo cotización».');
                }
            },
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'currency' => mb_strtoupper((string) ($this->input('currency') ?: 'COP')),
            'price' => $this->input('price_type') === 'quote' ? null : $this->input('price'),
        ]);
    }
}
