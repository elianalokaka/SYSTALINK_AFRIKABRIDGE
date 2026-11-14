<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListerDemandesProjetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->exists('statut')) {
            $this->merge(['statut' => 'en_attente']);
        }
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', 'string', Rule::in(['en_attente', 'acceptee', 'refusee'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'statut.in' => 'Le statut doit être en_attente, acceptee ou refusee.',
            'per_page.max' => 'Le nombre d\'éléments par page ne peut pas dépasser 50.',
        ];
    }
}
