import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Fusionne des classes Tailwind en résolvant les conflits.
 *
 * POURQUOI CE FICHIER EXISTE
 *   Deux raisons, et la seconde est la vraie :
 *
 *   1. `clsx` accepte les valeurs conditionnelles (`condition && 'classe'`),
 *      ce qui évite les concaténations illisibles dans les composants.
 *
 *   2. `twMerge` RÉSOUT LES CONFLITS. Sans lui, si un composant porte `px-4`
 *      et que l'appelant passe `className="px-6"`, les DEUX classes sont
 *      présentes et c'est l'ordre du CSS généré par Tailwind qui décide —
 *      pas l'ordre dans la chaîne. Le résultat est imprévisible.
 *
 *      C'est ce qui rend la surcharge de style fiable pour l'appelant.
 *
 * USAGE
 *   cn('base', condition && 'classe', className)
 */
export function cn(...entrees: ClassValue[]): string {
  return twMerge(clsx(entrees))
}
