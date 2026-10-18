<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profil\ModifierProfilRequest;
use App\Http\Resources\ProfilPriveResource;
use Illuminate\Http\JsonResponse;

class ModifierProfilController extends Controller
{
    public function __invoke(ModifierProfilRequest $request): JsonResponse
    {
        $utilisateur = $request->user();
        $donnees = $request->validated();
        $modifications = [];

        if (array_key_exists('nom', $donnees)) {
            $modifications['nom'] = $donnees['nom'];
        }

        if (array_key_exists('bio', $donnees)) {
            $modifications['biographie'] = $donnees['bio'];
        }

        if (array_key_exists('pays', $donnees)) {
            $modifications['pays'] = $donnees['pays'];
        }

        $utilisateur->update($modifications);
        $utilisateur->load('competences');

        $profil = (new ProfilPriveResource($utilisateur))->resolve($request);

        return response()->json($profil, 200);
    }
}
