<?php

namespace App\Services\Profil;

use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;

class ModifierProfilService
{
    /**
     * Met à jour le profil connecté selon ProfilUpdate (champs présents seulement).
     *
     * @param  array<string, mixed>  $donnees
     */
    public function modifier(Utilisateur $utilisateur, array $donnees): Utilisateur
    {
        return DB::transaction(function () use ($utilisateur, $donnees) {
            $modifications = [];

            if (array_key_exists('nom', $donnees)) {
                [$prenom, $nom] = Utilisateur::decomposerNomComplet($donnees['nom']);
                $modifications['prenom'] = $prenom;
                $modifications['nom'] = $nom;
            }

            if (array_key_exists('bio', $donnees)) {
                $modifications['biographie'] = $donnees['bio'];
            }

            if (array_key_exists('pays', $donnees)) {
                $modifications['pays'] = $donnees['pays'];
            }

            if (array_key_exists('region', $donnees)) {
                $modifications['region'] = $donnees['region'];
            }

            if (array_key_exists('role_profil', $donnees)) {
                $modifications['role_profil'] = $donnees['role_profil'];
            }

            if (array_key_exists('domaines', $donnees)) {
                $modifications['domaine'] = $donnees['domaines'][0] ?? null;
            }

            if ($modifications !== []) {
                $utilisateur->update($modifications);
            }

            if (array_key_exists('domaines', $donnees)) {
                $utilisateur->domaines()->delete();
                foreach ($donnees['domaines'] as $domaine) {
                    $utilisateur->domaines()->create(['domaine' => $domaine]);
                }
            }

            if (array_key_exists('liens', $donnees)) {
                $utilisateur->liens()->delete();
                foreach ($donnees['liens'] as $lien) {
                    $utilisateur->liens()->create([
                        'type' => $lien['type'],
                        'url' => $lien['url'],
                    ]);
                }
            }

            return $utilisateur->fresh([
                'competences',
                'domaines',
                'liens',
            ]);
        });
    }
}
