<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Models\Commentaire;
use App\Services\Ressource\CommentaireRessourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SupprimerCommentaireController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        CommentaireRessourceService $service
    ): JsonResponse|Response {
        $commentaire = Commentaire::query()->findOrFail($id);

        $resultat = $service->supprimer($request->user(), $commentaire);

        if ($resultat['code'] === 204) {
            return response()->noContent();
        }

        return response()->json([
            'message' => $resultat['message'],
        ], $resultat['code']);
    }
}
