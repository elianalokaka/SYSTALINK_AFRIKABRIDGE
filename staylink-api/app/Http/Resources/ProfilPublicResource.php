<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfilPublicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'photo_url' => $this->photo_profil
                ? asset('storage/'.$this->photo_profil)
                : null,
            'pays' => $this->pays,
            'role_profil' => null,
            'region' => null,
            'bio_courte' => $this->biographie
                ? mb_substr($this->biographie, 0, 160)
                : null,
            'bio' => $this->biographie,
            'competences' => $this->whenLoaded(
                'competences',
                fn () => $this->competences->map(
                    fn ($competence) => [
                        'id' => $competence->id,
                        'nom' => $competence->nom,
                        'categorie' => $competence->categorie,
                        'niveau' => $competence->pivot?->niveau,
                    ]
                )->values()->all(),
                []
            ),
            'domaines' => [],
            'liens' => [],
            'followers_count' => 0,
            'following_count' => 0,
            'is_following' => false,
            'projets_realises_count' => 0,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
