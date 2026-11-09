import { client } from './client'
import type { Page } from './projets'
import type { Domaine, Profil, Projet, RoleProfil, Talent } from '../types'

/**
 * Module « Talents » : recherche de membres, profil public, portfolio.
 *
 * Règles du contrat (AGENTS.md § 2) :
 *   - `GET /users` exclut l'utilisateur connecté ; `q` cherche le nom et la bio ;
 *   - `competence_ids` en brackets (A-14), `competence_match` = any (défaut) | all ;
 *   - `GET /users/{id}` ne contient JAMAIS d'e-mail ;
 *   - `followers_count`, `following_count`, `is_following` : P1 (suivi). Valent 0/false
 *     tant que le suivi n'est pas livré — affichés SEULEMENT si `priorites.follow`
 *     est vrai (cf. `api/suivi.ts`, ASSUMPTIONS.md A-10).
 */

export interface FiltresTalents {
  q?: string
  competence_ids?: number[]
  competence_match?: 'any' | 'all'
  domaine?: Domaine
  pays?: string
  region?: string
  role_profil?: RoleProfil
  page?: number
  per_page?: number
}

export async function rechercherTalents(filtres: FiltresTalents = {}): Promise<Page<Talent>> {
  const { data } = await client.get<Page<Talent>>('/users', { params: filtres })
  return data
}

export async function profilPublic(id: number): Promise<Profil> {
  const { data } = await client.get<Profil>(`/users/${id}`)
  return data
}

export async function portfolio(id: number): Promise<Projet[]> {
  const { data } = await client.get<{ data: Projet[] }>(`/users/${id}/portfolio`)
  return data.data
}
