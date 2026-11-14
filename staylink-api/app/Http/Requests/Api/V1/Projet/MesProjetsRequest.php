<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MesProjetsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role_equipe' => ['sometimes', 'nullable', 'string', Rule::in(['proprietaire', 'membre'])],
            'statut' => ['sometimes', 'nullable', 'string', Rule::in(['recrutement', 'en_cours', 'termine'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'role_equipe.in' => 'Le rôle d\'équipe doit être proprietaire ou membre.',
            'statut.in' => 'Le statut doit être recrutement, en_cours ou termine.',
            'per_page.max' => 'Le nombre d\'éléments par page ne peut pas dépasser 50.',
        ];
    }
}
