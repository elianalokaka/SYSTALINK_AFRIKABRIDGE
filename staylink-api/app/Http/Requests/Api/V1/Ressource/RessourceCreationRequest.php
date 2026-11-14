<?php

namespace App\Http\Requests\Api\V1\Ressource;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RessourceCreationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => [
                'required',
                'string',
                Rule::in(['code', 'lien', 'tutoriel', 'api', 'document', 'article', 'autre']),
            ],
            'titre' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'url' => ['nullable', 'string', 'url', 'max:2048'],
            'contenu_code' => ['nullable', 'string', 'max:20000'],
            'langage' => ['nullable', 'string', 'max:50'],
            'fichier' => [
                Rule::requiredIf(fn () => $this->input('type') === 'document'),
                'nullable',
                'file',
                'mimes:pdf,docx,zip,png,jpg',
                'max:10240',
            ],
            'projet_id' => ['nullable', 'integer', 'exists:projets,id'],
            'visibilite' => ['nullable', 'string', Rule::in(['projet', 'publique'])],
            'competence_ids' => ['sometimes', 'array'],
            'competence_ids.*' => ['integer', 'distinct', 'exists:competences,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->missing('visibilite')) {
            $this->merge([
                'visibilite' => $this->filled('projet_id') ? 'projet' : 'publique',
            ]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $type = $this->input('type');
            $exigeUneUrl = in_array($type, ['lien', 'tutoriel', 'api'], true);
            $aUnContenu = $this->filled('url')
                || $this->filled('contenu_code')
                || $this->hasFile('fichier');

            if ($exigeUneUrl && ! $aUnContenu) {
                $validator->errors()->add(
                    'url',
                    'Une adresse est obligatoire pour ce type de ressource.',
                );
            }

            if ($this->input('visibilite') === 'projet' && ! $this->filled('projet_id')) {
                $validator->errors()->add(
                    'visibilite',
                    'Une ressource limitée au projet doit être rattachée à un projet.',
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Le type de ressource est obligatoire.',
            'type.in' => 'Ce type de ressource n\'est pas reconnu.',
            'titre.required' => 'Le titre est obligatoire.',
            'titre.max' => 'Le titre ne peut pas dépasser 200 caractères.',
            'description.max' => 'La description ne peut pas dépasser 2000 caractères.',
            'url.url' => 'L\'adresse doit être une URL valide.',
            'fichier.required' => 'Un document doit être joint.',
            'fichier.mimes' => 'Le fichier doit être un pdf, docx, zip, png ou jpg.',
            'fichier.max' => 'Le fichier ne doit pas dépasser 10 Mo.',
            'visibilite.in' => 'La visibilité doit être projet ou publique.',
            'projet_id.exists' => 'Ce projet n\'existe pas.',
            'competence_ids.*.exists' => 'Une compétence indiquée n\'existe pas.',
        ];
    }
}