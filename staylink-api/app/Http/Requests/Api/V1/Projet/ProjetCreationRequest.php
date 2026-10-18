<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjetCreationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:3000'],
            'domaines' => ['required', 'array', 'min:1', 'max:3'],
            'domaines.*' => [
                'required',
                'string',
                'distinct',
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
            'objectifs' => ['required', 'string', 'max:2000'],
            'competence_ids' => ['sometimes', 'array'],
            'competence_ids.*' => ['integer', 'distinct', 'exists:competences,id'],
            'nombre_membres_souhaite' => ['required', 'integer', 'min:2', 'max:50'],
            'statut' => ['required', Rule::in(['recrutement', 'en_cours'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('statut') === null) {
            $this->merge(['statut' => 'recrutement']);
        }
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom du projet est obligatoire.',
            'description.required' => 'La description est obligatoire.',
            'domaines.required' => 'Au moins un domaine est obligatoire.',
            'domaines.min' => 'Au moins un domaine est obligatoire.',
            'domaines.max' => 'Trois domaines au maximum.',
            'domaines.*.distinct' => 'Un domaine ne peut pas être répété.',
            'domaines.*.in' => 'Ce domaine n\'est pas reconnu.',
            'objectifs.required' => 'Les objectifs sont obligatoires.',
            'nombre_membres_souhaite.min' => 'Le projet doit prévoir au moins 2 membres.',
            'nombre_membres_souhaite.max' => 'Le projet ne peut pas prévoir plus de 50 membres.',
            'statut.in' => 'Un projet ne peut pas être créé avec le statut termine.',
            'competence_ids.*.exists' => 'Une compétence indiquée n\'existe pas.',
        ];
    }
}