import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BoiteConfirmation } from './BoiteConfirmation'

export interface OptionsConfirmation {
  titre: string
  description?: string
  libelleConfirmer?: string
}

/**
 * Remplace `window.confirm` sans changer la forme du code appelant :
 *
 *   const { confirmer, dialogue } = useConfirmation()
 *   async function onSupprimer() {
 *     if (!(await confirmer({ titre: 'Supprimer ce projet ?' }))) return
 *     …
 *   }
 *   return (<> … {dialogue} </>)
 *
 * `confirmer` renvoie une promesse : `true` si l'utilisateur confirme, `false`
 * s'il annule (bouton, Échap ou clic sur le fond). Le focus revient sur le
 * bouton qui avait ouvert la boîte.
 */
export function useConfirmation() {
  const [etat, setEtat] = useState<OptionsConfirmation | null>(null)
  const resoudre = useRef<((reponse: boolean) => void) | null>(null)
  const declencheur = useRef<HTMLElement | null>(null)

  const confirmer = useCallback((options: OptionsConfirmation) => {
    declencheur.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEtat(options)
    return new Promise<boolean>((resolve) => {
      resoudre.current = resolve
    })
  }, [])

  const terminer = useCallback((reponse: boolean) => {
    resoudre.current?.(reponse)
    resoudre.current = null
    setEtat(null)
    const retour = declencheur.current
    /* Après le démontage : un bouton supprimé entre-temps n'est plus dans le DOM. */
    requestAnimationFrame(() => {
      if (retour?.isConnected) retour.focus()
    })
  }, [])

  /* Démontage de la page avec une boîte ouverte : on libère l'appelant. */
  useEffect(
    () => () => {
      resoudre.current?.(false)
    },
    []
  )

  const dialogue: ReactNode = etat && (
    <BoiteConfirmation
      titre={etat.titre}
      description={etat.description}
      libelleConfirmer={etat.libelleConfirmer}
      onConfirmer={() => terminer(true)}
      onAnnuler={() => terminer(false)}
    />
  )

  return { confirmer, dialogue }
}
