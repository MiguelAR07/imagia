<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class BrandSettingsRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:20', 'regex:/^[\pL]+$/u'],
            'tagline' => ['required', 'string', 'max:120'],
            'descriptor' => ['required', 'string', 'max:80'],
            'origin' => ['array', 'max:5'],
            'origin.*.part' => ['required', 'string', 'max:30'],
            'origin.*.meaning' => ['required', 'string', 'max:80'],
            'acronym' => ['required', 'array', 'max:20'],
            'acronym.*.letter' => ['required', 'string', 'size:1'],
            'acronym.*.word' => ['required', 'string', 'max:40'],
            'acronym.*.description' => ['required', 'string', 'max:160'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.regex' => 'El nombre solo puede tener letras, sin espacios ni números.',
        ];
    }

    /**
     * Cada letra del nombre necesita su palabra en las siglas, en el mismo orden.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $letters = mb_str_split(mb_strtoupper((string) $this->input('name')));
                $acronym = $this->input('acronym', []);

                if (count($acronym) !== count($letters)) {
                    $validator->errors()->add('acronym', 'Las siglas deben tener una palabra por cada letra del nombre ('.count($letters).').');

                    return;
                }

                foreach ($letters as $i => $letter) {
                    if (mb_strtoupper($acronym[$i]['letter']) !== $letter) {
                        $validator->errors()->add("acronym.{$i}.letter", 'La letra número '.($i + 1)." debe ser «{$letter}».");
                    }
                }
            },
        ];
    }
}
