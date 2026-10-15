<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfilPriveResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfilConnecteController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // Récupérer l'utilisateur authentifié.
        $utilisateur = $request->user();

        // Charger les compétences associées.
        $utilisateur->load('competences');

        // Transformer les données selon le contrat OpenAPI.
        $profil = (new ProfilPriveResource($utilisateur))
            ->resolve($request);

        return response()->json($profil, 200);
    }
}