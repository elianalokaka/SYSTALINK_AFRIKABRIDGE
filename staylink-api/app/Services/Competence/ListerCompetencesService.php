<?php

namespace App\Services\Competence;

use App\Models\Competence;
use Illuminate\Database\Eloquent\Collection;

class ListerCompetencesService
{
    /**
     * @param  array{q?: string|null, categorie?: string|null}  $filtres
     * @return Collection<int, Competence>
     */
    public function lister(array $filtres): Collection
    {
        $recherche = isset($filtres['q']) ? trim((string) $filtres['q']) : '';
        $categorie = $filtres['categorie'] ?? null;

        return Competence::query()
            ->when($recherche !== '', function ($requete) use ($recherche) {
                $terme = addcslashes($recherche, '%_\\');
                $requete->where('nom', 'ilike', '%'.$terme.'%');
            })
            ->when(is_string($categorie) && $categorie !== '', function ($requete) use ($categorie) {
                $requete->where('categorie', $categorie);
            })
            ->orderBy('nom')
            ->get();
    }
}
