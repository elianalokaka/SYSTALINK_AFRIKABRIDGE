<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjetResource;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioUtilisateurController extends Controller
{
    public function __invoke(Request $request, string $id): JsonResponse
    {
        Utilisateur::query()->findOrFail($id);

        $projets = Projet::query()
            ->where('statut', 'termine')
            ->whereHas('membres', fn ($query) => $query->whereKey($id))
            ->with(['membres', 'domaines', 'competences', 'createur'])
            ->withCount('participations')
            ->orderByRaw('date_fin DESC NULLS LAST')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $projets
                ->map(fn (Projet $projet) => (new ProjetResource($projet))->resolve($request))
                ->values()
                ->all(),
        ]);
    }
}
