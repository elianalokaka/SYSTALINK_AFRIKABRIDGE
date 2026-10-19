<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TalentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $domainesAcceptes = [
            'agriculture',
            'sante',
            'education',
            'fintech',
            'energie',
            'transport',
            'iot',
            'intelligence_artificielle',
            'commerce',
            'environnement',
            'administration',
            'autre',
        ];

        return [
            'id' => $this->id,
            'nom' => trim($this->prenom.' '.$this->nom),
            'photo_url' => $this->photo_profil
                ? asset('storage/'.$this->photo_profil)
                : null,
            'pays' => $this->pays,
            'role_profil' => null,
            'region' => null,
            'bio' => $this->biographie
                ? mb_substr($this->biographie, 0, 160)
                : null,
            'competences' => $this->competences->map(
                fn ($competence) => [
                    'id' => $competence->id,
                    'nom' => $competence->nom,
                    'categorie' => $competence->categorie,
                    'niveau' => $competence->pivot?->niveau,
                ]
            )->values()->all(),
            'domaines' => $this->domaine !== null && in_array($this->domaine, $domainesAcceptes, true)
                ? [$this->domaine]
                : [],
            'followers_count' => (int) ($this->followers_count ?? 0),
            'is_following' => (bool) ($this->is_following ?? false),
        ];
    }
}
