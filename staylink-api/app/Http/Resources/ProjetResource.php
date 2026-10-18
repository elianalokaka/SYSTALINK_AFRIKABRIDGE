<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $createur = $this->createur;

        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'description' => $this->description,
            'objectifs' => $this->objectifs,
            'domaines' => $this->domaines
                ->pluck('domaine')
                ->values()
                ->all(),
            'statut' => $this->statut,
            'progression' => $this->progression,
            'nombre_membres_souhaite' => $this->nombre_max_membres,
            'nombre_membres_actuel' => $this->participations()->count(),
            'competences_recherchees' => $this->competences
                ->map(fn ($competence) => [
                    'id' => $competence->id,
                    'nom' => $competence->nom,
                    'categorie' => $competence->categorie,
                ])
                ->values()
                ->all(),
            'createur' => [
                'id' => $createur->id,
                'nom' => trim($createur->prenom.' '.$createur->nom),
                'photo_url' => $createur->photo_profil
                    ? asset('storage/'.$createur->photo_profil)
                    : null,
                'pays' => $createur->pays,
                'role_profil' => null,
            ],
            'lien_realisation' => $this->lien_realisation,
            'date_fin' => $this->date_fin?->toDateString(),
            'is_member' => true,
            'ma_demande_statut' => null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
