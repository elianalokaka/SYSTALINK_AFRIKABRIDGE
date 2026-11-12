<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class MesProjetsService
{
    /**
     * @param  array{
     *     role_equipe?: string|null,
     *     statut?: string|null,
     *     per_page?: int|null
     * }  $filtres
     */
    public function lister(Utilisateur $acteur, array $filtres): LengthAwarePaginator
    {
        $parPage = (int) ($filtres['per_page'] ?? 15);
        $role = $filtres['role_equipe'] ?? null;

        return Projet::query()
            ->whereHas(
                'membres',
                function (Builder $membres) use ($acteur, $role): void {
                    $membres->where('utilisateurs.id', $acteur->id);

                    if (is_string($role) && $role !== '') {
                        $membres->where('membres_projet.role', $role);
                    }
                }
            )
            ->with(['createur', 'domaines', 'competences'])
            ->withCount('participations')
            ->withExists([
                'membres as is_member' => fn (Builder $membres) => $membres
                    ->where('utilisateurs.id', $acteur->id),
            ])
            ->addSelect([
                'ma_demande_statut' => Candidature::query()
                    ->select('statut')
                    ->whereColumn('projet_id', 'projets.id')
                    ->where('candidat_id', $acteur->id)
                    ->latest('id')
                    ->limit(1),
            ])
            ->when(($filtres['statut'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where('statut', $filtres['statut']))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($parPage);
    }
}
