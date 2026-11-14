<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Models\Candidature;
use App\Services\Projet\AnnulationDemandeAdhesionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AnnulerDemandeAdhesionController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        AnnulationDemandeAdhesionService $service
    ): JsonResponse|Response {
        $candidature = Candidature::query()->findOrFail($id);

        $resultat = $service->annuler($request->user(), $candidature);

        if ($resultat['code'] === 204) {
            return response()->noContent();
        }

        return response()->json([
            'message' => $resultat['message'],
        ], $resultat['code']);
    }
}
