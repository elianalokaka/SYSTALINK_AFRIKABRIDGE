<?php

namespace App\Http\Requests\Api\V1\Ressource;

use Illuminate\Foundation\Http\FormRequest;

class RessourceUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['sometimes', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'url' => ['sometimes', 'nullable', 'string', 'url', 'max:2048'],
            'contenu_code' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'langage' => ['sometimes', 'nullable', 'string', 'max:50'],
            'competence_ids' => ['sometimes', 'array'],
            'competence_ids.*' => ['integer', 'distinct', 'exists:competences,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'titre.max' => 'Le titre ne peut pas dépasser 200 caractères.',
            'description.max' => 'La description ne peut pas dépasser 2000 caractères.',
            'url.url' => 'L\'adresse doit être une URL valide.',
            'contenu_code.max' => 'Le code ne peut pas dépasser 20000 caractères.',
            'competence_ids.*.exists' => 'Une compétence indiquée n\'existe pas.',
        ];
    }
}
