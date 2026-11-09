import { client } from './client'
import { ErreurApi } from './erreurs'
import { demandesDuProjet, mesDemandes } from './equipes'
import { mesProjets } from './projets'
import { estLivre } from '../lib/priorites'
import type { ProjetCarte, ProjetResume } from '../types'

/**
 * Tableau de bord : UNE fonction publique, `chargerTableauDeBord()`, qui cache la stratégie
 * (ASSUMPTIONS.md A-15).
 *
 *   1. si `priorites.dashboard` : on tente `GET /me/dashboard` (P1, un seul appel) ;
 *      une route absente (404) ou une réponse qui n'a pas la forme du contrat
 *      déclenche le repli — jamais une erreur visible ;
 *   2. sinon, REPLI P0 documenté par le contrat : `GET /me/projects` + `GET /me/join-requests`,
 *      et les demandes reçues projet par projet, EN PARALLÈLE et tolérant à l'échec.
 *
 * Le jour où le backend livre le P1, on passe `priorites.dashboard` à `true` :
 * aucun composant ne change. `followers_count` / `following_count` ne sont PAS repris
 * (follow = P1, ils valent 0 : un 0 affiché serait un mensonge visuel).
 */

/** Demandes en attente sur MES projets (propriétaire) : total + détail par projet. */
export interface DemandesRecues {
  total: number
  /** Par id de projet (seulement ceux que je possède, hors `termine`). */
  parProjet: Record<number, number>
}

/**
 * Lit mes projets possédés, puis les demandes `en_attente` de chacun en parallèle
 * (`per_page: 1` : seul `meta.total` compte). Un projet dont l'appel échoue est
 * ignoré : il ne fait pas tomber les autres. Les projets `termine` n'acceptent plus
 * de demandes : ignorés.
 */
export async function chargerDemandesRecues(): Promise<DemandesRecues> {
  const possedes = await mesProjets({ role_equipe: 'proprietaire', per_page: 50 })
  const ouverts = possedes.data.filter((projet) => projet.statut !== 'termine')

  const reponses = await Promise.allSettled(
    ouverts.map((projet) => demandesDuProjet(projet.id, 'en_attente', { per_page: 1 }))
  )

  const parProjet: Record<number, number> = {}
  let total = 0
  reponses.forEach((reponse, index) => {
    if (reponse.status !== 'fulfilled') return
    const nombre = reponse.value.meta.total
    parProjet[ouverts[index].id] = nombre
    total += nombre
  })
  return { total, parProjet }
}

export interface TableauDeBord {
  /** Les 5 projets les plus récemment actifs (V-5 : `GET /me/projects` est trié `updated_at DESC`). */
  projets: ProjetResume[]
  projets_count: number
  /** `null` = indisponible (appel en échec) : l'écran affiche « — », jamais un faux 0. */
  demandes_recues_en_attente: number | null
  mes_demandes_en_attente: number | null
  source: 'p1' | 'p0'
}

function enResume(projet: ProjetCarte): ProjetResume {
  return {
    id: projet.id,
    nom: projet.nom,
    domaines: projet.domaines,
    statut: projet.statut,
    progression: projet.progression,
    nombre_membres_souhaite: projet.nombre_membres_souhaite,
    nombre_membres_actuel: projet.nombre_membres_actuel,
  }
}

/** La réponse de `GET /me/dashboard` a-t-elle la forme du contrat ? (le SPA fallback d'un dev server renvoie du HTML en 200) */
function estTableauContrat(donnees: unknown): donnees is Omit<TableauDeBord, 'source'> {
  if (typeof donnees !== 'object' || donnees === null) return false
  const d = donnees as Record<string, unknown>
  return (
    Array.isArray(d.mes_projets) &&
    typeof d.projets_count === 'number' &&
    typeof d.demandes_recues_en_attente === 'number' &&
    typeof d.mes_demandes_en_attente === 'number'
  )
}

async function viaP1(): Promise<TableauDeBord | null> {
  try {
    const { data } = await client.get<unknown>('/me/dashboard')
    if (!estTableauContrat(data)) return null
    const brut = data as unknown as { mes_projets: ProjetResume[] } & Omit<TableauDeBord, 'projets' | 'source'>
    return {
      projets: brut.mes_projets,
      projets_count: brut.projets_count,
      demandes_recues_en_attente: brut.demandes_recues_en_attente,
      mes_demandes_en_attente: brut.mes_demandes_en_attente,
      source: 'p1',
    }
  } catch (e) {
    if (e instanceof ErreurApi && (e.introuvable || e.statut === 405 || e.statut === 501)) return null
    throw e
  }
}

/**
 * @param demandesRecues fourni par l'appelant pour PARTAGER son cache (même série d'appels
 *   que le badge de navigation) ; par défaut, un appel direct.
 */
async function viaP0(demandesRecues: () => Promise<DemandesRecues>): Promise<TableauDeBord> {
  const [projets, envoyees, recues] = await Promise.allSettled([
    mesProjets({ per_page: 5 }),
    mesDemandes({ statut: 'en_attente', per_page: 1 }),
    demandesRecues(),
  ])
  /* Sans mes projets, il n'y a pas de tableau de bord : l'erreur remonte (écran « Réessayer »). */
  if (projets.status === 'rejected') throw projets.reason

  return {
    projets: projets.value.data.map(enResume),
    projets_count: projets.value.meta.total,
    demandes_recues_en_attente: recues.status === 'fulfilled' ? recues.value.total : null,
    mes_demandes_en_attente: envoyees.status === 'fulfilled' ? envoyees.value.meta.total : null,
    source: 'p0',
  }
}

export async function chargerTableauDeBord(
  options: { demandesRecues?: () => Promise<DemandesRecues> } = {}
): Promise<TableauDeBord> {
  if (estLivre('dashboard')) {
    const p1 = await viaP1()
    if (p1) return p1
  }
  return viaP0(options.demandesRecues ?? chargerDemandesRecues)
}
