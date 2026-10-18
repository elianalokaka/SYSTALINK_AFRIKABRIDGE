<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\DemandeDecisionRequest;
use App\Http\Resources\DemandeAdhesionResource;
use App\Models\Candidature;
use App\Services\Projet\DecisionDemandeService;
use Illuminate\Http\JsonResponse;

class DeciderDemandeAdhesionController extends Controller
{
    public function __invoke(
        DemandeDecisionRequest $request,
        string $id,
        DecisionDemandeService $service
    ): JsonResponse {
        $candidature = Candidature::query()->findOrFail($id);

        $resultat = $service->decider(
            $request->user(),
            $candidature,
            $request->validated()['decision']
        );

        if ($resultat['code'] !== 200) {
            return response()->json([
                'message' => $resultat['message'],
            ], $resultat['code']);
        }

        $corps = (new DemandeAdhesionResource($resultat['candidature']))->resolve($request);

        return response()->json($corps, 200);
    }
}