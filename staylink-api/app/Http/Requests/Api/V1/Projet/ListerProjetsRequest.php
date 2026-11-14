<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListerProjetsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string'],
            'domaine' => ['sometimes', 'nullable', 'string', 'max:100'],
            'statut' => ['sometimes', 'nullable', 'string', Rule::in(['recrutement', 'en_cours', 'termine'])],
            'competence_ids' => ['sometimes', 'nullable', 'array'],
            'competence_ids.*' => ['integer'],
            'places_disponibles' => ['sometimes', 'nullable', 'boolean'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'domaine.in' => 'Le domaine n\'est pas reconnu.',
            'statut.in' => 'Le statut doit être recrutement, en_cours ou termine.',
            'per_page.max' => 'Le nombre d\'éléments par page ne peut pas dépasser 50.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $ids = $this->input('competence_ids');
        if ($ids !== null && ! is_array($ids)) {
            $this->merge(['competence_ids' => [$ids]]);
        }

        if ($this->exists('places_disponibles') && ! is_bool($this->input('places_disponibles'))) {
            $this->merge([
                'places_disponibles' => filter_var(
                    $this->input('places_disponibles'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ),
            ]);
        }
    }
}
