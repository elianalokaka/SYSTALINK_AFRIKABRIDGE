import type { ReactNode } from 'react'
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
}

/**
 * Onglets à soulignement.
 *
 * VOLONTAIREMENT PAS DES PILULES : l'onglet actif est signalé par une barre
 * de 2 px en accent sous le libellé. C'est le motif des interfaces de
 * référence (GitHub, Supabase) et c'est cohérent avec la règle « jamais de
 * pilule » du projet.
 *
 * Les onglets du détail projet sont dans cet ordre : Vue, Équipe, Discussion,
 * Ressources, Demandes (voir docs/ANALYSE-CONTRAT.md § 6.2).
 */
export function Tabs({ onglets, actif, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1 overflow-x-auto border-b border-border-subtle', className)}
    >
      {onglets.map((onglet) => {
        const estActif = onglet.id === actif
        return (
          <button
            key={onglet.id}
            type="button"
            role="tab"
            aria-selected={estActif}
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
