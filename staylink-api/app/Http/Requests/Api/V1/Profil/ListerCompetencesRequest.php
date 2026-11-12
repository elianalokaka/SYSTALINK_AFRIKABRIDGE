<?php

namespace App\Http\Requests\Api\V1\Profil;

use Illuminate\Foundation\Http\FormRequest;

class ListerCompetencesRequest extends FormRequest
{
    public const CATEGORIES = [
        'langage',
        'framework',
        'outil',
        'domaine_technique',
        'design',
        'gestion_projet',
        'autre',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string'],
            'categorie' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', self::CATEGORIES)],
        ];
    }

    public function messages(): array
    {
        return [
            'categorie.in' => 'La catégorie doit être langage, framework, outil, domaine_technique, design, gestion_projet ou autre.',
        ];
    }
}
