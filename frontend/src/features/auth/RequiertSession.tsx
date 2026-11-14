import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Spinner } from '../../components/ui'
import { useSession } from './SessionProvider'
import { useI18n } from '../../i18n'

/**
 * Garde de route : exige une session ouverte.
 *
 * Trois états, tous gérés :
 *   1. chargement de la session → un indicateur plein écran ;
 *   2. pas de session → redirection vers `/connexion` ;
 *   3. session ouverte → rend les enfants.
 *
 * C'est la contrepartie front de la règle du contrat « tout passe par le
 * compte ». Elle ne remplace pas la sécurité serveur (Policy Laravel) : elle
 * évite seulement d'afficher un écran qui échouerait en 401.
 */
export function RequiertSession({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const { profil, chargement } = useSession()

  if (chargement) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface-0">
        <Spinner taille="lg" label={t('session.chargement')} />
      </main>
    )
  }

  if (!profil) {
    return <Navigate to="/connexion" replace />
  }

  return <>{children}</>
}
