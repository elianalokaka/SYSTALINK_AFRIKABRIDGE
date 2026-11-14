import { useCallback } from 'react'
import { useI18n } from '../i18n'
import type { Langue } from '../i18n'

/**
 * Noms de compétences en anglais, indexés sur le nom que renvoie l'API (`GET /skills`).
 *
 * La plupart des compétences sont des noms propres techniques identiques dans les deux
 * langues (Python, React, Docker…) : elles n'ont pas d'entrée ici. Seules celles qui
 * changent y figurent. Une compétence absente du tableau s'affiche telle que le serveur la
 * nomme — jamais d'erreur, jamais de texte vide. Si le backend ajoute une compétence,
 * ajouter sa traduction ici est facultatif.
 */
const NOMS_EN: Record<string, string> = {
  Réseaux: 'Networking',
  Sécurité: 'Security',
  'Design graphique': 'Graphic design',
}

export function nomCompetence(langue: Langue, nom?: string): string {
  if (!nom) return ''
  return langue === 'en' ? (NOMS_EN[nom] ?? nom) : nom
}

/** `const nomComp = useNomCompetence()` puis `nomComp(comp.nom)`. */
export function useNomCompetence(): (nom?: string) => string {
  const { langue } = useI18n()
  return useCallback((nom?: string) => nomCompetence(langue, nom), [langue])
}
