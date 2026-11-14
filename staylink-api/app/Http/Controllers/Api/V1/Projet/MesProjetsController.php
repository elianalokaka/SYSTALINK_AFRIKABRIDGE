<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\MesProjetsRequest;
use App\Http\Resources\ProjetCarteResource;
use App\Services\Projet\MesProjetsService;
use Illuminate\Http\JsonResponse;

class MesProjetsController extends Controller
{
    public function __invoke(
        MesProjetsRequest $request,
        MesProjetsService $service
    ): JsonResponse {
        $page = $service->lister($request->user(), $request->validated());

        return response()->json([
            'data' => collect($page->items())
                ->map(fn ($projet) => (new ProjetCarteResource($projet))->resolve($request))
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
