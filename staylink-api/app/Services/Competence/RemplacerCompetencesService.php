<?php

namespace App\Services\Competence;

use App\Models\Competence;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Collection;

class RemplacerCompetencesService
{
    public function __construct(
        private readonly ResoudreCompetenceService $resoudre,
    ) {}

    /**
     * @param  list<array{competence_id?: int, nom?: string, niveau?: string|null}>  $lignes
     * @return Collection<int, Competence>
     */
    public function remplacer(Utilisateur $utilisateur, array $lignes): Collection
    {
        $sync = [];

        foreach ($lignes as $ligne) {
            $competence = isset($ligne['competence_id'])
                ? Competence::query()->findOrFail($ligne['competence_id'])
                : $this->resoudre->resoudre((string) $ligne['nom']);

            $sync[$competence->id] = [
                'niveau' => $ligne['niveau'] ?? null,
            ];
        }

        $utilisateur->competences()->sync($sync);
        $utilisateur->load('competences');

        return $utilisateur->competences;
    }
}
