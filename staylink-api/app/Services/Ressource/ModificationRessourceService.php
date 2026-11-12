<?php

namespace App\Services\Ressource;

use App\Models\Ressource;
use App\Models\Utilisateur;

class ModificationRessourceService
{
    /**
     * @param  array<string, mixed>  $donnees
     * @return array{code: int, message?: string, ressource?: Ressource}
     */
    public function modifier(Utilisateur $acteur, Ressource $ressource, array $donnees): array
    {
        if (! $ressource->estModifiablePar($acteur)) {
            return [
                'code' => 403,
                'message' => 'Seul l\'auteur ou le propriétaire du projet peut modifier cette ressource.',
            ];
        }

        $modifications = [];
        foreach (['titre', 'description', 'url', 'contenu_code', 'langage'] as $champ) {
            if (array_key_exists($champ, $donnees)) {
                $modifications[$champ] = $donnees[$champ];
            }
        }

        if ($modifications !== []) {
            $ressource->update($modifications);
        }

        if (array_key_exists('competence_ids', $donnees)) {
            $ressource->competences()->sync($donnees['competence_ids'] ?? []);
        }

        $ressource->load(['utilisateur', 'competences']);
        $ressource->loadCount('commentaires as commentaires_count');

        return [
            'code' => 200,
            'ressource' => $ressource,
        ];
    }
}
