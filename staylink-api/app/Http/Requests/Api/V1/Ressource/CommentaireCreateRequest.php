<?php

namespace App\Http\Requests\Api\V1\Ressource;

use Illuminate\Foundation\Http\FormRequest;

class CommentaireCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('contenu'))) {
            $this->merge([
                'contenu' => trim($this->input('contenu')),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'contenu' => ['required', 'string', 'min:1', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'contenu.required' => 'Le contenu est obligatoire.',
            'contenu.min' => 'Le contenu est obligatoire.',
            'contenu.max' => 'Le contenu ne peut pas dépasser 1000 caractères.',
        ];
    }
}
