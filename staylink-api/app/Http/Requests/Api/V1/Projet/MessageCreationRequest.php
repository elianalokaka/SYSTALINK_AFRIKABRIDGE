<?php

namespace App\Http\Requests\Api\V1\Projet;

use Illuminate\Foundation\Http\FormRequest;

class MessageCreationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contenu' => ['required', 'string', 'min:1', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'contenu.required' => 'Le message est obligatoire.',
            'contenu.min' => 'Le message est obligatoire.',
            'contenu.max' => 'Le message ne peut pas dépasser 2000 caractères.',
        ];
    }
}