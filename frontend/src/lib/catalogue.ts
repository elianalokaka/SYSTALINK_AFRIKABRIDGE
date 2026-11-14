import { en } from '../i18n/en'
import { fr } from '../i18n/fr'
import type { Competence, Domaine } from '../types'

const DOMAINES_CONNUS = [
  'agriculture',
  'sante',
  'education',
  'fintech',
  'energie',
  'transport',
  'iot',
  'intelligence_artificielle',
  'commerce',
  'environnement',
  'administration',
] as const satisfies readonly Exclude<Domaine, 'autre'>[]

type DomaineConnu = (typeof DOMAINES_CONNUS)[number]
type CleDomaine = `enum.domaine.${DomaineConnu}`

function cleDomaine(valeur: DomaineConnu): CleDomaine {
  return `enum.domaine.${valeur}`
}

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

/** Reconnaît un domaine du catalogue, que la saisie soit en français, en anglais ou le code technique. */
export function domaineCataloguePour(saisie: string): { valeur: DomaineConnu; libelle: string } | null {
  const clef = normaliserTexte(saisie)
  if (!clef) return null

  for (const valeur of DOMAINES_CONNUS) {
    const cle = cleDomaine(valeur)
    const libelles = [fr[cle], en[cle], valeur.replaceAll('_', ' ')]
    if (libelles.some((libelle) => normaliserTexte(libelle) === clef)) {
      return { valeur, libelle: fr[cle] }
    }
  }

  return null
}

/**
 * Libellé d'un domaine. `traduits` est la table de la langue active (`L.domaine`) :
 * un nom libre, absent du catalogue, s'affiche tel qu'il a été saisi.
 */
export function libelleDomaine(domaine: string, traduits?: object): string {
  if (traduits) {
    const libelle = (traduits as Record<string, string | undefined>)[domaine]
    if (libelle) return libelle
  }
  if ((DOMAINES_CONNUS as readonly string[]).includes(domaine)) {
    return fr[cleDomaine(domaine as DomaineConnu)]
  }
  return domaine
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

/** Cases du catalogue fixe + domaines libres déjà en base (ou déjà cochés). */
export function domainesAffiches(
  inventaire: string[] = [],
  selection: string[] = [],
  traduits?: object,
): Array<[string, string]> {
  const vus = new Set<string>()
  const lignes: Array<[string, string]> = []

  const ajouter = (valeur: string) => {
    if (!valeur || valeur === 'autre' || vus.has(valeur)) return
    vus.add(valeur)
    lignes.push([valeur, libelleDomaine(valeur, traduits)])
  }

  DOMAINES_CONNUS.forEach((valeur) => ajouter(valeur))
  inventaire.forEach(ajouter)
  selection.forEach(ajouter)

  return lignes
}
