<?php

namespace App\Http\Requests\Api\V1\Profil;

use Illuminate\Foundation\Http\FormRequest;

class RechercherTalentsRequest extends FormRequest
{
    public const DOMAINES = [
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
    ];

    public const ROLES_PROFIL = [
        'developpeur_frontend',
        'developpeur_backend',
        'fullstack',
        'designer_ui_ux',
        'ingenieur_iot',
        'data_scientist',
        'chef_de_projet',
        'etudiant',
        'entrepreneur',
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
            'competence_ids' => ['sometimes', 'nullable', 'array'],
            'competence_ids.*' => ['integer'],
            'competence_match' => ['sometimes', 'nullable', 'string', 'in:any,all'],
            'domaine' => ['sometimes', 'nullable', 'string', 'max:100'],
            'pays' => ['sometimes', 'nullable', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'],
            'region' => ['sometimes', 'nullable', 'string'],
            'role_profil' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', self::ROLES_PROFIL)],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'competence_match.in' => 'Le critère de compétences doit être any ou all.',
            'domaine.in' => 'Le domaine n\'est pas reconnu.',
            'role_profil.in' => 'Le rôle de profil n\'est pas reconnu.',
            'pays.size' => 'Le pays doit être un code de deux lettres.',
            'per_page.max' => 'Le nombre d\'éléments par page ne peut pas dépasser 50.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $ids = $this->input('competence_ids');
        if ($ids !== null && ! is_array($ids)) {
            $this->merge(['competence_ids' => [$ids]]);
        }

        if (is_string($this->input('pays'))) {
            $this->merge(['pays' => strtoupper(trim($this->input('pays')))]);
        }
    }
}
