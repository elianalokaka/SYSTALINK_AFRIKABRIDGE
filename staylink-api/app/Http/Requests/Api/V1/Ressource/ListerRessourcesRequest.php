<?php

namespace App\Http\Requests\Api\V1\Ressource;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListerRessourcesRequest extends FormRequest
{
    public const TYPES = [
        'code',
        'lien',
        'tutoriel',
        'api',
        'document',
        'article',
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
            'type' => ['sometimes', 'nullable', 'string', Rule::in(self::TYPES)],
            'competence_ids' => ['sometimes', 'nullable', 'array'],
            'competence_ids.*' => ['integer'],
            'projet_id' => ['sometimes', 'nullable', 'integer'],
            'auteur_id' => ['sometimes', 'nullable', 'integer'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Le type de ressource n\'est pas reconnu.',
            'per_page.max' => 'Le nombre d\'éléments par page ne peut pas dépasser 50.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $ids = $this->input('competence_ids');
        if ($ids !== null && ! is_array($ids)) {
            $this->merge(['competence_ids' => [$ids]]);
        }
    }
}
