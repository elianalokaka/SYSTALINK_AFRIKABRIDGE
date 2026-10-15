<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ConnexionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
            ],

            'mot_de_passe' => [
                'required',
                'string',
            ],

            'se_souvenir' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $donnees = [];

        if (is_string($this->input('email'))) {
            $donnees['email'] = mb_strtolower(
                trim($this->input('email'))
            );
        }

        $this->merge($donnees);
    }

    public function messages(): array
    {
        return [
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email' => "L'adresse e-mail est invalide.",
            'mot_de_passe.required' => 'Le mot de passe est obligatoire.',
            'se_souvenir.boolean' => 'Le champ se_souvenir doit être un booléen.',
        ];
    }
}