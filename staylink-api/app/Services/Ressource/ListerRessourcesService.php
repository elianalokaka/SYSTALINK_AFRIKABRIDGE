<?php

namespace App\Services\Ressource;

use App\Models\MembreProjet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ListerRessourcesService
{
    /**
     * @param  array{
     *     q?: string|null,
     *     type?: string|null,
     *     competence_ids?: array<int, int>|null,
     *     projet_id?: int|null,
     *     auteur_id?: int|null,
     *     per_page?: int|null
     * }  $filtres
     * @return array{code: int, message?: string, page?: LengthAwarePaginator}
     */
    public function lister(Utilisateur $acteur, array $filtres): array
    {
        $parPage = (int) ($filtres['per_page'] ?? 15);
        $recherche = isset($filtres['q']) ? trim((string) $filtres['q']) : '';
        $competenceIds = array_values(array_unique(array_map(
            'intval',
            $filtres['competence_ids'] ?? []
        )));
        $projetId = isset($filtres['projet_id']) ? (int) $filtres['projet_id'] : 0;

        $projetsMembre = MembreProjet::query()
            ->where('utilisateur_id', $acteur->id)
            ->pluck('projet_id');

        if ($projetId > 0 && ! $projetsMembre->contains($projetId)) {
            return [
                'code' => 403,
                'message' => 'Seuls les membres du projet peuvent voir ses ressources.',
            ];
        }

        $page = Ressource::query()
            ->with(['utilisateur', 'competences'])
            ->withCount('commentaires as commentaires_count')
            ->when($projetId > 0, fn (Builder $requete) => $requete
                ->where('projet_id', $projetId))
            ->when($projetId === 0, function (Builder $requete) use ($projetsMembre): void {
                $requete->where(function (Builder $requete) use ($projetsMembre): void {
                    $requete->where('visibilite', 'publique');

                    if ($projetsMembre->isNotEmpty()) {
                        $requete->orWhereIn('projet_id', $projetsMembre);
                    }
                });
            })
            ->when($recherche !== '', function (Builder $requete) use ($recherche): void {
                $terme = '%'.addcslashes($recherche, '%_\\').'%';
                $requete->where(function (Builder $requete) use ($terme): void {
                    $requete
                        ->where('titre', 'ilike', $terme)
                        ->orWhere('description', 'ilike', $terme);
                });
            })
            ->when(($filtres['type'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where('type', $filtres['type']))
            ->when(($filtres['auteur_id'] ?? 0) > 0, fn (Builder $requete) => $requete
                ->where('utilisateur_id', (int) $filtres['auteur_id']))
            ->when($competenceIds !== [], fn (Builder $requete) => $requete
                ->whereHas(
                    'competences',
                    fn (Builder $competences) => $competences->whereIn('competences.id', $competenceIds)
                ))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($parPage);

        return [
            'code' => 200,
            'page' => $page,
        ];
    }
}
