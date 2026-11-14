import { client } from './client'
import type { Page } from './projets'
import type { FollowState, UtilisateurResume } from '../types'

/**
 * Module « Suivi entre développeurs » (follow) — opérations P1 du contrat.
 *
 *   POST   /users/{id}/follow      201 + FollowState | 409 (déjà suivi) + FollowState | 422 (soi-même) | 404
 *   DELETE /users/{id}/follow      200 + FollowState (idempotent) | 404
 *   GET    /users/{id}/followers   200 + { data: UtilisateurResume[], meta }
 *   GET    /users/{id}/following   200 + { data: UtilisateurResume[], meta }
 *
 * RÈGLES DU CONTRAT appliquées ICI (et nulle part ailleurs) :
 *   - un 409 « déjà suivi » est un SUCCÈS : le corps contient l'état à jour,
 *     on l'utilise tel quel (`validateStatus` laisse passer le 409) ;
 *   - se suivre soi-même est interdit (422) : l'interface ne propose jamais
 *     le bouton sur son propre profil, ce 422 est un filet de sécurité ;
 *   - les listes sont paginées (`page`, `per_page` ; 15 par défaut, 50 maximum)
 *     et ne contiennent que des `UtilisateurResume` : PAS de `is_following`.
 *
 * Aucun composant ne connaît les mocks : pour brancher le vrai serveur, rien à
 * changer dans ce fichier (cf. INTEGRATION.md § « Brancher le suivi »).
 */

const accepter409 = (statut: number) => (statut >= 200 && statut < 300) || statut === 409

export async function suivre(id: number): Promise<FollowState> {
  const { data } = await client.post<FollowState>(`/users/${id}/follow`, undefined, { validateStatus: accepter409 })
  return data
}

export async function nePlusSuivre(id: number): Promise<FollowState> {
  const { data } = await client.delete<FollowState>(`/users/${id}/follow`)
  return data
}

export interface PaginationSuivi {
  page?: number
  per_page?: number
}

export async function abonnes(id: number, pagination: PaginationSuivi = {}): Promise<Page<UtilisateurResume>> {
  const { data } = await client.get<Page<UtilisateurResume>>(`/users/${id}/followers`, { params: pagination })
  return data
}

export async function abonnements(id: number, pagination: PaginationSuivi = {}): Promise<Page<UtilisateurResume>> {
  const { data } = await client.get<Page<UtilisateurResume>>(`/users/${id}/following`, { params: pagination })
  return data
}
