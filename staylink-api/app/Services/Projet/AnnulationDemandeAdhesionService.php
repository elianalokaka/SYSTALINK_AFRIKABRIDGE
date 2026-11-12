<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\Utilisateur;

class AnnulationDemandeAdhesionService
{
    /**
     * @return array{code: int, message?: string}
     */
    public function annuler(Utilisateur $acteur, Candidature $candidature): array
    {
        if ((int) $candidature->candidat_id !== (int) $acteur->id) {
            return [
                'code' => 403,
                'message' => 'Tu ne peux annuler que ta propre demande.',
            ];
        }

        if ($candidature->statut !== 'en_attente') {
            return [
                'code' => 409,
                'message' => 'Cette demande a déjà été traitée.',
            ];
        }

        $candidature->delete();

        return ['code' => 204];
    }
}
