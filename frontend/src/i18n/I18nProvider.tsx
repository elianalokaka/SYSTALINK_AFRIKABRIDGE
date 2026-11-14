import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Contexte } from './contexte'
import { LANGUES, LANGUE_PAR_DEFAUT, LOCALES, traduire, type Langue } from './traduire'

const CLE_STOCKAGE = 'africabridge_langue'

function langueMemorisee(): Langue {
  try {
    const valeur = window.localStorage.getItem(CLE_STOCKAGE)
    return LANGUES.find((l) => l === valeur) ?? LANGUE_PAR_DEFAUT
  } catch {
    return LANGUE_PAR_DEFAUT
  }
}

/**
 * Langue de l'interface : français par défaut, mémorisée dans le navigateur.
 * Aucune requête réseau : la langue est purement une affaire d'affichage du front.
 * Elle met aussi à jour `<html lang>` (lecteurs d'écran, correcteur orthographique).
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(langueMemorisee)

  useEffect(() => {
    document.documentElement.lang = langue
  }, [langue])

  const changerLangue = useCallback((nouvelle: Langue) => {
    setLangue(nouvelle)
    try {
      window.localStorage.setItem(CLE_STOCKAGE, nouvelle)
    } catch {
      /* stockage indisponible (navigation privée) : la langue vaut pour la session */
    }
  }, [])

  const valeur = useMemo(
    () => ({
      langue,
      locale: LOCALES[langue],
      changerLangue,
      t: (cle: Parameters<typeof traduire>[1], variables?: Parameters<typeof traduire>[2]) =>
        traduire(langue, cle, variables),
    }),
    [langue, changerLangue]
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}
