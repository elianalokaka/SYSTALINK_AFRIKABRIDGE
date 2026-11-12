<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MembreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $utilisateur = $this->utilisateur;

        return [
            'utilisateur' => array_filter([
                'id' => $utilisateur->id,
                'nom' => trim($utilisateur->prenom.' '.$utilisateur->nom),
                'photo_url' => $utilisateur->photo_profil
                    ? asset('storage/'.$utilisateur->photo_profil)
                    : null,
                'pays' => $utilisateur->pays,
                'role_profil' => $utilisateur->role_profil ?: null,
            ], fn ($valeur, $cle) => $cle !== 'role_profil' || $valeur !== null, ARRAY_FILTER_USE_BOTH),
            'role_equipe' => $this->role,
            'rejoint_le' => $this->date_adhesion?->toISOString(),
        ];
    }
}
