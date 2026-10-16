import { cn } from '../../lib/cn'

type Taille = 'sm' | 'md' | 'lg'

const TAILLES: Record<Taille, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

export interface AvatarProps {
  /** Nom complet — sert à produire les initiales de repli. */
  nom: string
  /**
   * `UtilisateurResume.photo_url` est NULLABLE dans le contrat : une photo
   * absente est un cas normal, pas une anomalie. D'où le repli sur initiales.
   */
  photoUrl?: string | null
  taille?: Taille
  className?: string
}

/** « Aminata Diallo » -> « AD » · « Eliana » -> « EL » */
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (mots.length === 0) return '?'
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase()
  return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase()
}

/**
 * Avatar circulaire.
 *
 * Le cercle est la SEULE exception à la règle « jamais de pilule » : c'est la
 * convention universelle pour un visage, et l'image est carrée à la source.
 * Aucun bouton, aucun badge n'est circulaire dans ce projet.
 */
export function Avatar({ nom, photoUrl, taille = 'md', className }: AvatarProps) {
  const base = cn(
    'shrink-0 overflow-hidden rounded-full border border-border-subtle',
    TAILLES[taille],
    className
  )

  if (photoUrl) {
    return (
      // alt vide volontaire : le nom est affiché à côté par l'appelant.
      // Éviter de doubler l'information pour les lecteurs d'écran.
      <img src={photoUrl} alt="" className={cn(base, 'object-cover')} />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(base, 'flex items-center justify-center bg-surface-4 font-medium text-fg-2 select-none')}
    >
      {initiales(nom)}
    </span>
  )
}
