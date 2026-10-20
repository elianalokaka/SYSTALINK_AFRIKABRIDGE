import { client } from './client'
import type { FilMessages, Message } from '../types'

/**
 * Module « Messagerie ».
 *
 * Règles du contrat à respecter (AGENTS.md § 2, ASSUMPTIONS A-5 / A-13) :
 *   - lecture et envoi : MEMBRES du projet uniquement (403 sinon) ;
 *   - suppression : auteur du message OU propriétaire du projet ;
 *   - pas de temps réel : polling toutes les 5 s avec `apres_id` + `depuis` ;
 *   - `depuis` = `meta.server_time` du tour précédent, renvoyé TEL QUEL (A-5).
 */

/** Paramètres de `GET /projects/{id}/messages` — tous facultatifs. */
export interface ParamsMessages {
  /** Nouveaux messages : ceux dont l'id est SUPÉRIEUR. */
  apres_id?: number
  /** Historique : ceux dont l'id est INFÉRIEUR. */
  avant_id?: number
  /** `meta.server_time` reçu au précédent appel, en chaîne brute. Remplit `supprimes`. */
  depuis?: string
  /** 1 à 100, 50 par défaut. */
  limit?: number
}

/** Messages triés du plus ancien au plus récent + ids supprimés depuis `depuis`. */
export async function lireMessages(projetId: number, params: ParamsMessages = {}): Promise<FilMessages> {
  const { data } = await client.get<FilMessages>(`/projects/${projetId}/messages`, { params })
  return data
}

/** Envoie un message (1 à 2000 caractères). */
export async function envoyerMessage(projetId: number, contenu: string): Promise<Message> {
  const { data } = await client.post<Message>(`/projects/${projetId}/messages`, { contenu })
  return data
}

/** Suppression logique : auteur ou propriétaire du projet. */
export async function supprimerMessage(projetId: number, messageId: number): Promise<void> {
  await client.delete(`/projects/${projetId}/messages/${messageId}`)
}
