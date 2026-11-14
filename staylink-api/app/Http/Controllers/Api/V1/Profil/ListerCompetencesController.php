<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profil\ListerCompetencesRequest;
use App\Http\Resources\CompetenceResource;
use App\Services\Competence\ListerCompetencesService;
use App\Services\Domaine\ListerDomainesService;
use Illuminate\Http\JsonResponse;

class ListerCompetencesController extends Controller
{
    public function __invoke(
        ListerCompetencesRequest $request,
        ListerCompetencesService $competences,
        ListerDomainesService $domaines
    ): JsonResponse {
        $liste = $competences->lister($request->validated());

        return response()->json([
            'data' => $liste
                ->map(fn ($competence) => (new CompetenceResource($competence))->resolve($request))
                ->values()
                ->all(),
            'domaines' => $domaines->lister(),
        ]);
    }
}
