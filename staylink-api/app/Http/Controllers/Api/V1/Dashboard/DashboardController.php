<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Utilisateur $utilisateur */
        $utilisateur = $request->user();

        $mesProjets = Projet::query()
            ->whereHas('membres', fn (Builder $query) => $query
                ->where('utilisateurs.id', $utilisateur->id))
            ->with('domaines')
            ->withCount('participations')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function (Projet $projet): array {
                $domaines = $projet->domaines->pluck('domaine')->values()->all();

                if ($domaines === [] && filled($projet->domaine)) {
                    $domaines = [$projet->domaine];
                }

                return [
                    'id' => $projet->id,
                    'nom' => $projet->nom,
                    'domaines' => $domaines,
                    'statut' => $projet->statut,
                    'progression' => (int) $projet->progression,
                    'nombre_membres_souhaite' => $projet->nombre_max_membres,
                    'nombre_membres_actuel' => $projet->participations_count,
                ];
            })
            ->values();

        return response()->json([
            'mes_projets' => $mesProjets,
            'projets_count' => MembreProjet::query()
                ->where('utilisateur_id', $utilisateur->id)
                ->count(),
            'demandes_recues_en_attente' => Candidature::query()
                ->where('statut', 'en_attente')
                ->whereHas('projet', fn (Builder $query) => $query
                    ->where('createur_id', $utilisateur->id))
                ->count(),
            'mes_demandes_en_attente' => Candidature::query()
                ->where('candidat_id', $utilisateur->id)
                ->where('statut', 'en_attente')
                ->count(),
            'followers_count' => Abonnement::query()
                ->where('suivi_id', $utilisateur->id)
                ->count(),
            'following_count' => Abonnement::query()
                ->where('abonne_id', $utilisateur->id)
                ->count(),
        ]);
    }
}
