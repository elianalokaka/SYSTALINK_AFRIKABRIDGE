<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\LireMessagesRequest;
use App\Http\Resources\MessageResource;
use App\Models\Projet;
use App\Services\Projet\MessagerieService;
use Illuminate\Http\JsonResponse;

class LireMessagesController extends Controller
{
    public function __invoke(
        LireMessagesRequest $request,
        string $id,
        MessagerieService $service
    ): JsonResponse {
        $projet = Projet::query()->findOrFail($id);
        $donnees = $request->validated();

        $resultat = $service->lire(
            $request->user(),
            $projet,
            isset($donnees['apres_id']) ? (int) $donnees['apres_id'] : null,
            isset($donnees['avant_id']) ? (int) $donnees['avant_id'] : null,
            $donnees['depuis'] ?? null,
            (int) ($donnees['limit'] ?? 50)
        );

        if ($resultat['code'] === 403) {
            return response()->json(['message' => $resultat['message']], 403);
        }

        return response()->json([
            'data' => MessageResource::collection($resultat['fil']['data'])->resolve($request),
            'supprimes' => $resultat['fil']['supprimes'],
            'meta' => [
                'server_time' => $resultat['fil']['server_time'],
            ],
        ]);
    }
}