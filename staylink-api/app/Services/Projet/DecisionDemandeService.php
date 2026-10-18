<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;

class DecisionDemandeService
{
    /**
     * @return array{code: int, candidature?: Candidature, message?: string}
     */
    public function decider(Utilisateur $acteur, Candidature $candidature, string $decision): array
    {
        $candidature->loadMissing('projet');

        if (! $this->estProprietaire($acteur, $candidature->projet)) {
            return [
                'code' => 403,
                'message' => 'Seul le propriétaire peut traiter cette demande.',
            ];
        }

        return DB::transaction(function () use ($candidature, $decision) {
            $candidature->refresh();

            if ($candidature->statut !== 'en_attente') {
                return $this->conflit('Cette demande a déjà été traitée.');
            }

            if ($decision === 'acceptee' && $this->equipeComplete($candidature->projet)) {
                return $this->conflit('L\'équipe de ce projet est complète.');
            }

            $candidature->update([
                'statut' => $decision,
                'date_decision' => now(),
            ]);

            if ($decision === 'acceptee') {
                MembreProjet::query()->create([
                    'projet_id' => $candidature->projet_id,
                    'utilisateur_id' => $candidature->candidat_id,
                    'role' => 'membre',
                ]);
            }

            return [
                'code' => 200,
                'candidature' => $candidature->load(['projet.domaines', 'candidat']),
            ];
        });
    }

    /**
     * @return array{code: int, message: string}
     */
    private function conflit(string $message): array
    {
        return [
            'code' => 409,
            'message' => $message,
        ];
    }

    private function estProprietaire(Utilisateur $acteur, Projet $projet): bool
    {
        return MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $acteur->id)
            ->where('role', 'proprietaire')
            ->exists();
    }

    private function equipeComplete(Projet $projet): bool
    {
        if ($projet->nombre_max_membres === null) {
            return false;
        }

        $effectif = MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->count();

        return $effectif >= $projet->nombre_max_membres;
    }
}