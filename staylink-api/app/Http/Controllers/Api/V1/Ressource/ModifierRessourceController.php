<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Ressource\RessourceUpdateRequest;
use App\Http\Resources\RessourceResource;
use App\Models\Ressource;
use App\Services\Ressource\ModificationRessourceService;
use Illuminate\Http\JsonResponse;

class ModifierRessourceController extends Controller
{
    public function __invoke(
        RessourceUpdateRequest $request,
        string $id,
        ModificationRessourceService $service
    ): JsonResponse {
        $ressource = Ressource::query()->findOrFail($id);

        $resultat = $service->modifier(
            $request->user(),
            $ressource,
            $request->validated()
        );

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
