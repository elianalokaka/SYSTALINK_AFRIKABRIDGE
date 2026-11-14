<?php

namespace App\Http\Controllers\Api\V1\Projet;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjetResource;
use App\Services\Projet\VoirProjetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoirProjetController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        VoirProjetService $service
    ): JsonResponse {
        $projet = $service->voir($request->user(), (int) $id);

        if ($projet === null) {
            abort(404);
        }

        $corps = (new ProjetResource($projet))->resolve($request);

        return response()->json($corps, 200);
    }
}
