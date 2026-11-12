<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Builder;

class VoirProjetService
{
    public function voir(Utilisateur $acteur, int $projetId): ?Projet
    {
        return Projet::query()
            ->with(['createur', 'domaines', 'competences', 'membres'])
            ->withCount('participations')
            ->addSelect([
                'ma_demande_statut' => Candidature::query()
                    ->select('statut')
                    ->whereColumn('projet_id', 'projets.id')
                    ->where('candidat_id', $acteur->id)
                    ->latest('id')
                    ->limit(1),
            ])
            ->withExists([
                'membres as is_member' => fn (Builder $membres) => $membres
                    ->where('utilisateurs.id', $acteur->id),
            ])
            ->find($projetId);
    }
}
