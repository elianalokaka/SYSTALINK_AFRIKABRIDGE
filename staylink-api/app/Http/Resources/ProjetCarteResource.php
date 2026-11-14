<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjetCarteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $createur = $this->createur;
        $description = (string) $this->description;

        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'description_courte' => mb_substr($description, 0, 200),
            'domaines' => $this->domaines
                ->pluck('domaine')
                ->values()
                ->all(),
            'statut' => $this->statut,
            'progression' => (int) $this->progression,
            'nombre_membres_souhaite' => $this->nombre_max_membres,
            'nombre_membres_actuel' => (int) ($this->participations_count ?? $this->participations()->count()),
            'competences_recherchees' => $this->competences
                ->map(fn ($competence) => [
                    'id' => $competence->id,
                    'nom' => $competence->nom,
                    'categorie' => $competence->categorie,
                ])
                ->values()
                ->all(),
            'createur' => array_filter([
                'id' => $createur->id,
                'nom' => trim($createur->prenom.' '.$createur->nom),
                'photo_url' => $createur->photo_profil
                    ? asset('storage/'.$createur->photo_profil)
                    : null,
                'pays' => $createur->pays,
                'role_profil' => $createur->role_profil ?: null,
            ], fn ($valeur, $cle) => $cle !== 'role_profil' || $valeur !== null, ARRAY_FILTER_USE_BOTH),
            'is_member' => (bool) ($this->is_member ?? false),
            'ma_demande_statut' => $this->ma_demande_statut,
        ];
    }
}
