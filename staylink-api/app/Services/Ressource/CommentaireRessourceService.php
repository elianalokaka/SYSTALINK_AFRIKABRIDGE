<?php

namespace App\Services\Ressource;

use App\Models\Commentaire;
use App\Models\Ressource;
use App\Models\Utilisateur;

class CommentaireRessourceService
{
    /**
     * @param  array{page?: int, per_page?: int}  $pagination
     * @return array{code: int, message?: string, page?: \Illuminate\Contracts\Pagination\LengthAwarePaginator}
     */
    public function lister(Utilisateur $acteur, Ressource $ressource, array $pagination): array
    {
        if (! $ressource->estVisiblePour($acteur)) {
            return [
                'code' => 403,
                'message' => 'Seuls les membres du projet peuvent voir ces commentaires.',
            ];
        }

        $parPage = (int) ($pagination['per_page'] ?? 15);

        return [
            'code' => 200,
            'page' => $ressource->commentaires()
                ->with('auteur')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->paginate($parPage),
        ];
    }

    /**
     * @return array{code: int, message?: string, commentaire?: Commentaire}
     */
    public function publier(Utilisateur $acteur, Ressource $ressource, string $contenu): array
    {
        if (! $ressource->estVisiblePour($acteur)) {
            return [
                'code' => 403,
                'message' => 'Seuls les membres du projet peuvent commenter cette ressource.',
            ];
        }

        $commentaire = Commentaire::query()->create([
            'ressource_id' => $ressource->id,
            'utilisateur_id' => $acteur->id,
            'contenu' => $contenu,
        ]);

        return [
            'code' => 201,
            'commentaire' => $commentaire->load('auteur'),
        ];
    }

    /**
     * @return array{code: int, message?: string}
     */
    public function supprimer(Utilisateur $acteur, Commentaire $commentaire): array
    {
        $commentaire->loadMissing('ressource');

        $estAuteurCommentaire = (int) $commentaire->utilisateur_id === (int) $acteur->id;
        $estAuteurRessource = (int) $commentaire->ressource->utilisateur_id === (int) $acteur->id;

        if (! $estAuteurCommentaire && ! $estAuteurRessource) {
            return [
                'code' => 403,
                'message' => 'Seul l\'auteur du commentaire ou de la ressource peut le supprimer.',
            ];
        }

        $commentaire->delete();

        return ['code' => 204];
    }
}
