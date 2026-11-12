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
                ? url('/api/v1/resources/'.$this->id.'/file')
                : null,
            'visibilite' => $this->visibilite,
            'projet_id' => $this->projet_id,
            'auteur' => array_filter([
                'id' => $auteur->id,
                'nom' => trim($auteur->prenom.' '.$auteur->nom),
                'photo_url' => $auteur->photo_profil
                    ? asset('storage/'.$auteur->photo_profil)
                    : null,
                'pays' => $auteur->pays,
                'role_profil' => $auteur->role_profil ?: null,
            ], fn ($valeur, $cle) => $cle !== 'role_profil' || $valeur !== null, ARRAY_FILTER_USE_BOTH),
            'competences' => $this->competences
                ->map(fn ($competence) => [
                    'id' => $competence->id,
                    'nom' => $competence->nom,
                    'categorie' => $competence->categorie,
                ])
                ->values()
                ->all(),
            'commentaires_count' => (int) ($this->commentaires_count ?? 0),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}