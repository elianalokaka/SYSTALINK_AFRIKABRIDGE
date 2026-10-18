<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RessourceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $auteur = $this->utilisateur;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'titre' => $this->titre,
            'description' => $this->description,
            'url' => $this->url,
            'contenu_code' => $this->contenu_code,
            'langage' => $this->langage,
            'fichier_url' => $this->chemin_fichier
                ? asset('storage/'.$this->chemin_fichier)
                : null,
            'visibilite' => $this->visibilite,
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
            'competences' => $this->competences
                ->map(fn ($competence) => [
                    'id' => $competence->id,
                    'nom' => $competence->nom,
                    'categorie' => $competence->categorie,
                ])
                ->values()
                ->all(),
            'commentaires_count' => 0,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}