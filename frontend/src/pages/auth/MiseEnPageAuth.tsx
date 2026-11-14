import type { ReactNode } from 'react'
import { Logo } from '../../components/layout/Logo'
import { SelecteurLangue } from '../../components/layout/SelecteurLangue'
import { useI18n } from '../../i18n'

/**
 * Mise en page commune de Connexion et Inscription.
 *
 * Grand écran : deux colonnes. À gauche l'identité d'AfricaBridge (logo en grand, nom,
 * description) ; à droite le formulaire, inchangé. Petit écran : une seule colonne, le
 * logo et le nom d'abord, une phrase d'accroche, puis le formulaire. La description
 * complète n'apparaît qu'à partir de `md`, pour que le formulaire reste vite accessible
 * sur un petit téléphone.
 *
 * Le `<h1>` de la page reste celui du formulaire (« Connexion », « Créer un compte ») :
 * le nom de la marque ici est un simple paragraphe, pour ne pas avoir deux titres de niveau 1.
 */
export function MiseEnPageAuth({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <main className="min-h-dvh bg-surface-0 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto flex max-w-5xl justify-end lg:mb-2">
        <SelecteurLangue />
      </div>
      <div className="mx-auto grid min-h-[calc(100dvh-7rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <section aria-label={t('auth.presentation')} className="flex flex-col gap-4 lg:gap-6">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-6">
            <Logo className="h-12 w-12 shrink-0 text-accent sm:h-14 sm:w-14 lg:h-32 lg:w-32" />
            <p className="text-2xl font-semibold text-fg-1 sm:text-3xl lg:text-4xl">AfricaBridge</p>
          </div>
          <p className="text-sm text-fg-2 md:hidden">
            {t('auth.accroche')}
          </p>
          <div className="hidden max-w-md flex-col gap-3 text-base text-fg-2 md:flex">
            <p>{t('auth.description1')}</p>
            <p>{t('auth.description2')}</p>
          </div>
        </section>

        <div className="w-full max-w-sm justify-self-center lg:justify-self-end">{children}</div>
      </div>
    </main>
  )
}
