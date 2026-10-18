<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\MessageCreationRequest;
use App\Http\Resources\MessageResource;
use App\Models\Projet;
use App\Services\Projet\MessagerieService;
use Illuminate\Http\JsonResponse;

class EnvoyerMessageController extends Controller
{
    public function __invoke(
        MessageCreationRequest $request,
        string $id,
        MessagerieService $service
    ): JsonResponse {
        $projet = Projet::query()->findOrFail($id);

        $resultat = $service->envoyer(
            $request->user(),
            $projet,
            $request->validated()['contenu']
        );

        if ($resultat['code'] === 403) {
            return response()->json(['message' => $resultat['message']], 403);
        }

        $corps = (new MessageResource($resultat['message']))->resolve($request);

        return response()->json($corps, 201);
    }
}