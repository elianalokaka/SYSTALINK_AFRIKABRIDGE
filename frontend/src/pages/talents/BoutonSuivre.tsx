import { useState } from 'react'
import { Button } from '../../components/ui'
import { useSession } from '../../features/auth/SessionProvider'
import { useSuivi } from '../../features/suivi/useSuivi'
import { messageErreur } from '../../api/erreurs'
import { estLivre } from '../../lib/priorites'
import { useI18n } from '../../i18n'

/**
 * Bouton « Suivre / Suivi » (P1 — `POST` / `DELETE /users/{id}/follow`).
 *
 * - Rien n'est rendu si le suivi n'est pas livré (`priorites.follow`) ni sur
 *   MON propre profil : le contrat interdit de se suivre soi-même (422).
 * - Bouton à bascule : le nom accessible reste « Suivre <nom> » et c'est
 *   `aria-pressed` qui porte l'état (changer le libellé EN PLUS d'`aria-pressed`
 *   serait annoncé deux fois à l'envers par les lecteurs d'écran).
 * - Orange = ACTION : « Suivre » est une action (plein) ; « Suivi » est un état
 *   (secondaire).
 * - Mise à jour optimiste (cf. `useSuivi`) ; les clics sont ignorés pendant
 *   l'appel, sans désactiver le bouton (pas de clignotement).
 * - Le résultat est annoncé aux lecteurs d'écran (région `status`) ; en cas d'échec,
 *   l'état d'avant est restauré et le message d'erreur s'affiche (`alert`).
 */
export function BoutonSuivre({
  membre,
  taille = 'sm',
}: {
  membre: { id: number; nom: string; is_following: boolean }
  taille?: 'sm' | 'md'
}) {
  const { t } = useI18n()
  const { profil: moi } = useSession()
  const { enCours, erreur, basculer } = useSuivi(membre.id)
  const [annonce, setAnnonce] = useState('')

  if (!estLivre('follow') || !moi || moi.id === membre.id) return null

  const suivi = membre.is_following

  function onClick() {
    if (enCours) return
    const veutSuivre = !suivi
    setAnnonce('')
    basculer(veutSuivre)
    setAnnonce(t(veutSuivre ? 'suivre.tuSuis' : 'suivre.tuNeSuisPlus', { nom: membre.nom }))
  }

  return (
    <>
      <Button
        taille={taille}
        variante={suivi ? 'secondaire' : 'principal'}
        aria-pressed={suivi}
        aria-label={t('suivre.nom', { nom: membre.nom })}
        aria-busy={enCours || undefined}
        onClick={onClick}
      >
        {suivi ? t('suivre.suivi') : t('suivre.suivre')}
      </Button>
      <span role="status" className="sr-only">
        {annonce}
      </span>
      {erreur && (
        <span role="alert" className="text-xs text-danger">
          {messageErreur(erreur, { 404: t('suivre.membreDisparu') })}
        </span>
      )}
    </>
  )
}
