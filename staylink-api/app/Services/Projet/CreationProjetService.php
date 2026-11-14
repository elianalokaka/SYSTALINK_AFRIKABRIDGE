<?php

namespace App\Services\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;

class CreationProjetService
{
    public function creer(Utilisateur $createur, array $donnees): Projet
    {
        return DB::transaction(function () use ($createur, $donnees) {
            $projet = Projet::query()->create([
                'createur_id' => $createur->id,
                'nom' => $donnees['nom'],
                'description' => $donnees['description'],
                'domaine' => $donnees['domaines'][0],
                'objectifs' => $donnees['objectifs'],
                'nombre_max_membres' => $donnees['nombre_membres_souhaite'],
                'statut' => $donnees['statut'],
            ]);

            foreach ($donnees['domaines'] as $domaine) {
                $projet->domaines()->create([
                    'domaine' => $domaine,
                ]);
            }

            if (! empty($donnees['competence_ids'])) {
                $projet->competences()->sync($donnees['competence_ids']);
            }

            MembreProjet::query()->create([
                'projet_id' => $projet->id,
                'utilisateur_id' => $createur->id,
                'role' => 'proprietaire',
            ]);

            return $projet->load(['domaines', 'competences', 'createur']);
        });
    }
}