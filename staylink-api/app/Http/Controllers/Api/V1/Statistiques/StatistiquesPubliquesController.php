<?php

namespace App\Http\Controllers\Api\V1\Statistiques;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatistiquesPubliquesController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $statistiques = Cache::remember('stats:public', now()->addMinutes(5), fn (): array => [
            'membres_count' => DB::table('utilisateurs')->count(),
            'pays_count' => DB::table('utilisateurs')
                ->distinct()
                ->count('pays'),
            'projets_count' => DB::table('projets')->count(),
            'equipes_formees_count' => DB::query()
                ->fromSub(
                    DB::table('membres_projet')
                        ->select('projet_id')
                        ->groupBy('projet_id')
                        ->havingRaw('COUNT(*) >= 2'),
                    'equipes_formees'
                )
                ->count(),
        ]);

        return response()->json($statistiques);
    }
}
