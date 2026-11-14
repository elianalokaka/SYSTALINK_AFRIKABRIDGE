<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Ressource\ListerCommentairesRequest;
use App\Http\Resources\CommentaireResource;
use App\Models\Ressource;
use App\Services\Ressource\CommentaireRessourceService;
use Illuminate\Http\JsonResponse;

class ListerCommentairesController extends Controller
{
    public function __invoke(
        ListerCommentairesRequest $request,
        string $id,
        CommentaireRessourceService $service
    ): JsonResponse {
        $ressource = Ressource::query()->findOrFail($id);

        $resultat = $service->lister(
            $request->user(),
            $ressource,
            $request->validated()
        );

        if ($resultat['code'] !== 200) {
            return response()->json([
                'message' => $resultat['message'],
            ], $resultat['code']);
        }

        $page = $resultat['page'];

        return response()->json([
            'data' => collect($page->items())
                ->map(fn ($commentaire) => (new CommentaireResource($commentaire))->resolve($request))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'last_page' => $page->lastPage(),
            ],
        ]);
    }
}
