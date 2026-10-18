<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjetUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['sometimes', 'string', 'max:150'],
            'description' => ['sometimes', 'string', 'max:3000'],
            'domaine' => [
                'sometimes',
                'string',
                Rule::in([
                    'agriculture',
                    'sante',
                    'education',
                    'fintech',
                    'energie',
                    'transport',
                    'iot',
                    'intelligence_artificielle',
                    'commerce',
                    'environnement',
                    'administration',
                    'autre',
                ]),
            ],
            'objectifs' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'competence_ids' => ['sometimes', 'array'],
            'competence_ids.*' => ['integer', 'distinct', 'exists:competences,id'],
            'nombre_membres_souhaite' => ['sometimes', 'integer', 'min:2', 'max:50'],
            'statut' => [
                'sometimes',
                Rule::in(['recrutement', 'en_cours', 'termine']),
            ],
            'progression' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'lien_realisation' => ['sometimes', 'nullable', 'url', 'max:2048'],
        ];
    }
}
