<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DemandeAdhesionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $projet = $this->projet;
        $candidat = $this->candidat;

        return [
            'id' => $this->id,
            'projet' => [
                'id' => $projet->id,
                'nom' => $projet->nom,
                'domaines' => $projet->domaines->pluck('domaine')->values()->all(),
                'statut' => $projet->statut,
                'progression' => (int) $projet->progression,
                'nombre_membres_souhaite' => $projet->nombre_max_membres,
                'nombre_membres_actuel' => (int) ($projet->participations_count ?? $projet->participations()->count()),
            ],
            'utilisateur' => array_filter([
                'id' => $candidat->id,
                'nom' => trim($candidat->prenom.' '.$candidat->nom),
                'photo_url' => $candidat->photo_profil
                    ? asset('storage/'.$candidat->photo_profil)
                    : null,
                'pays' => $candidat->pays,
                'role_profil' => $candidat->role_profil ?: null,
            ], fn ($valeur, $cle) => $cle !== 'role_profil' || $valeur !== null, ARRAY_FILTER_USE_BOTH),
            'message' => $this->message_motivation,
            'statut' => $this->statut,
            'created_at' => $this->created_at?->toISOString(),
            'traitee_at' => $this->date_decision?->toISOString(),
        ];
    }
}