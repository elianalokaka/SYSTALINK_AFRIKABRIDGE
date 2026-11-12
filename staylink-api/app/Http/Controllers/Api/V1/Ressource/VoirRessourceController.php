<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Http\Resources\RessourceResource;
use App\Models\Ressource;
use App\Services\Ressource\ConsultationRessourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoirRessourceController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        ConsultationRessourceService $service
    ): JsonResponse {
        $ressource = Ressource::query()->findOrFail($id);

        $resultat = $service->voir($request->user(), $ressource);

        if ($resultat['code'] !== 200) {
            return response()->json([
                'message' => $resultat['message'],
            ], $resultat['code']);
        }

        return response()->json(
            (new RessourceResource($resultat['ressource']))->resolve($request),
            200
        );
    }
}
