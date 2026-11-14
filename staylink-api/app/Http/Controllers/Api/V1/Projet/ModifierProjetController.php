<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Projet\ProjetUpdateRequest;
use App\Http\Resources\ProjetResource;
use App\Models\Projet;
use App\Services\Projet\ModificationProjetService;
use Illuminate\Http\JsonResponse;

class ModifierProjetController extends Controller
{
    public function __invoke(
        ProjetUpdateRequest $request,
        string $id,
        ModificationProjetService $service
    ): JsonResponse {
        $projet = Projet::query()->findOrFail($id);

        $projet = $service->modifier(
            $request->user(),
            $projet,
            $request->validated()
        );

        $corps = (new ProjetResource($projet))->resolve($request);

        return response()->json($corps, 200);
    }
}
