<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ressource_id' => $this->ressource_id,
            'auteur' => (new UtilisateurResumeResource($this->auteur))->resolve($request),
            'contenu' => $this->contenu,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
