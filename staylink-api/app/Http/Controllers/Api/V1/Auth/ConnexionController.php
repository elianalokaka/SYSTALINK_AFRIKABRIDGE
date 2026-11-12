<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ConnexionRequest;
use App\Http\Resources\ProfilPriveResource;
use App\Services\Auth\ConnexionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ConnexionController extends Controller
{
    public function __invoke(
        ConnexionRequest $request,
        ConnexionService $service
    ): JsonResponse {
        $donnees = $request->validated();

        $utilisateur = $service->connecter(
            $donnees,
            $request
        );

        $utilisateur
            ->load(['competences', 'domaines', 'liens'])
            ->loadCount([
                'abonnes as followers_count',
                'abonnements as following_count',
                'projetsRejoints as projets_realises_count' => fn (Builder $projets) => $projets
                    ->where('projets.statut', 'termine'),
            ]);

        $profil = (new ProfilPriveResource($utilisateur))->resolve($request);

        return response()->json($profil, 200);
    }
}