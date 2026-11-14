<?php

namespace App\Services\Ressource;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PublicationRessourceService
{
    /**
     * @param  array<string, mixed>  $donnees
     * @return array{code: int, message?: string, ressource?: Ressource}
     */
    public function publier(Utilisateur $auteur, array $donnees, ?UploadedFile $fichier): array
    {
        $projet = null;

        if (! empty($donnees['projet_id'])) {
            $projet = Projet::query()->findOrFail($donnees['projet_id']);

            if (! $this->estMembre($auteur, $projet)) {
                return [
                    'code' => 403,
                    'message' => 'Seuls les membres du projet peuvent y partager une ressource.',
                ];
            }
        }

        $ressource = DB::transaction(function () use ($auteur, $donnees, $fichier) {
            $chemin = $fichier?->store('ressources', 'local');

            $ressource = Ressource::query()->create([
                'utilisateur_id' => $auteur->id,
                'projet_id' => $donnees['projet_id'] ?? null,
                'titre' => $donnees['titre'],
                'description' => $donnees['description'] ?? null,
                'type' => $donnees['type'],
                'url' => $donnees['url'] ?? null,
                'contenu_code' => $donnees['contenu_code'] ?? null,
                'langage' => $donnees['langage'] ?? null,
                'chemin_fichier' => $chemin,
                'visibilite' => $donnees['visibilite'],
            ]);

            if (! empty($donnees['competence_ids'])) {
                $ressource->competences()->sync($donnees['competence_ids']);
            }

            $ressource->load(['utilisateur', 'competences']);
            $ressource->loadCount('commentaires as commentaires_count');

            return $ressource;
        });

        return [
            'code' => 201,
            'ressource' => $ressource,
        ];
    }

    private function estMembre(Utilisateur $utilisateur, Projet $projet): bool
    {
        return MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $utilisateur->id)
            ->exists();
    }
}