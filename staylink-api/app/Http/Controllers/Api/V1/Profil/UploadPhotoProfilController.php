<?php

namespace App\Http\Controllers\Api\V1\Profil;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profil\UploadPhotoProfilRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UploadPhotoProfilController extends Controller
{
    public function __invoke(UploadPhotoProfilRequest $request): JsonResponse
    {
        $utilisateur = $request->user();

        // Supprimer l'ancienne photo si elle existe
        if ($utilisateur->photo_profil) {
            Storage::disk('public')->delete($utilisateur->photo_profil);
        }

        $chemin = $request->file('photo')->store('photos-profil', 'public');

        $utilisateur->update(['photo_profil' => $chemin]);

        return response()->json([
            'photo_url' => asset('storage/' . $chemin),
        ], 200);
    }
}
