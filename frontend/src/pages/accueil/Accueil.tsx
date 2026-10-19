import { Avatar, Badge, Card, CardCorps } from '../../components/ui'
import { useSession } from '../../features/auth/SessionProvider'

/**
 * Écran d'accueil — placeholder du futur tableau de bord.
 *
 * Il vit DANS l'ossature `AppShell` (barre supérieure + navigation), donc il ne
 * recrée plus ni en-tête ni bouton de déconnexion : c'est le rôle de l'ossature.
 *
 * Le vrai tableau de bord arrive avec `feat/dashboard` (module 8) — et son
 * repli P0 est déjà documenté dans le contrat.
 */
export function Accueil() {
  const { profil } = useSession()

  return (
    <Card>
      <CardCorps className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar nom={profil?.nom ?? ''} taille="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-fg-1">Bienvenue, {profil?.nom}</h1>
            <p className="truncate text-sm text-fg-2">{profil?.email}</p>
          </div>
        </div>

        <p className="text-sm text-fg-2">
          Ta session est ouverte. Complète ton profil pour apparaître dans les recherches de talents.
        </p>

        <div>
          <Badge variante="info">Session active</Badge>
        </div>
      </CardCorps>
    </Card>
  )
}
