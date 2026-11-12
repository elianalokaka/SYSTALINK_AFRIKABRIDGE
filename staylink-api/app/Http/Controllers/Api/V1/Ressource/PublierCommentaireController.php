<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Ressource\CommentaireCreateRequest;
use App\Http\Resources\CommentaireResource;
use App\Models\Ressource;
use App\Services\Ressource\CommentaireRessourceService;
use Illuminate\Http\JsonResponse;

class PublierCommentaireController extends Controller
{
    public function __invoke(
        CommentaireCreateRequest $request,
        string $id,
        CommentaireRessourceService $service
    ): JsonResponse {
        $ressource = Ressource::query()->findOrFail($id);

        $resultat = $service->publier(
            $request->user(),
            $ressource,
            $request->validated()['contenu']
        );

        if ($resultat['code'] !== 201) {
            return response()->json([
                'message' => $resultat['message'],
            ], $resultat['code']);
        }

        return response()->json(
            (new CommentaireResource($resultat['commentaire']))->resolve($request),
            201
        );
    }
}
