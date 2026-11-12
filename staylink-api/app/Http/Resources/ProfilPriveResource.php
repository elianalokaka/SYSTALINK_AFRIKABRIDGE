<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfilPriveResource extends JsonResource
{
    /**
     * Transforme un utilisateur en profil privé.
     *
     * Cette ressource doit être utilisée uniquement
     * pour l'utilisateur authentifié.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'nom' => $this->nomComplet(),
            'email' => $this->email,

            'photo_url' => $this->photo_profil
                ? asset('storage/'.$this->photo_profil)
                : null,

            'pays' => $this->pays,

            'role_profil' => $this->when(
                filled($this->role_profil),
                $this->role_profil
            ),
            'region' => $this->region,

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

            'domaines' => $this->whenLoaded(
                'domaines',
                fn () => $this->domaines->pluck('domaine')->values()->all(),
                []
            ),

            'liens' => $this->whenLoaded(
                'liens',
                fn () => $this->liens->map(
                    fn ($lien) => [
                        'type' => $lien->type,
                        'url' => $lien->url,
                    ]
                )->values()->all(),
                []
            ),

            'followers_count' => (int) ($this->followers_count ?? 0),
            'following_count' => (int) ($this->following_count ?? 0),
            'is_following' => false,

            'projets_realises_count' => (int) ($this->projets_realises_count ?? 0),

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}