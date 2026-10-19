import { client } from './client'
import type { Page } from './projets'
import type {
  DemandeAdhesion,
  DemandeAdhesionCreate,
  DemandeDecision,
  Membre,
  StatutDemande,
} from '../types'

/**
 * Module « Équipes ».
 *
 * Règles du contrat à respecter :
 *   - une seule demande `en_attente` par couple (projet, utilisateur) → 409 ;
 *   - `acceptee` crée la ligne membre (role_equipe = membre) dans la même transaction ;
 *   - le propriétaire ne peut PAS quitter son propre projet (409) ;
 *   - seules les demandes `en_attente` peuvent être annulées.
 */

/** Demander à rejoindre un projet. 409 si déjà membre / demande en attente / équipe complète. */
export async function demanderAdhesion(
  projetId: number,
  corps: DemandeAdhesionCreate
): Promise<DemandeAdhesion> {
  const { data } = await client.post<DemandeAdhesion>(`/projects/${projetId}/join-requests`, corps)
  return data
}

/**
 * Demandes reçues par un projet (propriétaire uniquement).
 *
 * Le contrat filtre sur `statut` et vaut `en_attente` par défaut : on l'envoie
 * TOUJOURS explicitement, pour ne pas dépendre d'un défaut implicite. Une demande
 * traitée (acceptée / refusée) n'apparaît donc plus dans « en_attente ».
 */
export async function demandesDuProjet(
  projetId: number,
  statut: StatutDemande = 'en_attente',
  pagination: { page?: number; per_page?: number } = {}
): Promise<Page<DemandeAdhesion>> {
  const { data } = await client.get<Page<DemandeAdhesion>>(`/projects/${projetId}/join-requests`, {
    params: { statut, ...pagination },
  })
  return data
}

/** Mes demandes d'adhésion envoyées. */
export async function mesDemandes(): Promise<Page<DemandeAdhesion>> {
  const { data } = await client.get<Page<DemandeAdhesion>>('/me/join-requests')
  return data
}

/** Accepter ou refuser une demande (propriétaire). */
export async function traiterDemande(id: number, corps: DemandeDecision): Promise<DemandeAdhesion> {
  const { data } = await client.patch<DemandeAdhesion>(`/join-requests/${id}`, corps)
  return data
}

/** Annuler ma demande en attente. */
export async function annulerDemande(id: number): Promise<void> {
  await client.delete(`/join-requests/${id}`)
}

/** Membres d'un projet — collection BORNÉE, pas de meta. */
export async function membresDuProjet(projetId: number): Promise<{ data: Membre[] }> {
  const { data } = await client.get<{ data: Membre[] }>(`/projects/${projetId}/members`)
  return data
}

/** Retirer un membre (propriétaire) ou quitter le projet (soi-même). */
export async function retirerMembre(projetId: number, userId: number): Promise<void> {
  await client.delete(`/projects/${projetId}/members/${userId}`)
}
