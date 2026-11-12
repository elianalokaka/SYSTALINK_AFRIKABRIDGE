<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListerDemandesProjetService
{
    /**
     * @param  array{statut?: string, per_page?: int|null}  $filtres
     * @return array{code: int, message?: string, page?: LengthAwarePaginator}
     */
    public function lister(Utilisateur $acteur, int $projetId, array $filtres): array
    {
        $projet = Projet::query()->find($projetId);

        if ($projet === null) {
            return [
                'code' => 404,
            ];
        }

        if (! $this->estProprietaire($acteur, $projet)) {
            return [
                'code' => 403,
                'message' => 'Seul le propriétaire du projet peut lister les demandes.',
            ];
        }

        $parPage = (int) ($filtres['per_page'] ?? 15);
        $statut = $filtres['statut'] ?? 'en_attente';

        $page = Candidature::query()
            ->where('projet_id', $projet->id)
            ->where('statut', $statut)
            ->with([
                'candidat',
                'projet.domaines',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($parPage);

        return [
            'code' => 200,
            'page' => $page,
        ];
    }

    private function estProprietaire(Utilisateur $acteur, Projet $projet): bool
    {
        return MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $acteur->id)
            ->where('role', 'proprietaire')
            ->exists();
    }
}
