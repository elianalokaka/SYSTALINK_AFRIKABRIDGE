import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

type Variante = 'principal' | 'secondaire' | 'discret' | 'danger'
type Taille = 'sm' | 'md' | 'lg'

/**
 * RÈGLE DE COULEUR, non négociable :
 * un bouton plein porte un libellé SOMBRE (`text-accent-fg`), jamais blanc.
 * Du blanc sur #f55800 donne 3.34:1 et échoue WCAG AA. Vérifié par calcul.
 */
const VARIANTES: Record<Variante, string> = {
  principal:
    'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-press ' +
    'disabled:bg-surface-3 disabled:text-fg-disabled',
  secondaire:
    'bg-surface-2 text-fg-1 border border-border ' +
    'hover:bg-surface-3 hover:border-border-strong ' +
    'disabled:bg-surface-2 disabled:text-fg-disabled disabled:border-border-subtle',
  discret:
    'bg-transparent text-fg-2 hover:bg-surface-3 hover:text-fg-1 ' +
    'disabled:bg-transparent disabled:text-fg-disabled',
  /* Danger teinté : un aplat rouge plein serait trop bruyant pour une action
     destructive secondaire (quitter un projet). Le plein rouge exigerait de
     toute façon un libellé sombre — même règle que l'orange. */
  danger:
    'bg-danger-bg text-danger border border-danger ' +
    'hover:bg-surface-3 disabled:bg-surface-2 disabled:text-fg-disabled disabled:border-border-subtle',
}

const TAILLES: Record<Taille, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-9 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  taille?: Taille
  /** Affiche un spinner et désactive le bouton. */
  chargement?: boolean
  iconeGauche?: ReactNode
  iconeDroite?: ReactNode
  pleineLargeur?: boolean
  /** React 19 : `ref` est une prop ordinaire (pas de `forwardRef`). */
  ref?: Ref<HTMLButtonElement>
}

/**
 * Bouton du design system.
 *
 * Le focus visible n'est PAS défini ici : il est posé une seule fois sur
 * `:focus-visible` dans `index.css`. Un composant ne redéfinit jamais le focus.
 */
export function Button({
  variante = 'principal',
  taille = 'md',
  chargement = false,
  iconeGauche,
  iconeDroite,
  pleineLargeur = false,
  className,
  children,
  disabled,
  type = 'button',
  ...reste
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors',
        'disabled:cursor-not-allowed',
        TAILLES[taille],
        VARIANTES[variante],
        pleineLargeur && 'w-full',
        className
      )}
      {...reste}
    >
      {chargement ? <Spinner taille="sm" label="" /> : iconeGauche}
      {children}
      {!chargement && iconeDroite}
    </button>
  )
}
