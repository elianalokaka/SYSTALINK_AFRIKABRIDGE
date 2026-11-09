import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

/**
 * Surface de contenu : cartes, panneaux, listes.
 *
 * Pas d'ombre portée — jamais. La hiérarchie vient de la surface plus claire
 * (surface-2) et d'1 px de bordure. C'est la règle du projet et c'est ce qui
 * distingue un outil de développeur d'un template SaaS.
 */
export function Card({ className, children, ...reste }: CardProps) {
  return (
    <div className={cn('rounded-md border border-border-subtle bg-surface-2', className)} {...reste}>
      {children}
    </div>
  )
}

export interface CardEnteteProps {
  titre: ReactNode
  /** Nombre d'éléments réels. Jamais un chiffre décoratif. */
  compteur?: number
  /** Zone d'action alignée à droite (bouton, filtre…). */
  action?: ReactNode
  className?: string
}

/**
 * En-tête de carte : titre + compteur optionnel + action optionnelle.
 * Le compteur reprend le motif des interfaces de référence (titre de section
 * suivi de son nombre d'éléments).
 */
export function CardEntete({ titre, compteur, action, className }: CardEnteteProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-sm font-semibold text-fg-1">{titre}</h2>
        {compteur !== undefined && (
          <span className="shrink-0 rounded-sm bg-surface-4 px-1.5 py-0.5 text-xs tabular-nums text-fg-2">
            {compteur}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

export type CardCorpsProps = HTMLAttributes<HTMLDivElement>

export function CardCorps({ className, children, ...reste }: CardCorpsProps) {
  return (
    <div className={cn('p-4', className)} {...reste}>
      {children}
    </div>
  )
}
