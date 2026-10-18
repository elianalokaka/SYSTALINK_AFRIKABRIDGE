<?php

namespace App\Services\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;

class DemandeAdhesionService
{
    /**
     * @return array{code: int, candidature?: Candidature, message?: string}
     */
    public function deposer(Utilisateur $candidat, Projet $projet, ?string $message): array
    {
        if ($this->estMembre($candidat, $projet)) {
            return $this->conflit('Vous êtes déjà membre de ce projet.');
        }

        if ($this->aUneDemandeEnAttente($candidat, $projet)) {
            return $this->conflit('Une demande est déjà en attente pour ce projet.');
        }

        if ($projet->statut === 'termine') {
            return $this->conflit('Ce projet est terminé.');
        }

        if ($this->equipeComplete($projet)) {
            return $this->conflit('L\'équipe de ce projet est complète.');
        }

        $candidature = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $candidat->id,
            'message_motivation' => $message,
        ]);

        return [
            'code' => 201,
            'candidature' => $candidature->load(['projet.domaines', 'candidat']),
        ];
    }

    private function conflit(string $message): array
    {
        return [
            'code' => 409,
            'message' => $message,
        ];
    }

    private function estMembre(Utilisateur $candidat, Projet $projet): bool
    {
        return MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $candidat->id)
            ->exists();
    }

    private function aUneDemandeEnAttente(Utilisateur $candidat, Projet $projet): bool
    {
        return Candidature::query()
            ->where('projet_id', $projet->id)
            ->where('candidat_id', $candidat->id)
            ->where('statut', 'en_attente')
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