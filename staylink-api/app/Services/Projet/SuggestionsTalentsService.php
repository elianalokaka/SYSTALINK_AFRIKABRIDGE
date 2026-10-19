<?php

namespace App\Services\Projet;

use App\Models\MembreProjet;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class SuggestionsTalentsService
{
    /**
     * @return Collection<int, Utilisateur>
     */
    public function suggestionner(Utilisateur $utilisateur, int $limit): Collection
    {
        $projetsUtilisateur = MembreProjet::query()
            ->where('utilisateur_id', $utilisateur->id)
            ->select('projet_id');

        $competencesRecherchees = MembreProjet::query()
            ->join('projet_competence', 'projet_competence.projet_id', '=', 'membres_projet.projet_id')
            ->where('membres_projet.utilisateur_id', $utilisateur->id)
            ->distinct()
            ->pluck('projet_competence.competence_id');

        $competencesUtilisateur = $utilisateur->competences()
            ->pluck('competences.id');

        return Utilisateur::query()
            ->whereKeyNot($utilisateur->id)
            ->whereNotIn(
                'utilisateurs.id',
                MembreProjet::query()
                    ->whereIn('projet_id', $projetsUtilisateur)
                    ->select('utilisateur_id')
            )
            ->whereHas('competences', function (Builder $query) use (
                $competencesRecherchees,
                $competencesUtilisateur
            ): void {
                $query->where(function (Builder $query) use (
                    $competencesRecherchees,
                    $competencesUtilisateur
                ): void {
                    if ($competencesRecherchees->isNotEmpty()) {
                        $query->whereIn('competences.id', $competencesRecherchees);
                    }

                    if ($competencesUtilisateur->isEmpty()) {
                        $query->orWhereNotNull('competences.id');
                    } else {
                        $query->orWhereNotIn('competences.id', $competencesUtilisateur);
                    }
                });
            })
            ->with('competences')
            ->withCount([
                'abonnes as followers_count',
                'competences as skills_overlap_count' => function (Builder $query) use ($competencesRecherchees): void {
                    if ($competencesRecherchees->isNotEmpty()) {
                        $query->whereIn('competences.id', $competencesRecherchees);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                },
            ])
            ->withExists([
                'abonnes as is_following' => fn (Builder $query) => $query
                    ->where('abonne_id', $utilisateur->id),
            ])
            ->orderByDesc('skills_overlap_count')
            ->orderBy('utilisateurs.id')
            ->limit($limit)
            ->get();
    }
}
