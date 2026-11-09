import { cn } from '../../lib/cn'

export interface ProgressBarProps {
  /** Valeur 0-100. Correspond à `ProjetResume.progression` du contrat. */
  valeur: number
  /** Affiche le pourcentage à droite. */
  afficherValeur?: boolean
  label?: string
  className?: string
}

/**
 * Barre de progression.
 *
 * Elle porte TOUJOURS une donnée réelle (`progression` d'un projet, 0-100).
 * Une barre décorative est interdite par le projet.
 *
 * COULEUR : l'accent. La progression n'est ni un ÉTAT (ces couleurs ont leur
 * propre échelle : succès / info / attente / danger) ni une action — c'est une
 * MESURE. La barre est fine (6 px), donc la surface occupée reste inférieure
 * à 3 % de l'écran : le budget « accent < 5 % » est respecté.
 *
 * `style={{ width }}` est le seul endroit du projet où une valeur dynamique
 * passe par un style en ligne : Tailwind ne peut pas générer une largeur
 * inconnue à la compilation.
 */
export function ProgressBar({
  valeur,
  afficherValeur = true,
  label = 'Progression',
  className,
}: ProgressBarProps) {
  const borne = Math.min(100, Math.max(0, valeur))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={borne}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface-4"
      >
        <div className="h-full rounded-sm bg-accent" style={{ width: `${borne}%` }} />
      </div>
      {afficherValeur && (
        <span className="shrink-0 text-xs tabular-nums text-fg-2">{borne} %</span>
      )}
    </div>
  )
}
