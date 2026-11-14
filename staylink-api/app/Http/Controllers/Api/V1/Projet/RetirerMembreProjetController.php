<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Models\Projet;
use App\Services\Projet\RetirerMembreProjetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RetirerMembreProjetController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        string $userId,
        RetirerMembreProjetService $service
    ): JsonResponse|Response {
        $projet = Projet::query()->findOrFail($id);
        $resultat = $service->retirer($request->user(), $projet, (int) $userId);

        if ($resultat['code'] === 204) {
            return response()->noContent();
        }

        return response()->json([
            'message' => $resultat['message'],
        ], $resultat['code']);
    }
}
