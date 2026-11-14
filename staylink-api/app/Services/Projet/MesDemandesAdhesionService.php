<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\Utilisateur;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class MesDemandesAdhesionService
{
    /**
     * @param  array{statut?: string|null, per_page?: int|null}  $filtres
     */
    public function lister(Utilisateur $acteur, array $filtres): LengthAwarePaginator
    {
        $parPage = (int) ($filtres['per_page'] ?? 15);

        return Candidature::query()
            ->where('candidat_id', $acteur->id)
            ->when(($filtres['statut'] ?? '') !== '', fn (Builder $requete) => $requete
                ->where('statut', $filtres['statut']))
            ->with([
                'candidat',
                'projet.domaines',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($parPage);
    }
}
