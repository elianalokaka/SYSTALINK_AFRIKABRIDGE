<?php

namespace App\Services\Ressource;

use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Storage;

class TelechargerFichierRessourceService
{
    /**
     * @return array{code: int, message?: string, disque?: string, chemin?: string, nom?: string}
     */
    public function ouvrir(Utilisateur $acteur, Ressource $ressource): array
    {
        if (! $ressource->estVisiblePour($acteur)) {
            return [
                'code' => 403,
                'message' => 'Seuls les membres du projet peuvent télécharger ce fichier.',
            ];
        }

        if (! filled($ressource->chemin_fichier)) {
            return [
                'code' => 404,
                'message' => 'Cette ressource n\'a pas de fichier.',
            ];
        }

        foreach (['local', 'public'] as $disque) {
            if (Storage::disk($disque)->exists($ressource->chemin_fichier)) {
                return [
                    'code' => 200,
                    'disque' => $disque,
                    'chemin' => $ressource->chemin_fichier,
                    'nom' => basename($ressource->chemin_fichier),
                ];
            }
        }

        return [
            'code' => 404,
            'message' => 'Fichier introuvable.',
        ];
    }
}
