<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfilPublicResource;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoirProfilController extends Controller
{
    public function __invoke(Request $request, string $id): JsonResponse
    {
        $acteurId = $request->user()?->id;

        $utilisateur = Utilisateur::query()
            ->with(['competences', 'domaines', 'liens'])
            ->withCount([
                'abonnes as followers_count',
                'abonnements as following_count',
                'projetsRejoints as projets_realises_count' => fn (Builder $projets) => $projets
                    ->where('projets.statut', 'termine'),
            ])
            ->withExists([
                'abonnes as is_following' => fn (Builder $abonnes) => $abonnes
                    ->where('abonne_id', $acteurId),
            ])
            ->findOrFail($id);

        $profil = (new ProfilPublicResource($utilisateur))->resolve($request);

        return response()->json($profil, 200);
    }
}