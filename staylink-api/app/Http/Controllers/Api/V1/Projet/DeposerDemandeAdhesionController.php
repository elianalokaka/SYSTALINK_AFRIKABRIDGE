<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\DemandeAdhesionRequest;
use App\Http\Resources\DemandeAdhesionResource;
use App\Models\Projet;
use App\Services\Projet\DemandeAdhesionService;
use Illuminate\Http\JsonResponse;

class DeposerDemandeAdhesionController extends Controller
{
    public function __invoke(
        DemandeAdhesionRequest $request,
        string $id,
        DemandeAdhesionService $service
    ): JsonResponse {
        $projet = Projet::query()->findOrFail($id);

        $resultat = $service->deposer(
            $request->user(),
            $projet,
            $request->validated()['message'] ?? null
        );

        if ($resultat['code'] === 409) {
            return response()->json([
                'message' => $resultat['message'],
            ], 409);
        }

        $corps = (new DemandeAdhesionResource($resultat['candidature']))->resolve($request);

        return response()->json($corps, 201);
    }
}