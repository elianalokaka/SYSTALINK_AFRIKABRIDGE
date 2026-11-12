<?php

namespace App\Services\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;

class SuppressionProjetService
{
    /**
     * @return array{code: int, message?: string}
     */
    public function supprimer(Utilisateur $acteur, Projet $projet): array
    {
        $estProprietaire = MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $acteur->id)
            ->where('role', 'proprietaire')
            ->exists();

        if (! $estProprietaire) {
            return [
                'code' => 403,
                'message' => 'Seul le propriétaire peut supprimer ce projet.',
            ];
        }

        $projet->delete();

        return ['code' => 204];
    }
}
