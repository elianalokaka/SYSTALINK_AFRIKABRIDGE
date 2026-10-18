<?php

namespace App\Http\Requests\Api\V1\Profil;

use Illuminate\Foundation\Http\FormRequest;

class ModifierProfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['sometimes', 'string', 'max:120'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'pays' => ['sometimes', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('pays'))) {
            $this->merge(['pays' => strtoupper(trim($this->input('pays')))]);
        }
    }
}
