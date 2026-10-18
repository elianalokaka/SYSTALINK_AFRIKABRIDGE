<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Ressource\RessourceCreationRequest;
use App\Http\Resources\RessourceResource;
use App\Services\Ressource\PublicationRessourceService;
use Illuminate\Http\JsonResponse;

class PublierRessourceController extends Controller
{
    public function __invoke(
        RessourceCreationRequest $request,
        PublicationRessourceService $service
    ): JsonResponse {
        $donnees = $request->validated();
        unset($donnees['fichier']);

        $resultat = $service->publier(
            $request->user(),
            $donnees,
            $request->file('fichier')
        );

        if ($resultat['code'] === 403) {
            return response()->json(['message' => $resultat['message']], 403);
        }

        $corps = (new RessourceResource($resultat['ressource']))->resolve($request);

        return response()->json($corps, 201);
    }
}