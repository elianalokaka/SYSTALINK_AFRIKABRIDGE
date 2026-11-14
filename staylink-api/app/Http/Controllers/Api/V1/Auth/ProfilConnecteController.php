<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfilPriveResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfilConnecteController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $utilisateur = $request->user();

        $utilisateur->load(['competences', 'domaines', 'liens']);
        $utilisateur->loadCount([
            'abonnes as followers_count',
            'abonnements as following_count',
            'projetsRejoints as projets_realises_count' => fn (Builder $projets) => $projets
                ->where('projets.statut', 'termine'),
        ]);

        $profil = (new ProfilPriveResource($utilisateur))
            ->resolve($request);

        return response()->json($profil, 200);
    }
}