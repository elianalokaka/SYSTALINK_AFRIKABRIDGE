<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ListerProjetsService
{
    /**
     * @param  array{
     *     q?: string|null,
     *     domaine?: string|null,
     *     statut?: string|null,
     *     competence_ids?: array<int, int>|null,
     *     places_disponibles?: bool|null,
     *     per_page?: int|null
     * }  $filtres
     */
    public function lister(Utilisateur $acteur, array $filtres): LengthAwarePaginator
    {
        $parPage = (int) ($filtres['per_page'] ?? 15);
        $recherche = isset($filtres['q']) ? trim((string) $filtres['q']) : '';
        $competenceIds = array_values(array_unique(array_map(
            'intval',
            $filtres['competence_ids'] ?? []
        )));

        return Projet::query()
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
            ->when($recherche !== '', function (Builder $requete) use ($recherche): void {
                $terme = '%'.addcslashes($recherche, '%_\\').'%';
                $requete->where(function (Builder $requete) use ($terme): void {
                    $requete
                        ->where('nom', 'ilike', $terme)
                        ->orWhere('description', 'ilike', $terme);
                });
            })
            ->when(($filtres['domaine'] ?? '') !== '', fn (Builder $requete) => $requete
                ->whereHas(
                    'domaines',
                    fn (Builder $domaines) => $domaines->where('domaine', $filtres['domaine'])
                ))
            ->when(($filtres['statut'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where('statut', $filtres['statut']))
            ->when($competenceIds !== [], fn (Builder $requete) => $requete
                ->whereHas(
                    'competences',
                    fn (Builder $competences) => $competences->whereIn('competences.id', $competenceIds)
                ))
            ->when(($filtres['places_disponibles'] ?? false) === true, function (Builder $requete): void {
                $requete->whereRaw(
                    '(select count(*) from membres_projet where membres_projet.projet_id = projets.id) < projets.nombre_max_membres'
                );
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($parPage);
    }
}
