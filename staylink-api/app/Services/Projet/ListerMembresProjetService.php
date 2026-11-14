<?php

namespace App\Services\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use Illuminate\Support\Collection;

class ListerMembresProjetService
{
    /**
     * @return array{code: int, membres?: Collection<int, MembreProjet>}
     */
    public function lister(int $projetId): array
    {
        $projet = Projet::query()->find($projetId);

        if ($projet === null) {
            return [
                'code' => 404,
            ];
        }

        $membres = MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->with('utilisateur')
            ->orderByRaw("CASE WHEN role = 'proprietaire' THEN 0 ELSE 1 END")
            ->orderBy('date_adhesion')
            ->orderBy('id')
            ->get();

        return [
            'code' => 200,
            'membres' => $membres,
        ];
    }
}
