import { LISTE_DOMAINES, LIBELLES_DOMAINE } from './labels'
import type { Competence, Domaine } from '../types'

export function normaliserTexte(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function competenceCataloguePour(
  saisie: string,
  catalogue: Competence[],
): Competence | null {
  const clef = normaliserTexte(saisie)
  if (!clef) return null

  return catalogue.find((competence) => normaliserTexte(competence.nom) === clef) ?? null
}

export function domaineCataloguePour(saisie: string): { valeur: Exclude<Domaine, 'autre'>; libelle: string } | null {
  const clef = normaliserTexte(saisie)
  if (!clef) return null

  for (const [valeur, libelle] of LISTE_DOMAINES) {
    if (valeur === 'autre') continue
    const clefLibelle = normaliserTexte(libelle)
    const clefValeur = normaliserTexte(valeur.replaceAll('_', ' '))
    if (clef === clefLibelle || clef === clefValeur) {
      return { valeur, libelle }
    }
  }

  return null
}

export function libelleDomaine(domaine: string): string {
  return LIBELLES_DOMAINE[domaine as Domaine] ?? domaine
}

/** Remplace la case « Autre » par le nom saisi (ou par l’entrée du catalogue). */
export function domainesPourEnvoi(selection: string[], saisieLibre: string): string[] {
  const connus = selection.filter((valeur) => valeur !== 'autre')
  if (!selection.includes('autre')) return connus

  const saisie = saisieLibre.trim()
  const connu = domaineCataloguePour(saisie)
  if (connu) return connus.includes(connu.valeur) ? connus : [...connus, connu.valeur]
  if (saisie !== '') return [...connus, saisie]

  return [...connus, 'autre']
}

export const DOMAINES_CATALOGUE = LISTE_DOMAINES.filter(([valeur]) => valeur !== 'autre') as Array<
  [Exclude<Domaine, 'autre'>, string]
>

/** Cases du catalogue fixe + domaines libres déjà en base (ou déjà cochés). */
export function domainesAffiches(inventaire: string[] = [], selection: string[] = []): Array<[string, string]> {
  const vus = new Set<string>()
  const lignes: Array<[string, string]> = []

  const ajouter = (valeur: string) => {
    if (!valeur || valeur === 'autre' || vus.has(valeur)) return
    vus.add(valeur)
    lignes.push([valeur, libelleDomaine(valeur)])
  }

  DOMAINES_CATALOGUE.forEach(([valeur]) => ajouter(valeur))
  inventaire.forEach(ajouter)
  selection.forEach(ajouter)

  return lignes
}
