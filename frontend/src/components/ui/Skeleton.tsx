import { cn } from '../../lib/cn'

export type SkeletonProps = {
  className?: string
}

/**
 * Bloc de chargement.
 *
 * Utilise la surface-3 : un cran au-dessus des cartes, visible sans être
 * criard. Aucun dégradé animé, aucune lueur — juste une pulsation sobre.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-surface-3', className)}
    />
  )
}

export interface SkeletonTexteProps {
  lignes?: number
  className?: string
}

/** Plusieurs lignes de texte factices, la dernière plus courte (naturel). */
export function SkeletonTexte({ lignes = 3, className }: SkeletonTexteProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lignes }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === lignes - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}
