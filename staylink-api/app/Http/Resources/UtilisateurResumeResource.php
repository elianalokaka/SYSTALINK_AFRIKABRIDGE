<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UtilisateurResumeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $resume = [
            'id' => $this->id,
            'nom' => $this->nomComplet(),
            'photo_url' => $this->photo_profil
                ? asset('storage/'.$this->photo_profil)
                : null,
            'pays' => $this->pays,
        ];

        if (filled($this->role_profil)) {
            $resume['role_profil'] = $this->role_profil;
        }

        return $resume;
    }
}