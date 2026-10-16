import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface EmptyStateProps {
  icone?: ReactNode
  titre: string
  description?: string
  /** Action de sortie (bouton « Créer un projet », « Réessayer »…). */
  action?: ReactNode
  className?: string
}

/**
 * État vide.
 *
 * Le contrat prévoit de nombreuses listes qui peuvent légitimement être vides
 * (résultats de recherche, demandes, ressources, portfolio). Un état vide est
 * donc un ÉTAT À PART ENTIÈRE, pas un oubli d'affichage.
 *
 * Il doit TOUJOURS proposer une suite : soit une action, soit une explication.
 * Un écran vide sans issue est une impasse.
 */
export function EmptyState({ icone, titre, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className
      )}
    >
      {icone && (
        <div className="text-fg-3" aria-hidden="true">
          {icone}
        </div>
      )}
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-sm font-medium text-fg-1">{titre}</p>
        {description && <p className="text-sm text-fg-3">{description}</p>}
      </div>
      {action}
    </div>
  )
}
