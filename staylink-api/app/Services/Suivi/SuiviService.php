<?php

namespace App\Services\Suivi;

use App\Models\Abonnement;
use App\Models\Utilisateur;
use Illuminate\Validation\ValidationException;

class SuiviService
{
    /**
     * Suivre un membre.
     *
     * @return array{code: int, etat: array{is_following: bool, followers_count: int}}
     */
    public function suivre(Utilisateur $abonne, Utilisateur $suivi): array
    {
        if ($abonne->id === $suivi->id) {
            throw ValidationException::withMessages([
                'id' => ['Impossible de se suivre soi-même.'],
            ]);
        }

        $dejaSuivi = Abonnement::query()
            ->where('abonne_id', $abonne->id)
            ->where('suivi_id', $suivi->id)
            ->exists();

        if (! $dejaSuivi) {
            Abonnement::query()->create([
                'abonne_id' => $abonne->id,
                'suivi_id' => $suivi->id,
            ]);
        }

        return [
            'code' => $dejaSuivi ? 409 : 201,
            'etat' => $this->etat($suivi, true),
        ];
    }

    /**
     * Ne plus suivre un membre. Idempotent.
     *
     * @return array{etat: array{is_following: bool, followers_count: int}}
     */
    public function nePlusSuivre(Utilisateur $abonne, Utilisateur $suivi): array
    {
        Abonnement::query()
            ->where('abonne_id', $abonne->id)
            ->where('suivi_id', $suivi->id)
            ->delete();

        return [
            'etat' => $this->etat($suivi, false),
        ];
    }

    /**
     * @return array{is_following: bool, followers_count: int}
     */
    private function etat(Utilisateur $suivi, bool $suit): array
    {
        return [
            'is_following' => $suit,
            'followers_count' => Abonnement::query()
                ->where('suivi_id', $suivi->id)
                ->count(),
        ];
    }
}