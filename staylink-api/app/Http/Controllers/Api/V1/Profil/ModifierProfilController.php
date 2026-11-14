<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profil\ModifierProfilRequest;
use App\Http\Resources\ProfilPriveResource;
use App\Services\Profil\ModifierProfilService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ModifierProfilController extends Controller
{
    public function __invoke(
        ModifierProfilRequest $request,
        ModifierProfilService $service
    ): JsonResponse {
        $utilisateur = $service->modifier(
            $request->user(),
            $request->validated()
        );

        $utilisateur->loadCount([
            'abonnes as followers_count',
            'abonnements as following_count',
            'projetsRejoints as projets_realises_count' => fn (Builder $projets) => $projets
                ->where('projets.statut', 'termine'),
        ]);

        $profil = (new ProfilPriveResource($utilisateur))->resolve($request);

        return response()->json($profil, 200);
    }
}