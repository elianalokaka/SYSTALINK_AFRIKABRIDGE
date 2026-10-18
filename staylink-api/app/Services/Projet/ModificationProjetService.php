<?php

namespace App\Services\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ModificationProjetService
{
    public function modifier(Utilisateur $acteur, Projet $projet, array $donnees): Projet
    {
        return DB::transaction(function () use ($acteur, $projet, $donnees) {
            $projet = Projet::query()->lockForUpdate()->findOrFail($projet->id);

            $estProprietaire = MembreProjet::query()
                ->where('projet_id', $projet->id)
                ->where('utilisateur_id', $acteur->id)
                ->where('role', 'proprietaire')
                ->exists();

            abort_unless($estProprietaire, 403);

            if ($projet->statut === 'termine'
                && isset($donnees['statut'])
                && $donnees['statut'] !== 'termine') {
                throw ValidationException::withMessages([
                    'statut' => ['Un projet terminé ne peut pas être réouvert.'],
                ]);
            }

            $modifications = [];
            foreach (['nom', 'description', 'domaine', 'objectifs'] as $champ) {
                if (array_key_exists($champ, $donnees)) {
                    $modifications[$champ] = $donnees[$champ];
                }
            }

            if (array_key_exists('nombre_membres_souhaite', $donnees)) {
                $effectif = MembreProjet::query()
                    ->where('projet_id', $projet->id)
                    ->count();

                if ($donnees['nombre_membres_souhaite'] < $effectif) {
                    throw ValidationException::withMessages([
                        'nombre_membres_souhaite' => [
                            'La capacité ne peut pas être inférieure au nombre actuel de membres.',
                        ],
                    ]);
                }

                $modifications['nombre_max_membres'] = $donnees['nombre_membres_souhaite'];
            }

            $statutFinal = $donnees['statut'] ?? $projet->statut;
            if ($statutFinal === 'termine') {
                $modifications['progression'] = 100;
                $modifications['date_fin'] ??= $projet->date_fin ?? today();
            } elseif (array_key_exists('progression', $donnees)) {
                $modifications['progression'] = $donnees['progression'];
            }

            if (array_key_exists('lien_realisation', $donnees)) {
                $modifications['lien_realisation'] = $donnees['lien_realisation'];
            }

            if (array_key_exists('statut', $donnees)) {
                $modifications['statut'] = $donnees['statut'];
            }

            $projet->update($modifications);

            if (array_key_exists('competence_ids', $donnees)) {
                $projet->competences()->sync($donnees['competence_ids']);
            }

            if (array_key_exists('domaine', $donnees)) {
                $projet->domaines()->delete();
                $projet->domaines()->create(['domaine' => $donnees['domaine']]);
            }

            return $projet->fresh([
                'domaines',
                'competences',
                'createur',
            ]);
        });
    }
}
