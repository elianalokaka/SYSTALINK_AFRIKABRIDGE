<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\MesDemandesAdhesionRequest;
use App\Http\Resources\DemandeAdhesionResource;
use App\Services\Projet\MesDemandesAdhesionService;
use Illuminate\Http\JsonResponse;

class MesDemandesAdhesionController extends Controller
{
    public function __invoke(
        MesDemandesAdhesionRequest $request,
        MesDemandesAdhesionService $service
    ): JsonResponse {
        $page = $service->lister($request->user(), $request->validated());

        return response()->json([
            'data' => collect($page->items())
                ->map(fn ($demande) => (new DemandeAdhesionResource($demande))->resolve($request))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'last_page' => $page->lastPage(),
            ],
        ]);
    }
}
