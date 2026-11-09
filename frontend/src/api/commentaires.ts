import { client } from './client'
import type { Page } from './projets'
import type { Commentaire } from '../types'

/**
 * Module « Commentaires d'une ressource » — opérations P1 du contrat.
 *
 *   GET    /resources/{id}/comments   200 paginé | 401 | 403 | 404
 *   POST   /resources/{id}/comments   201 + Commentaire | 401 | 403 | 404 | 419 | 422 (`contenu` 1–1000)
 *   DELETE /comments/{id}             204 | 401 | 403 (ni auteur du commentaire ni auteur de la ressource) | 404 | 419
 *
 * Le contrat ne précise pas l'ORDRE des commentaires : hypothèse `A-1`
 * (plus récent en premier), à lever avec `V-15`. On ne retrie jamais côté front.
 *
 * Aucun composant ne connaît les mocks : pour brancher le vrai serveur, rien à
 * changer ici (cf. INTEGRATION.md § « Brancher les commentaires »).
 */

export interface PaginationCommentaires {
  page?: number
  per_page?: number
}

export async function commentaires(
  ressourceId: number,
  pagination: PaginationCommentaires = {}
): Promise<Page<Commentaire>> {
  const { data } = await client.get<Page<Commentaire>>(`/resources/${ressourceId}/comments`, { params: pagination })
  return data
}

export async function commenter(ressourceId: number, contenu: string): Promise<Commentaire> {
  const { data } = await client.post<Commentaire>(`/resources/${ressourceId}/comments`, { contenu })
  return data
}

export async function supprimerCommentaire(id: number): Promise<void> {
  await client.delete(`/comments/${id}`)
}
