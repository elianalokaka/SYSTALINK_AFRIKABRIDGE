import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'

export interface BoiteConfirmationProps {
  titre: string
  description?: string
  /** Libellé du bouton d'action. Verbe explicite : « Supprimer », jamais « OK ». */
  libelleConfirmer?: string
  onConfirmer: () => void
  onAnnuler: () => void
}

/**
 * Boîte de confirmation d'une action destructive — remplace `window.confirm`.
 *
 * Elle s'appuie sur l'élément natif `<dialog>` ouvert avec `showModal()`, qui
 * apporte gratuitement ce qu'une boîte maison doit réimplémenter :
 *  - le reste de la page devient inerte (focus piégé dans la boîte) ;
 *  - Échap ferme (relayé à `onAnnuler`) ;
 *  - un lecteur d'écran l'annonce comme une boîte de dialogue modale.
 *
 * Le focus initial est sur « Annuler » : l'action destructive n'est jamais
 * déclenchée par un simple Entrée réflexe. Un clic sur le fond équivaut à Annuler.
 *
 * Se monte à l'ouverture et se démonte à la fermeture : voir `useConfirmation`.
 */
export function BoiteConfirmation({
  titre,
  description,
  libelleConfirmer = 'Supprimer',
  onConfirmer,
  onAnnuler,
}: BoiteConfirmationProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const refAnnuler = useRef<HTMLButtonElement>(null)
  const idTitre = useId()
  const idDescription = useId()

  useEffect(() => {
    const boite = ref.current
    if (boite && !boite.open) boite.showModal()
    refAnnuler.current?.focus()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitre}
      aria-describedby={description ? idDescription : undefined}
      onCancel={(e) => {
        /* Échap : on laisse l'appelant décider (il démonte la boîte). */
        e.preventDefault()
        onAnnuler()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onAnnuler()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-surface-1 p-0 text-fg-1 backdrop:bg-black/70"
    >
      <div className="flex flex-col gap-2 p-5">
        <h2 id={idTitre} className="text-base font-semibold text-fg-1">
          {titre}
        </h2>
        {description && (
          <p id={idDescription} className="text-sm text-fg-2">
            {description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button ref={refAnnuler} variante="secondaire" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button variante="danger" onClick={onConfirmer}>
            {libelleConfirmer}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
