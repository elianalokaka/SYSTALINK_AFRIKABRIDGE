<?php

namespace App\Http\Controllers\Api\V1\Suivi;

use App\Http\Controllers\Controller;
use App\Http\Resources\FollowStateResource;
use App\Models\Utilisateur;
use App\Services\Suivi\SuiviService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuivreMembreController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        SuiviService $service
    ): JsonResponse {
        $suivi = Utilisateur::query()->findOrFail($id);

        $resultat = $service->suivre($request->user(), $suivi);

        $etat = (new FollowStateResource($resultat['etat']))->resolve($request);

        return response()->json($etat, $resultat['code']);
    }
}