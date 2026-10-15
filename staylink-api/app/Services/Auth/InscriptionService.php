<?php

namespace App\Services\Auth;

use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InscriptionService
{
    /**
     * Créer un compte et ouvrir automatiquement sa session.
     *
     * Les données reçues doivent déjà avoir été validées
     * par InscriptionRequest.
     */
    public function inscrire(
        array $donnees,
        Request $request
    ): Utilisateur {
        // Créer l'utilisateur dans PostgreSQL.
        $utilisateur = Utilisateur::create([
            'nom' => $donnees['nom'],
            'prenom' => $donnees['prenom'],
            'email' => $donnees['email'],
            'mot_de_passe' => $donnees['mot_de_passe'],
            'pays' => $donnees['pays'],
        ]);

        // Ouvrir une session pour le nouvel utilisateur.
        Auth::guard('web')->login($utilisateur);

        // Régénérer l'identifiant de session après authentification.
        $request->session()->regenerate();

        return $utilisateur;
    }
}