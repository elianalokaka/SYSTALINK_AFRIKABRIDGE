import { useI18n, LANGUES, type Langue } from '../../i18n'
import { cn } from '../../lib/cn'

/**
 * Sélecteur de langue FR | EN.
 *
 * Deux boutons dans un groupe : celui de la langue active est `aria-pressed`. Le nom
 * accessible de chaque bouton est le NOM DE LA LANGUE DANS CETTE LANGUE (« Français »,
 * « English », avec son attribut `lang`) : il ne change pas quand on bascule, donc
 * quelqu'un qui ne lit pas l'interface retrouve toujours sa langue.
 * Style neutre : l'orange reste réservé à l'action.
 */
export function SelecteurLangue({ className }: { className?: string }) {
  const { langue, changerLangue, t } = useI18n()
  const noms: Record<Langue, string> = { fr: 'Français', en: 'English' }
  return (
    <div role="group" aria-label={t('langue.groupe')} className={cn('inline-flex rounded-md border border-border-strong p-0.5', className)}>
      {LANGUES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-label={noms[code]}
          aria-pressed={langue === code}
          onClick={() => changerLangue(code)}
          className={cn(
            'min-w-9 rounded-sm px-2 py-1 text-xs font-medium transition-colors',
            langue === code ? 'bg-surface-3 text-fg-1' : 'text-fg-2 hover:bg-surface-2 hover:text-fg-1'
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
