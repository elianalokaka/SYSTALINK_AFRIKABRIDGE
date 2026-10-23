import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface Onglet {
  id: string
  libelle: string
  /** Nombre d'éléments réels de l'onglet. Jamais décoratif. */
  compteur?: number
  icone?: ReactNode
}

export interface TabsProps {
  onglets: Onglet[]
  /** `id` de l'onglet actif. */
  actif: string
  onChange: (id: string) => void
  className?: string
  /**
   * `true` quand chaque onglet commande un panneau `role="tabpanel"` portant
   * `id="panneau-<id de l'onglet>"` et `aria-labelledby="onglet-<id>"` — relie onglet et panneau pour les lecteurs d'écran.
   * `false` (défaut) pour un simple filtre à onglets.
   */
  avecPanneaux?: boolean
}

/* Identifiants reliant un onglet à son panneau : `onglet-<id>` ↔ `panneau-<id>`. */
const idOnglet = (id: string) => `onglet-${id}`
const idPanneau = (id: string) => `panneau-${id}`

/**
 * Onglets à soulignement.
 *
 * VOLONTAIREMENT PAS DES PILULES : l'onglet actif est signalé par une barre
 * de 2 px en accent sous le libellé. C'est le motif des interfaces de
 * référence (GitHub, Supabase) et c'est cohérent avec la règle « jamais de
 * pilule » du projet.
 *
 * CLAVIER (motif ARIA « Tabs ») : une seule tabulation entre dans la liste (l'onglet actif),
 * puis ← → parcourent les onglets, Début / Fin vont au premier / dernier. Sans cela,
 * un utilisateur clavier devait tabuler sur chaque onglet et le lecteur d'écran
 * n'annonçait pas la relation onglet ↔ contenu.
 *
 * Les onglets du détail projet sont dans cet ordre : Vue, Équipe, Discussion,
 * Ressources, Demandes (voir docs/ANALYSE-CONTRAT.md § 6.2).
 */
export function Tabs({ onglets, actif, onChange, className, avecPanneaux = false }: TabsProps) {
  const liste = useRef<HTMLDivElement>(null)

  function surTouche(e: KeyboardEvent<HTMLDivElement>) {
    const index = onglets.findIndex((o) => o.id === actif)
    let cible = -1
    if (e.key === 'ArrowRight') cible = (index + 1) % onglets.length
    else if (e.key === 'ArrowLeft') cible = (index - 1 + onglets.length) % onglets.length
    else if (e.key === 'Home') cible = 0
    else if (e.key === 'End') cible = onglets.length - 1
    if (cible < 0) return
    e.preventDefault()
    onChange(onglets[cible].id)
    liste.current?.querySelectorAll<HTMLElement>('[role="tab"]')[cible]?.focus()
  }

  return (
    <div
      ref={liste}
      role="tablist"
      onKeyDown={surTouche}
      className={cn('flex items-center gap-1 overflow-x-auto border-b border-border-subtle', className)}
    >
      {onglets.map((onglet) => {
        const estActif = onglet.id === actif
        return (
          <button
            key={onglet.id}
            id={idOnglet(onglet.id)}
            type="button"
            role="tab"
            aria-selected={estActif}
            aria-controls={avecPanneaux ? idPanneau(onglet.id) : undefined}
            tabIndex={estActif ? 0 : -1}
            onClick={() => onChange(onglet.id)}
            className={cn(
              '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              estActif
                ? 'border-accent text-fg-1'
                : 'border-transparent text-fg-2 hover:border-border-strong hover:text-fg-1'
            )}
          >
            {onglet.icone}
            {onglet.libelle}
            {onglet.compteur !== undefined && (
              <span className="rounded-sm bg-surface-4 px-1.5 py-0.5 text-xs tabular-nums text-fg-2">
                {onglet.compteur}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
