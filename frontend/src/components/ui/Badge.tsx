import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Variantes alignées sur les couleurs sémantiques des statuts du contrat API.
 * Voir `docs/ANALYSE-CONTRAT.md` §5 : « Ouvert », « En cours », « Terminé »…
 */
type Variante = 'accent' | 'succes' | 'info' | 'attente' | 'danger' | 'neutre'

const VARIANTES: Record<Variante, string> = {
  accent: 'bg-accent-subtle text-accent border-accent',
  succes: 'bg-success-bg text-success border-success',
  info: 'bg-info-bg text-info border-info',
  attente: 'bg-pending-bg text-pending border-pending',
  danger: 'bg-danger-bg text-danger border-danger',
  neutre: 'bg-neutral-bg text-neutral border-border',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variante?: Variante
  /** Icône optionnelle, placée avant le texte. */
  icone?: ReactNode
}

/**
 * Étiquette d'état.
 *
 * Rayon `rounded-sm` (4 px) : jamais de pilule — règle ferme du projet.
 *
 * ATTENTION : un badge doit TOUJOURS porter une donnée réelle.
 * Aucun badge décoratif, aucune barre sans donnée derrière (AGENTS.md § 3 bis).
 */
export function Badge({ variante = 'neutre', icone, className, children, ...reste }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        VARIANTES[variante],
        className
      )}
      {...reste}
    >
      {icone}
      {children}
    </span>
  )
}
