<?php

namespace App\Http\Controllers\Api\V1\Suivi;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Suivi\ListerReseauRequest;
use App\Http\Resources\UtilisateurResumeResource;
use App\Services\Suivi\ListerReseauService;
use Illuminate\Http\JsonResponse;

class ListerAbonnementsController extends Controller
{
    public function __invoke(
        ListerReseauRequest $request,
        string $id,
        ListerReseauService $service
    ): JsonResponse {
        $page = $service->listerAbonnements((int) $id, $request->validated());

        return response()->json([
            'data' => collect($page->items())
                ->map(fn ($utilisateur) => (new UtilisateurResumeResource($utilisateur))->resolve($request))
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