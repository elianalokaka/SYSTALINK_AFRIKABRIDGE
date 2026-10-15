<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class InscriptionRequest extends FormRequest
{
    /**
     * L'inscription est accessible sans authentification.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation des données selon le contrat OpenAPI.
     */
    public function rules(): array
    {
        return [
            'nom' => [
                'required',
                'string',
                'max:100',
            ],

            'prenom' => [
                'required',
                'string',
                'max:100',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:utilisateurs,email',
            ],

            'mot_de_passe' => [
                'required',
                'string',
                'confirmed',
                Password::min(8),
            ],

            'pays' => [
                'required',
                'string',
                'size:2',
                'regex:/^[A-Za-z]{2}$/',
            ],
        ];
    }

    /**
     * Normalisation avant validation.
     */
    protected function prepareForValidation(): void
    {
        $donnees = [];

        if (is_string($this->input('email'))) {
            $donnees['email'] = mb_strtolower(
                trim($this->input('email'))
            );
        }

        if (is_string($this->input('nom'))) {
            $donnees['nom'] = trim($this->input('nom'));
        }

        if (is_string($this->input('prenom'))) {
            $donnees['prenom'] = trim($this->input('prenom'));
        }

        if (is_string($this->input('pays'))) {
            $donnees['pays'] = strtoupper(
                trim($this->input('pays'))
            );
        }

        $this->merge($donnees);
    }

    /**
     * Messages de validation personnalisés.
     */
    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email' => "L'adresse e-mail est invalide.",
            'email.unique' => "Cette adresse e-mail est déjà utilisée.",
            'mot_de_passe.required' => 'Le mot de passe est obligatoire.',
            'mot_de_passe.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'pays.required' => 'Le pays est obligatoire.',
            'pays.size' => 'Le pays doit être un code de deux lettres.',
            'pays.regex' => 'Le code du pays doit contenir uniquement deux lettres.',
        ];
    }
}