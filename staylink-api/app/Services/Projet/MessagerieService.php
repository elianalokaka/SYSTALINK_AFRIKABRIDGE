<?php

namespace App\Services\Projet;

use App\Models\MembreProjet;
use App\Models\Message;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Support\Carbon;

class MessagerieService
{
    /**
     * @return array{code: int, message?: Message|string, fil?: array}
     */
    public function envoyer(Utilisateur $auteur, Projet $projet, string $contenu): array
    {
        if (! $this->estMembre($auteur, $projet)) {
            return $this->interdit('Seuls les membres du projet peuvent écrire.');
        }

        $message = Message::query()->create([
            'projet_id' => $projet->id,
            'expediteur_id' => $auteur->id,
            'contenu' => $contenu,
        ]);

        return [
            'code' => 201,
            'message' => $message->load('expediteur'),
        ];
    }

    /**
     * @return array{code: int, message?: string, fil?: array{data: \Illuminate\Support\Collection, supprimes: array<int>, server_time: string}}
     */
    public function lire(
        Utilisateur $lecteur,
        Projet $projet,
        ?int $apresId,
        ?int $avantId,
        ?string $depuis,
        int $limit
    ): array {
        if (! $this->estMembre($lecteur, $projet)) {
            return $this->interdit('Seuls les membres du projet peuvent lire la discussion.');
        }

        $limit = min(100, max(1, $limit));

        $requete = Message::query()->where('projet_id', $projet->id);

        if ($apresId !== null) {
            $requete->where('id', '>', $apresId);
        }

        if ($avantId !== null) {
            $requete->where('id', '<', $avantId);
        }

        $data = $requete
            ->with('expediteur')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $supprimes = [];

        if ($depuis !== null && $depuis !== '') {
            $seuil = Carbon::parse($depuis)->startOfSecond();

            $supprimes = Message::onlyTrashed()
                ->where('projet_id', $projet->id)
                ->where('deleted_at', '>=', $seuil)
                ->orderBy('id')
                ->pluck('id')
                ->all();
        }

        return [
            'code' => 200,
            'fil' => [
                'data' => $data,
                'supprimes' => $supprimes,
                'server_time' => now()->toISOString(),
            ],
        ];
    }

    /**
     * @return array{code: int, message?: string}
     */
    public function supprimer(Utilisateur $acteur, Projet $projet, int $messageId): array
    {
        $message = Message::query()
            ->where('projet_id', $projet->id)
            ->find($messageId);

        if ($message === null) {
            return [
                'code' => 404,
                'message' => 'Message introuvable.',
            ];
        }

        $estAuteur = $message->expediteur_id === $acteur->id;
        $estProprietaire = $this->estProprietaire($acteur, $projet);

        if (! $estAuteur && ! $estProprietaire) {
            return $this->interdit('Seul l\'auteur ou le propriétaire peut supprimer ce message.');
        }

        $message->delete();

        return [
            'code' => 204,
        ];
    }

    /**
     * @return array{code: int, message: string}
     */
    private function interdit(string $message): array
    {
        return [
            'code' => 403,
            'message' => $message,
        ];
    }

    private function estMembre(Utilisateur $utilisateur, Projet $projet): bool
    {
        return MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $utilisateur->id)
            ->exists();
    }

    private function estProprietaire(Utilisateur $utilisateur, Projet $projet): bool
    {
        return MembreProjet::query()
            ->where('projet_id', $projet->id)
            ->where('utilisateur_id', $utilisateur->id)
            ->where('role', 'proprietaire')
            ->exists();
    }
}