<?php

namespace App\Http\Requests\Admin;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActivityRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(array_keys(Activity::MANUAL_TYPES))],
            'description' => ['required', 'string', 'max:5000'],
            'happened_at' => ['nullable', 'date', 'before_or_equal:now'],
        ];
    }
}
