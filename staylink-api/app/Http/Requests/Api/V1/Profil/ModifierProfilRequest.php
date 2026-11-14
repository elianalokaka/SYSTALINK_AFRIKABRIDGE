<?php

namespace App\Http\Requests\Api\V1\Profil;

use App\Support\CatalogueDomaines;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModifierProfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['sometimes', 'string', 'max:200'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'pays' => ['sometimes', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'],
            'region' => ['sometimes', 'nullable', 'string', 'max:100'],
            'role_profil' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(RechercherTalentsRequest::ROLES_PROFIL),
            ],
            'domaines' => ['sometimes', 'array', 'max:12'],
            'domaines.*' => [
                'required',
                'string',
                'distinct',
                'min:1',
                'max:100',
            ],
            'liens' => ['sometimes', 'array', 'max:20'],
            'liens.*.type' => [
                'required',
                'string',
                Rule::in(['github', 'gitlab', 'linkedin', 'portfolio', 'twitter', 'autre']),
            ],
            'liens.*.url' => ['required', 'string', 'url:http,https', 'max:2048'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $donnees = [];

        if (is_string($this->input('pays'))) {
            $donnees['pays'] = strtoupper(trim($this->input('pays')));
        }

        if (is_string($this->input('nom'))) {
            $donnees['nom'] = trim($this->input('nom'));
        }

        if (is_string($this->input('region'))) {
            $region = trim($this->input('region'));
            $donnees['region'] = $region === '' ? null : $region;
        }

        if (is_string($this->input('role_profil'))) {
            $role = trim($this->input('role_profil'));
            $donnees['role_profil'] = $role === '' ? null : $role;
        }

        if (is_string($this->input('bio'))) {
            $bio = trim($this->input('bio'));
            $donnees['bio'] = $bio === '' ? null : $bio;
        }

        if (is_array($this->input('domaines'))) {
            $donnees['domaines'] = CatalogueDomaines::normaliserListe($this->input('domaines'));
        }

        if ($donnees !== []) {
            $this->merge($donnees);
        }
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est obligatoire.',
            'pays.size' => 'Le pays doit être un code de deux lettres.',
            'pays.regex' => 'Le code du pays doit contenir uniquement deux lettres.',
            'role_profil.in' => 'Le rôle de profil n\'est pas reconnu.',
            'domaines.max' => 'Douze domaines au maximum.',
            'domaines.*.distinct' => 'Un domaine ne peut pas être répété.',
            'domaines.*.max' => 'Le nom du domaine ne peut pas dépasser 100 caractères.',
            'liens.*.type.in' => 'Ce type de lien n\'est pas reconnu.',
            'liens.*.url.url' => 'L\'adresse du lien est invalide.',
        ];
    }
}
