<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Models\Ressource;
use App\Services\Ressource\SuppressionRessourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SupprimerRessourceController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        SuppressionRessourceService $service
    ): JsonResponse|Response {
        $ressource = Ressource::query()->findOrFail($id);

        $resultat = $service->supprimer($request->user(), $ressource);

        if ($resultat['code'] === 204) {
            return response()->noContent();
        }

        return response()->json([
            'message' => $resultat['message'],
        ], $resultat['code']);
    }
}
