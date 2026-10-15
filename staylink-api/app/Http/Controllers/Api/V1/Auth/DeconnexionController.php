<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class DeconnexionController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // 1. Déconnecter l'utilisateur du guard web.
        Auth::guard('web')->logout();

        // 2. Invalider la session et son identifiant.
        $request->session()->invalidate();

        // 3. Régénérer le jeton CSRF.
        $request->session()->regenerateToken();

        // 4. Retourner 204 sans contenu.
        return response()->noContent();
    }
}