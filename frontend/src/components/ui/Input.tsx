import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Bordure rouge + `aria-invalid` — à coupler au message d'erreur du FormField. */
  invalide?: boolean
}

/**
 * Champ de saisie.
 *
 * POINT D'ACCESSIBILITÉ IMPORTANT : la bordure utilise `border-border-strong`
 * et non `border-border`. Quand la bordure est le SEUL repère qui identifie un
 * contrôle, WCAG 1.4.11 exige un contraste ≥ 3:1. `border-strong` (#6e6a64)
 * donne 3.09:1 sur une carte — `border` (#3a3833) ne donne que 1.60:1.
 *
 * Le focus visible n'est pas défini ici : il vient de `:focus-visible` posé
 * globalement dans `index.css`.
 */
export function Input({ className, invalide, ...reste }: InputProps) {
  return (
    <input
      aria-invalid={invalide || undefined}
      className={cn(
        'h-9 w-full rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1',
        'placeholder:text-fg-3',
        'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled',
        'aria-[invalid=true]:border-danger',
        className
      )}
      {...reste}
    />
  )
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalide?: boolean
}

/**
 * Zone de texte multiligne.
 * Mêmes règles que `Input` (bordure forte, focus global).
 */
export function Textarea({ className, invalide, rows = 4, ...reste }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalide || undefined}
      className={cn(
        'w-full resize-y rounded-md border border-border-strong bg-surface-1 px-3 py-2 text-sm text-fg-1',
        'placeholder:text-fg-3',
        'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled',
        'aria-[invalid=true]:border-danger',
        className
      )}
      {...reste}
    />
  )
}
