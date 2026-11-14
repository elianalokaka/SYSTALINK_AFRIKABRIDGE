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
                'required_without:competences.*.nom',
                'integer',
                'distinct',
                'exists:competences,id',
            ],
            'competences.*.nom' => [
                'required_without:competences.*.competence_id',
                'string',
                'min:1',
                'max:100',
            ],
            'competences.*.niveau' => [
                'sometimes',
                'nullable',
                'string',
                'in:debutant,intermediaire,avance',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $lignes = $this->input('competences');
        if (! is_array($lignes)) {
            return;
        }

        $this->merge([
            'competences' => array_map(function ($ligne) {
                if (! is_array($ligne)) {
                    return $ligne;
                }
                if (isset($ligne['nom']) && is_string($ligne['nom'])) {
                    $ligne['nom'] = trim(preg_replace('/\s+/u', ' ', $ligne['nom']) ?? $ligne['nom']);
                }

                return $ligne;
            }, $lignes),
        ]);
    }

    public function messages(): array
    {
        return [
            'competences.*.competence_id.required_without' => 'Indique l\'identifiant ou le nom de la compétence.',
            'competences.*.nom.required_without' => 'Indique le nom de la compétence.',
            'competences.*.competence_id.exists' => 'Cette compétence n\'existe pas.',
            'competences.*.niveau.in' => 'Le niveau doit être debutant, intermediaire ou avance.',
        ];
    }
}
