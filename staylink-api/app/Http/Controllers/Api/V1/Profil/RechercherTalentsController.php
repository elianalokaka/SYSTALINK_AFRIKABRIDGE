<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profil\RechercherTalentsRequest;
use App\Http\Resources\TalentResource;
use App\Services\Profil\RechercherTalentsService;
use Illuminate\Http\JsonResponse;

class RechercherTalentsController extends Controller
{
    public function __invoke(
        RechercherTalentsRequest $request,
        RechercherTalentsService $service
    ): JsonResponse {
        $page = $service->rechercher($request->user(), $request->validated());

        return response()->json([
            'data' => collect($page->items())
                ->map(fn ($talent) => (new TalentResource($talent))->resolve($request))
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
