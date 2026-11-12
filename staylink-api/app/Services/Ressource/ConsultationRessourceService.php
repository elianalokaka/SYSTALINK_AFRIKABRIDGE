<?php

namespace App\Services\Ressource;

use App\Models\Ressource;
use App\Models\Utilisateur;

class ConsultationRessourceService
{
    /**
     * @return array{code: int, message?: string, ressource?: Ressource}
     */
    public function voir(Utilisateur $acteur, Ressource $ressource): array
    {
        if (! $ressource->estVisiblePour($acteur)) {
            return [
                'code' => 403,
                'message' => 'Seuls les membres du projet peuvent voir cette ressource.',
            ];
        }

        $ressource->load(['utilisateur', 'competences']);
        $ressource->loadCount('commentaires as commentaires_count');

        return [
            'code' => 200,
            'ressource' => $ressource,
        ];
    }
}
