import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router'

const NOM_SITE = 'AfricaBridge'

/** Titre de l'onglet : « Titre de la page · AfricaBridge » (WCAG 2.4.2). */
export function titreDocument(titre: string | null | undefined): string {
  return titre ? `${titre} · ${NOM_SITE}` : NOM_SITE
}

/**
 * Dans une application monopage, changer de route ne recharge rien : sans aide,
 * le titre de l'onglet reste figé, le lecteur d'écran n'est pas prévenu et le clavier
 * reste planté sur le lien cliqué, en bas de la page précédente.
 *
 * À chaque changement de route :
 *   1. le titre du document suit le `<h1>` de la page (y compris quand celui-ci arrive
 *      après le chargement des données : « Smart Agriculture RDC ») ;
 *   2. la page repart du haut ;
 *   3. le focus passe au contenu principal (sauf au tout premier affichage).
 */
export function useSuiviDeRoute(principal: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation()
  const premier = useRef(true)

  useEffect(() => {
    const zone = principal.current
    if (!zone) return

    const majTitre = () => {
      document.title = titreDocument(zone.querySelector('h1')?.textContent?.trim())
    }
    majTitre()
    const observateur = new MutationObserver(majTitre)
    observateur.observe(zone, { childList: true, subtree: true, characterData: true })

    if (premier.current) {
      premier.current = false
    } else {
      window.scrollTo(0, 0)
      zone.focus({ preventScroll: true })
    }
    return () => observateur.disconnect()
  }, [pathname, principal])
}

/** Titre fixe pour les pages hors ossature (connexion, inscription). */
export function useTitreDocument(titre: string): void {
  useEffect(() => {
    document.title = titreDocument(titre)
  }, [titre])
}
