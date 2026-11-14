<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Resources\MembreResource;
use App\Services\Projet\ListerMembresProjetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListerMembresProjetController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        ListerMembresProjetService $service
    ): JsonResponse {
        $resultat = $service->lister((int) $id);

        if ($resultat['code'] === 404) {
            abort(404);
        }

        return response()->json([
            'data' => $resultat['membres']
                ->map(fn ($membre) => (new MembreResource($membre))->resolve($request))
                ->values()
                ->all(),
        ]);
    }
}
