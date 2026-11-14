<?php

namespace App\Services\Competence;

use App\Models\Competence;
use App\Support\TexteNormalise;

class ResoudreCompetenceService
{
    public function resoudre(string $nomSaisi): Competence
    {
        $nom = trim(preg_replace('/\s+/u', ' ', $nomSaisi) ?? $nomSaisi);
        $clef = TexteNormalise::clef($nom);

        foreach (Competence::query()->orderBy('nom')->get() as $competence) {
            if (TexteNormalise::clef($competence->nom) === $clef) {
                return $competence;
            }
        }

        return Competence::query()->create([
            'nom' => $nom,
            'categorie' => 'autre',
        ]);
    }
}
