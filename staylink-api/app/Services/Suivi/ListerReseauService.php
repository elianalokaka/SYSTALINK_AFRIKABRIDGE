<?php

namespace App\Services\Suivi;

use App\Models\Utilisateur;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListerReseauService
{
    /**
     * Abonnés d'un membre (ceux qui le suivent).
     *
     * @param  array{page?: int, per_page?: int}  $filtres
     */
    public function listerAbonnes(int $membreId, array $filtres): LengthAwarePaginator
    {
        $this->assurerQueLeMembreExiste($membreId);

        $parPage = (int) ($filtres['per_page'] ?? 15);

        return Utilisateur::query()
            ->join('abonnements', 'abonnements.abonne_id', '=', 'utilisateurs.id')
            ->where('abonnements.suivi_id', $membreId)
            ->select('utilisateurs.*')
            ->orderByDesc('abonnements.created_at')
            ->orderByDesc('utilisateurs.id')
            ->paginate($parPage);
    }

    /**
     * Membres suivis par ce compte.
     *
     * @param  array{page?: int, per_page?: int}  $filtres
     */
    public function listerAbonnements(int $membreId, array $filtres): LengthAwarePaginator
    {
        $this->assurerQueLeMembreExiste($membreId);

        $parPage = (int) ($filtres['per_page'] ?? 15);

        return Utilisateur::query()
            ->join('abonnements', 'abonnements.suivi_id', '=', 'utilisateurs.id')
            ->where('abonnements.abonne_id', $membreId)
            ->select('utilisateurs.*')
            ->orderByDesc('abonnements.created_at')
            ->orderByDesc('utilisateurs.id')
            ->paginate($parPage);
    }

    private function assurerQueLeMembreExiste(int $membreId): void
    {
        Utilisateur::query()->findOrFail($membreId);
    }
}