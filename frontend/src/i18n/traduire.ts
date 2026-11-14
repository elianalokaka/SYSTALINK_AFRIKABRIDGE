import { en } from './en'
import { fr } from './fr'

export type Langue = 'fr' | 'en'
export const LANGUES: readonly Langue[] = ['fr', 'en']
export const LANGUE_PAR_DEFAUT: Langue = 'fr'

type CleBrute = keyof typeof fr
type SansSuffixe<K> = K extends `${infer B}_one` ? B : K extends `${infer B}_other` ? B : K
/** Clé utilisable avec `t()` : les clés plurielles s'écrivent sans leur suffixe. */
export type Cle = SansSuffixe<CleBrute>
export type Variables = Record<string, string | number>

const DICTIONNAIRES: Record<Langue, Record<string, string>> = { fr, en }

/** Locale complète pour `Intl` / `toLocale…String` (dates, heures). */
export const LOCALES: Record<Langue, string> = { fr: 'fr-FR', en: 'en-GB' }

/**
 * Traduit une clé. Fonction pure : testable sans React.
 *  - `count` numérique → choisit `<cle>_one` / `<cle>_other` selon les règles de la langue
 *    (`Intl.PluralRules`) ;
 *  - `{variable}` remplacées ;
 *  - clé absente dans la langue → repli sur le français, puis sur la clé elle-même
 *    (visible en développement, jamais un écran vide).
 */
export function traduire(langue: Langue, cle: Cle, variables?: Variables): string {
  const dico = DICTIONNAIRES[langue]
  let brut: string | undefined
  if (variables && typeof variables.count === 'number') {
    const categorie = new Intl.PluralRules(LOCALES[langue]).select(variables.count)
    brut = dico[`${cle}_${categorie}`] ?? dico[`${cle}_other`]
  }
  brut ??= dico[cle] ?? DICTIONNAIRES.fr[cle] ?? cle
  return variables ? brut.replace(/\{(\w+)\}/g, (m, nom: string) => String(variables[nom] ?? m)) : brut
}

let langueCourante: Langue = LANGUE_PAR_DEFAUT
/** Langue active pour le code HORS React (messages d'erreur du client HTTP) ; tenue à jour par `I18nProvider`. */
export function definirLangueCourante(langue: Langue): void {
  langueCourante = langue
}
export const traduireCourant = (cle: Cle, variables?: Variables): string => traduire(langueCourante, cle, variables)
