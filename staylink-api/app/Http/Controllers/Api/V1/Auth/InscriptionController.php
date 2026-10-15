<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\InscriptionRequest;
use App\Http\Resources\ProfilPriveResource;
use App\Services\Auth\InscriptionService;
use Illuminate\Http\JsonResponse;

class InscriptionController extends Controller
{
    public function __invoke(
        InscriptionRequest $request,
        InscriptionService $service
    ): JsonResponse {
        // 1. Récupérer uniquement les données validées.
        $donnees = $request->validated();

        // 2. Créer le compte et ouvrir la session.
        $utilisateur = $service->inscrire(
            $donnees,
            $request
        );

        // 3. Préparer le profil privé.
        $profil = (new ProfilPriveResource(
            $utilisateur->load('competences')
        ))->resolve($request);

        // 4. Retourner le profil avec le statut HTTP 201.
        return response()->json($profil, 201);
    }
}