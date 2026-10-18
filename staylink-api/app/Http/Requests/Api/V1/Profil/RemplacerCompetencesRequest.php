<?php

namespace App\Http\Requests\Api\V1\Profil;

use Illuminate\Foundation\Http\FormRequest;

class RemplacerCompetencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'competences' => ['present', 'array', 'max:30'],
            'competences.*' => ['required', 'array'],
            'competences.*.competence_id' => [
                'required',
                'integer',
                'distinct',
                'exists:competences,id',
            ],
            'competences.*.niveau' => [
                'sometimes',
                'nullable',
                'string',
                'in:debutant,intermediaire,avance',
            ],
        ];
    }
}
