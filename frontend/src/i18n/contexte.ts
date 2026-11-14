import { createContext, useContext } from 'react'
import { LANGUE_PAR_DEFAUT, LOCALES, traduire, type Cle, type Langue, type Variables } from './traduire'

export interface ContexteI18n {
  langue: Langue
  /** Locale `Intl` de la langue active (`fr-FR`, `en-GB`). */
  locale: string
  changerLangue: (langue: Langue) => void
  t: (cle: Cle, variables?: Variables) => string
}

export const Contexte = createContext<ContexteI18n>({
  langue: LANGUE_PAR_DEFAUT,
  locale: LOCALES[LANGUE_PAR_DEFAUT],
  changerLangue: () => {},
  t: (cle, variables) => traduire(LANGUE_PAR_DEFAUT, cle, variables),
})

/** `const { t } = useI18n()` — à utiliser dans TOUT composant qui affiche du texte. */
export function useI18n(): ContexteI18n {
  return useContext(Contexte)
}
