<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Ressource\ListerRessourcesRequest;
use App\Http\Resources\RessourceResource;
use App\Services\Ressource\ListerRessourcesService;
use Illuminate\Http\JsonResponse;

class ListerRessourcesController extends Controller
{
    public function __invoke(
        ListerRessourcesRequest $request,
        ListerRessourcesService $service
    ): JsonResponse {
        $resultat = $service->lister($request->user(), $request->validated());

        if ($resultat['code'] === 403) {
            return response()->json([
                'message' => $resultat['message'],
            ], 403);
        }

        $page = $resultat['page'];

        return response()->json([
            'data' => collect($page->items())
                ->map(fn ($ressource) => (new RessourceResource($ressource))->resolve($request))
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
