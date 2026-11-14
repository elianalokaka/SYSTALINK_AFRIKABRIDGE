<?php

namespace App\Services\Ressource;

use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Storage;

class SuppressionRessourceService
{
    /**
     * @return array{code: int, message?: string}
     */
    public function supprimer(Utilisateur $acteur, Ressource $ressource): array
    {
        if (! $ressource->estModifiablePar($acteur)) {
            return [
                'code' => 403,
                'message' => 'Seul l\'auteur ou le propriétaire du projet peut supprimer cette ressource.',
            ];
        }

        if (filled($ressource->chemin_fichier)) {
            Storage::disk('local')->delete($ressource->chemin_fichier);
            Storage::disk('public')->delete($ressource->chemin_fichier);
        }

        $ressource->delete();

        return ['code' => 204];
    }
}
