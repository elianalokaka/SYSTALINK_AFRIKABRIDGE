<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\ProjetCreationRequest;
use App\Http\Resources\ProjetResource;
use App\Services\Projet\CreationProjetService;
use Illuminate\Http\JsonResponse;

class CreerProjetController extends Controller
{
    public function __invoke(
        ProjetCreationRequest $request,
        CreationProjetService $service
    ): JsonResponse {
        $projet = $service->creer(
            $request->user(),
            $request->validated()
        );

        $corps = (new ProjetResource($projet))->resolve($request);

        return response()->json($corps, 201);
    }
}