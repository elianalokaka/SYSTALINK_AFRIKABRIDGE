import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { PAYS, type Pays } from './constants'

/**
 * Nom d'un pays dans la langue de l'interface, à partir de son code ISO 3166-1 alpha-2
 * (le seul identifiant que le contrat échange). `Intl.DisplayNames` fait la traduction ;
 * repli sur le nom français figé de `constants.ts` si le navigateur ne la fournit pas.
 */
/** Usages courants préférés aux noms officiels d'Intl (« Congo-Kinshasa »). */
const USAGE: Record<string, Record<string, string>> = { CD: { fr: 'RD Congo', en: 'DR Congo' } }

export function nomDePaysLocalise(code: string, locale: string): string {
  const usage = USAGE[code]?.[locale.slice(0, 2)]
  if (usage) return usage
  try {
    const nom = new Intl.DisplayNames([locale], { type: 'region' }).of(code)
    if (nom && nom !== code) return nom
  } catch {
    /* navigateur sans Intl.DisplayNames : repli ci-dessous */
  }
  return PAYS.find((p) => p.code === code)?.nom ?? code
}

/** Même liste que `PAYS`, noms traduits et triés alphabétiquement dans la langue active. */
export function useNomsDePays(): Pays[] {
  const { locale } = useI18n()
  return useMemo(
    () =>
      PAYS.map((p) => ({ code: p.code, nom: nomDePaysLocalise(p.code, locale) })).sort((a, b) =>
        a.nom.localeCompare(b.nom, locale)
      ),
    [locale]
  )
}

/** `const nomPays = useNomDePays(); nomPays('SN')` — pour afficher un pays isolé. */
export function useNomDePays(): (code: string) => string {
  const { locale } = useI18n()
  return (code) => nomDePaysLocalise(code, locale)
}
