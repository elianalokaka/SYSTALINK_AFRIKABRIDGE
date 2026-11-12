import { client } from './client'
import type {
  Competence,
  CompetenceUtilisateur,
  CompetencesUpdate,
  ProfilPrive,
  ProfilUpdate,
} from '../types'

/**
 * Module « Profils & Compétences ».
 *
 * Rappel des règles du contrat (AGENTS.md § 2) :
 *   - `GET /skills` renvoie une collection BORNÉE `{ data: [...] }` — pas de meta.
 *   - `PATCH /users/me` est PARTIEL : l'email et le mot de passe ne se modifient
 *     PAS ici (hors périmètre confirmé). Le champ s'appelle `role_profil`.
 *   - `PUT /users/me/skills` REPLACE toute la liste (règle `sync()`), max 30.
 *   - `POST /users/me/photo` : multipart, jpg/png/webp, 2 Mo max (422 sur `photo`).
 */

/** Catalogue des compétences (`data`) et des domaines déjà en base (`domaines`). */
export async function listeCatalogues(): Promise<{ competences: Competence[]; domaines: string[] }> {
  const { data } = await client.get<{ data: Competence[]; domaines?: string[] }>('/skills')
  return { competences: data.data, domaines: data.domaines ?? [] }
}

/** Le catalogue des compétences — non paginé. */
export async function listeCompetences(): Promise<Competence[]> {
  return (await listeCatalogues()).competences
}

/** Modifie mon profil (PATCH partiel). */
export async function modifierProfil(corps: ProfilUpdate): Promise<ProfilPrive> {
  const { data } = await client.patch<ProfilPrive>('/users/me', corps)
  return data
}

/** Remplace TOUTES mes compétences. Un `nom` sans id crée ou réutilise une entrée du catalogue. */
export async function definirCompetences(corps: {
  competences: Array<{
    competence_id?: number
    nom?: string
    niveau?: CompetenceUtilisateur['niveau']
  }>
}): Promise<CompetenceUtilisateur[]> {
  const { data } = await client.put<{ competences: CompetenceUtilisateur[] }>(
    '/users/me/skills',
    corps as CompetencesUpdate,
  )
  return data.competences
}

/**
 * Envoie ou remplace ma photo de profil.
 *
 * C'est un POST (et pas PATCH) : PHP ne lit pas multipart sur PATCH/PUT —
 * règle explicite du contrat. 2 Mo max → 422 sur le champ `photo` ; au-dessus
 * de 16 Mo → 413 (Nginx/PHP).
 *
 * ⚠️ Limite connue du client : un corps `FormData` déjà consommé n'est pas
 * rejouable après un 419. Tant que le mock ne renvoie pas de 419, aucun souci ;
 * contre le vrai backend, il faudra conserver une FABRIQUE de FormData.
 */
export async function envoyerPhoto(fichier: File): Promise<string> {
  const formulaire = new FormData()
  formulaire.append('photo', fichier)
  const { data } = await client.post<{ photo_url: string }>('/users/me/photo', formulaire)
  return data.photo_url
}
