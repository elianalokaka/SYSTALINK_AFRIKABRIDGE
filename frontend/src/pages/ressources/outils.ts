import type { Ressource } from '../../types'

/**
 * N'autorise que http(s) pour les liens externes : une URL `javascript:` venue
 * d'un autre utilisateur ne doit JAMAIS devenir un lien cliquable.
 */
export function lienSur(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null
}

/** Fichiers : http(s) en production, `data:` pour les mocks (le mock n'a pas de disque). */
export function fichierSur(url: string | null): string | null {
  return url && /^(https?:\/\/|data:)/i.test(url) ? url : null
}

/** Nom de domaine d'une URL, pour l'affichage (`git-scm.com`). */
export function domaineDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export const dateCourte = (iso: string) => new Date(iso).toLocaleDateString('fr-FR')

/** « Le moteur de ce type » : quels champs de contenu un type de ressource porte. */
export function champsDuType(type: Ressource['type']) {
  return {
    url: type !== 'document',
    urlObligatoire: type === 'lien' || type === 'tutoriel' || type === 'api',
    code: type === 'code',
    fichier: type === 'document',
  }
}

/** Limite métier du contrat : 10 Mo (422 sur `fichier`) ; au-delà de 16 Mo c'est un 413. */
export const TAILLE_MAX_FICHIER = 10 * 1024 * 1024
export const EXTENSIONS_FICHIER = ['pdf', 'docx', 'zip', 'png', 'jpg', 'jpeg']
