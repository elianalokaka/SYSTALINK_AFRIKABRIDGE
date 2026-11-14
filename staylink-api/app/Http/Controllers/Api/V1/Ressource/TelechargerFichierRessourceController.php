<?php

namespace App\Http\Controllers\Api\V1\Ressource;

use App\Http\Controllers\Controller;
use App\Models\Ressource;
use App\Services\Ressource\TelechargerFichierRessourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TelechargerFichierRessourceController extends Controller
{
    public function __invoke(
        Request $request,
        string $id,
        TelechargerFichierRessourceService $service
    ): StreamedResponse|JsonResponse {
        $ressource = Ressource::query()->findOrFail($id);
        $resultat = $service->ouvrir($request->user(), $ressource);

        if ($resultat['code'] !== 200) {
            return response()->json([
                'message' => $resultat['message'],
            ], $resultat['code']);
        }

        return Storage::disk($resultat['disque'])->response(
            $resultat['chemin'],
            $resultat['nom']
        );
    }
}
