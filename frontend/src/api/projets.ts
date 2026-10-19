import { client } from './client'
import type { Projet, ProjetCarte, ProjetCreate, ProjetUpdate } from '../types'

/**
 * Module « Projets ».
 *
 * Rappel des règles du contrat (AGENTS.md § 2) :
 *   - `GET /projects` renvoie des CARTES (`ProjetCarte`), jamais le détail ;
 *   - les listes sont PAGINÉES `{ data, meta }` (15 par défaut, 50 max) ;
 *   - `termine` est refusé à la création et définitif ;
 *   - `is_member` et `ma_demande_statut` pilotent l'état des boutons.
 */

export interface MetaPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface Page<T> {
  data: T[]
  meta: MetaPagination
}

/** Filtres de recherche des projets. */
export interface FiltresProjets {
  q?: string
  domaine?: string
  statut?: string
  competence_ids?: number[]
  places_disponibles?: boolean
  page?: number
  per_page?: number
}

/** Explorer / rechercher les projets. */
export async function listerProjets(filtres: FiltresProjets = {}): Promise<Page<ProjetCarte>> {
  const { data } = await client.get<Page<ProjetCarte>>('/projects', { params: filtres })
  return data
}

/** Mes projets (dont je suis membre). */
export async function mesProjets(): Promise<Page<ProjetCarte>> {
  const { data } = await client.get<Page<ProjetCarte>>('/me/projects')
  return data
}

/** Détail complet d'un projet. */
export async function detailProjet(id: number): Promise<Projet> {
  const { data } = await client.get<Projet>(`/projects/${id}`)
  return data
}

/** Créer un projet. Le créateur devient automatiquement `proprietaire`. */
export async function creerProjet(corps: ProjetCreate): Promise<Projet> {
  const { data } = await client.post<Projet>('/projects', corps)
  return data
}

/** Modifier un projet (propriétaire uniquement — Policy côté backend). */
export async function modifierProjet(id: number, corps: ProjetUpdate): Promise<Projet> {
  const { data } = await client.patch<Projet>(`/projects/${id}`, corps)
  return data
}

/** Supprimer un projet (propriétaire uniquement). */
export async function supprimerProjet(id: number): Promise<void> {
  await client.delete(`/projects/${id}`)
}
