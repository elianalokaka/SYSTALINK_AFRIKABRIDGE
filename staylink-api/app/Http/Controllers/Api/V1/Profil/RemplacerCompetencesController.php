<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profil\RemplacerCompetencesRequest;
use App\Services\Competence\RemplacerCompetencesService;
use Illuminate\Http\JsonResponse;

class RemplacerCompetencesController extends Controller
{
    public function __invoke(
        RemplacerCompetencesRequest $request,
        RemplacerCompetencesService $service
    ): JsonResponse {
        $competences = $service->remplacer(
            $request->user(),
            $request->validated('competences')
        );

        return response()->json([
            'competences' => $competences
                ->map(fn ($competence) => [
                    'id' => $competence->id,
                    'nom' => $competence->nom,
                    'categorie' => $competence->categorie,
                    'niveau' => $competence->pivot->niveau,
                ])
                ->values()
                ->all(),
        ]);
    }
}
