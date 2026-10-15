<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ConnexionRequest;
use App\Http\Resources\ProfilPriveResource;
use App\Services\Auth\ConnexionService;
use Illuminate\Http\JsonResponse;

class ConnexionController extends Controller
{
    public function __invoke(
        ConnexionRequest $request,
        ConnexionService $service
    ): JsonResponse {
        // Les données ont déjà été validées.
        $donnees = $request->validated();

        // Vérifier les identifiants et ouvrir la session.
        $utilisateur = $service->connecter(
            $donnees,
            $request
        );

        // Retourner le profil privé au format contractuel.
        $profil = (new ProfilPriveResource(
            $utilisateur->load('competences')
        ))->resolve($request);

        return response()->json($profil, 200);
    }
}