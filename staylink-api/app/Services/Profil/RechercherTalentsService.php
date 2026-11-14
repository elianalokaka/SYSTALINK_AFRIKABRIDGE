<?php

namespace App\Services\Profil;

use App\Models\Utilisateur;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class RechercherTalentsService
{
    /**
     * @param  array{
     *     q?: string|null,
     *     competence_ids?: array<int, int>|null,
     *     competence_match?: string|null,
     *     domaine?: string|null,
     *     pays?: string|null,
     *     region?: string|null,
     *     role_profil?: string|null,
     *     page?: int|null,
     *     per_page?: int|null
     * }  $filtres
     */
    public function rechercher(Utilisateur $acteur, array $filtres): LengthAwarePaginator
    {
        $parPage = (int) ($filtres['per_page'] ?? 15);
        $recherche = isset($filtres['q']) ? trim((string) $filtres['q']) : '';
        $competenceIds = array_values(array_unique(array_map(
            'intval',
            $filtres['competence_ids'] ?? []
        )));
        $correspondance = $filtres['competence_match'] ?? 'any';

        $requete = Utilisateur::query()
            ->whereKeyNot($acteur->id)
            ->when($recherche !== '', function (Builder $requete) use ($recherche): void {
                $terme = '%'.addcslashes($recherche, '%_\\').'%';
                $requete->where(function (Builder $requete) use ($terme): void {
                    $requete
                        ->where('nom', 'ilike', $terme)
                        ->orWhere('prenom', 'ilike', $terme)
                        ->orWhereRaw("trim(prenom || ' ' || nom) ilike ?", [$terme])
                        ->orWhere('biographie', 'ilike', $terme);
                });
            })
            ->when(($filtres['pays'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where('pays', $filtres['pays']))
            ->when(($filtres['domaine'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where(function (Builder $requete) use ($filtres): void {
                    $requete
                        ->where('domaine', $filtres['domaine'])
                        ->orWhereHas(
                            'domaines',
                            fn (Builder $domaines) => $domaines->where('domaine', $filtres['domaine'])
                        );
                }))
            ->when(($filtres['region'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where('region', $filtres['region']))
            ->when(($filtres['role_profil'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where('role_profil', $filtres['role_profil']))
            ->when($competenceIds !== [], function (Builder $requete) use ($competenceIds, $correspondance): void {
                if ($correspondance === 'all') {
                    foreach ($competenceIds as $competenceId) {
                        $requete->whereHas(
                            'competences',
                            fn (Builder $competences) => $competences->where('competences.id', $competenceId)
                        );
                    }

                    return;
                }

                $requete->whereHas(
                    'competences',
                    fn (Builder $competences) => $competences->whereIn('competences.id', $competenceIds)
                );
            })
            ->with(['competences', 'domaines'])
            ->withCount('abonnes as followers_count')
            ->withExists([
                'abonnes as is_following' => fn (Builder $abonnes) => $abonnes
                    ->where('abonne_id', $acteur->id),
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        return $requete->paginate($parPage);
    }
}
