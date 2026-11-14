<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\ListerDemandesProjetRequest;
use App\Http\Resources\DemandeAdhesionResource;
use App\Services\Projet\ListerDemandesProjetService;
use Illuminate\Http\JsonResponse;

class ListerDemandesProjetController extends Controller
{
    public function __invoke(
        ListerDemandesProjetRequest $request,
        string $id,
        ListerDemandesProjetService $service
    ): JsonResponse {
        $resultat = $service->lister(
            $request->user(),
            (int) $id,
            $request->validated()
        );

        if ($resultat['code'] === 404) {
            abort(404);
        }

        if ($resultat['code'] === 403) {
            return response()->json([
                'message' => $resultat['message'],
            ], 403);
        }

        $page = $resultat['page'];

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
