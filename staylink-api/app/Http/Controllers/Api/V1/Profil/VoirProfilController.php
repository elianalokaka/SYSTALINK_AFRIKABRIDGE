<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfilPublicResource;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoirProfilController extends Controller
{
    public function __invoke(Request $request, string $id): JsonResponse
    {
        $utilisateur = Utilisateur::query()
            ->with('competences')
            ->findOrFail($id);

        $profil = (new ProfilPublicResource($utilisateur))->resolve($request);

        return response()->json($profil, 200);
    }
}
