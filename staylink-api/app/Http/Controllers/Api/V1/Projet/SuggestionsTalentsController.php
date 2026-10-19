<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\SuggestionsTalentsRequest;
use App\Http\Resources\TalentResource;
use App\Services\Projet\SuggestionsTalentsService;
use Illuminate\Http\JsonResponse;

class SuggestionsTalentsController extends Controller
{
    public function __invoke(
        SuggestionsTalentsRequest $request,
        SuggestionsTalentsService $service
    ): JsonResponse {
        $talents = $service->suggestionner(
            $request->user(),
            (int) ($request->validated('limit') ?? 10)
        );

        return response()->json([
            'data' => $talents
                ->map(fn ($talent) => (new TalentResource($talent))->resolve($request))
                ->values()
                ->all(),
        ]);
    }
}
