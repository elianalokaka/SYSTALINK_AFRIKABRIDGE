import { cn } from '../../lib/cn'

type Taille = 'sm' | 'md' | 'lg'

const TAILLES: Record<Taille, string> = {
  sm: 'h-3 w-3 border',
  md: 'h-4 w-4 border-2',
  lg: 'h-5 w-5 border-2',
}

export interface SpinnerProps {
  /** Taille visuelle. `md` convient à un bouton standard. */
  taille?: Taille
  /** Texte lu par les lecteurs d'écran. */
  label?: string
  className?: string
}

/**
 * Indicateur de chargement.
 *
 * `border-current` : le spinner prend la couleur du texte de son parent.
 * C'est volontaire — sur un bouton primaire il devient sombre (accent-fg),
 * sur un bouton secondaire il devient clair. Aucune couleur en dur.
 */
export function Spinner({ taille = 'md', label = 'Chargement…', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent',
        TAILLES[taille],
        className
      )}
    />
  )
}
