<?php

namespace App\Services\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;

class RetirerMembreProjetService
{
    /**
     * @return array{code: int, message?: string}
     */
    public function retirer(Utilisateur $acteur, Projet $projet, int $utilisateurId): array
    {
        $membreCible = MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $utilisateurId)
            ->first();

        if ($membreCible === null) {
            return [
                'code' => 404,
                'message' => 'Ce membre ne fait pas partie du projet.',
            ];
        }

        $participationActeur = MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $acteur->id)
            ->first();

        if ($participationActeur === null) {
            return [
                'code' => 403,
                'message' => 'Vous ne pouvez pas gérer les membres de ce projet.',
            ];
        }

        if ($participationActeur->role === 'proprietaire') {
            if ((int) $membreCible->utilisateur_id === (int) $acteur->id) {
                return [
                    'code' => 409,
                    'message' => 'Le propriétaire ne peut pas quitter son projet.',
                ];
            }
        } elseif ((int) $membreCible->utilisateur_id !== (int) $acteur->id) {
            return [
                'code' => 403,
                'message' => 'Un membre peut uniquement quitter le projet lui-même.',
            ];
        }

        $membreCible->delete();

        return ['code' => 204];
    }
}
