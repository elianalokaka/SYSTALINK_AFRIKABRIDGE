/**
 * Kit de composants AfricaBridge — point d'entrée unique.
 *
 * Les pages importent depuis `@/components/ui` et jamais depuis un fichier
 * interne : cela permet de déplacer ou de renommer un composant sans toucher
 * aux appelants.
 *
 * RÈGLE : ces primitives sont SANS DOMAINE. Aucune ne connaît « projet »,
 * « talent » ou « message ». Dès qu'un composant parle le langage du métier,
 * il appartient à son module, pas à ce kit.
 */

export { Avatar, initiales } from './Avatar'
export { Badge } from './Badge'
export { Button } from './Button'
export { Card, CardCorps, CardEntete } from './Card'
export { EmptyState } from './EmptyState'
export { FormField } from './FormField'
export { Input, Textarea } from './Input'
export { ProgressBar } from './ProgressBar'
export { Skeleton, SkeletonTexte } from './Skeleton'
export { Spinner } from './Spinner'
export { Tabs } from './Tabs'

export type { AvatarProps } from './Avatar'
export type { BadgeProps } from './Badge'
export type { ButtonProps } from './Button'
export type { CardCorpsProps, CardEnteteProps, CardProps } from './Card'
export type { EmptyStateProps } from './EmptyState'
export type { FormFieldProps } from './FormField'
export type { InputProps, TextareaProps } from './Input'
export type { ProgressBarProps } from './ProgressBar'
export type { SkeletonProps, SkeletonTexteProps } from './Skeleton'
export type { SpinnerProps } from './Spinner'
export type { Onglet, TabsProps } from './Tabs'
