<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profil\RemplacerCompetencesRequest;
use Illuminate\Http\JsonResponse;

class RemplacerCompetencesController extends Controller
{
    public function __invoke(RemplacerCompetencesRequest $request): JsonResponse
    {
        $utilisateur = $request->user();
        $competences = [];

        foreach ($request->validated('competences') as $competence) {
            $competences[$competence['competence_id']] = [
                'niveau' => $competence['niveau'] ?? null,
            ];
        }

        $utilisateur->competences()->sync($competences);
        $utilisateur->load('competences');

        return response()->json([
            'competences' => $utilisateur->competences->map(
                fn ($competence) => [
                    'id' => $competence->id,
                    'nom' => $competence->nom,
                    'categorie' => $competence->categorie,
                    'niveau' => $competence->pivot->niveau,
                ]
            )->values()->all(),
        ], 200);
    }
}
