import { useState } from 'react'
import { useI18n } from '../../i18n'
import { cn } from '../../lib/cn'
import { Input, type InputProps } from './Input'

export interface ChampMotDePasseProps extends Omit<InputProps, 'type'> {
  /** Nom accessible du bouton, CONSTANT (c'est `aria-pressed` qui porte l'état). */
  nomBascule?: string
}

/**
 * Champ de mot de passe avec bouton « Afficher / Masquer ».
 *
 * Le bouton est un vrai `<button type="button">` (jamais un envoi de formulaire),
 * atteignable au clavier juste après le champ. Son nom accessible ne change pas :
 * l'état est annoncé par `aria-pressed`, pas par un nom qui bascule.
 * Le champ reste `autoComplete`-compatible : on ne change que le `type`.
 */
export function ChampMotDePasse({
  className,
  nomBascule,
  ...reste
}: ChampMotDePasseProps) {
  const { t } = useI18n()
  const nom = nomBascule ?? t('mdp.afficher')
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...reste} type={visible ? 'text' : 'password'} className={cn('pr-24', className)} />
      <button
        type="button"
        aria-label={nom}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 rounded-md px-3 text-xs font-medium text-fg-2 hover:text-fg-1"
      >
        {visible ? t('commun.masquer') : t('commun.afficher')}
      </button>
    </div>
  )
}
