<?php

namespace App\Services\Auth;

use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ConnexionService
{
    /**
     * Vérifier les identifiants et ouvrir une session.
     */
    public function connecter(
        array $donnees,
        Request $request
    ): Utilisateur {
        $identifiants = [
            'email' => $donnees['email'],

            // Laravel attend la clé "password",
            // même si notre colonne s'appelle "mot_de_passe".
            'password' => $donnees['mot_de_passe'],
        ];

        $seSouvenir = $donnees['se_souvenir'] ?? false;

        // Vérification des identifiants avec le guard web.
        if (! Auth::guard('web')->attempt(
            $identifiants,
            $seSouvenir
        )) {
            throw ValidationException::withMessages([
                'email' => [
                    'Les identifiants fournis sont incorrects.',
                ],
            ]);
        }

        // Protection contre la fixation de session.
        $request->session()->regenerate();

        return Auth::guard('web')->user();
    }
}