<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $auteur = $this->expediteur;

        return [
            'id' => $this->id,
            'projet_id' => $this->projet_id,
            'auteur' => [
                'id' => $auteur->id,
                'nom' => trim($auteur->prenom.' '.$auteur->nom),
                'photo_url' => $auteur->photo_profil
                    ? asset('storage/'.$auteur->photo_profil)
                    : null,
                'pays' => $auteur->pays,
                'role_profil' => null,
            ],
            'contenu' => $this->contenu,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}