import { client } from './client'
import type { Page } from './projets'
import type { Ressource, RessourceCreation, RessourceUpdate, TypeRessource } from '../types'

/**
 * Module « Ressources ».
 *
 * Règles du contrat à respecter (AGENTS.md § 2) :
 *   - `GET /resources` : ressources publiques + celles de MES projets ; avec
 *     `projet_id` → uniquement celles du projet, 403 si je n'en suis pas membre (A-8) ;
 *   - `POST` : `application/json` SANS fichier, `multipart/form-data` AVEC fichier ;
 *   - `document` ⇒ fichier obligatoire (422), 10 Mo max (422 sur `fichier`), > 16 Mo ⇒ 413 ;
 *   - `visibilite` : OMETTRE le champ pour laisser le serveur décider ;
 *   - `competence_ids` en query : brackets `competence_ids[]=1&competence_ids[]=2` (A-14),
 *     déjà géré par le `paramsSerializer` du client ;
 *   - modification / suppression : auteur OU propriétaire du projet lié.
 */

/** Filtres de `GET /resources` (tous facultatifs). */
export interface FiltresRessources {
  q?: string
  type?: TypeRessource
  competence_ids?: number[]
  projet_id?: number
  auteur_id?: number
  page?: number
  per_page?: number
}

export async function listerRessources(filtres: FiltresRessources = {}): Promise<Page<Ressource>> {
  const { data } = await client.get<Page<Ressource>>('/resources', { params: filtres })
  return data
}

export async function detailRessource(id: number): Promise<Ressource> {
  const { data } = await client.get<Ressource>(`/resources/${id}`)
  return data
}

/**
 * Publie une ressource. Choisit le content-type selon la présence d'un fichier.
 * Les champs absents ou vides ne sont PAS envoyés (en particulier `visibilite`).
 */
export async function creerRessource(corps: RessourceCreation): Promise<Ressource> {
  const { fichier, competence_ids, ...champs } = corps

  if (fichier) {
    const formulaire = new FormData()
    for (const [cle, valeur] of Object.entries(champs)) {
      if (valeur !== undefined && valeur !== null && valeur !== '') formulaire.append(cle, String(valeur))
    }
    for (const id of competence_ids ?? []) formulaire.append('competence_ids[]', String(id))
    formulaire.append('fichier', fichier)
    const { data } = await client.post<Ressource>('/resources', formulaire)
    return data
  }

  const json: Record<string, unknown> = {}
  for (const [cle, valeur] of Object.entries(champs)) {
    if (valeur !== undefined && valeur !== null && valeur !== '') json[cle] = valeur
  }
  if (competence_ids && competence_ids.length > 0) json.competence_ids = competence_ids
  const { data } = await client.post<Ressource>('/resources', json)
  return data
}

export async function modifierRessource(id: number, corps: RessourceUpdate): Promise<Ressource> {
  const { data } = await client.patch<Ressource>(`/resources/${id}`, corps)
  return data
}

export async function supprimerRessource(id: number): Promise<void> {
  await client.delete(`/resources/${id}`)
}
