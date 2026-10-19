import { useNavigate } from 'react-router'
import { Avatar, Badge, Button, Card, CardCorps } from '../../components/ui'
import { useSession } from '../../features/auth/SessionProvider'

/**
 * Écran d'accueil — placeholder du futur tableau de bord.
 *
 * Son but est modeste : prouver que la session TIENT (le nom s'affiche, la
 * déconnexion fonctionne, la route protégée est bien gardée). Le vrai tableau
 * de bord arrive avec `feat/dashboard` (module 8) — et son repli P0 est déjà
 * documenté dans le contrat.
 *
 * RESPONSIF : l'en-tête garde l'avatar sur mobile et masque le nom, faute de
 * place. Le contenu s'adapte à la largeur sans jamais déborder.
 */
export function Accueil() {
  const { profil, seDeconnecter } = useSession()
  const navigate = useNavigate()

  async function onDeconnexion() {
    await seDeconnecter()
    navigate('/connexion', { replace: true })
  }

  return (
    <main className="min-h-dvh bg-surface-0">
      <header className="border-b border-border-subtle bg-surface-1">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold text-fg-1">AfricaBridge</span>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-fg-2 sm:inline">{profil?.nom}</span>
            <Avatar nom={profil?.nom ?? ''} taille="sm" />
            <Button taille="sm" variante="discret" onClick={onDeconnexion}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Card>
          <CardCorps className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar nom={profil?.nom ?? ''} taille="lg" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-fg-1">
                  Bienvenue, {profil?.nom}
                </h1>
                <p className="truncate text-sm text-fg-2">{profil?.email}</p>
              </div>
            </div>

            <p className="text-sm text-fg-2">
              Ta session est ouverte. Le tableau de bord et les modules suivants arrivent bientôt.
            </p>

            <div>
              <Badge variante="info">Session active</Badge>
            </div>
          </CardCorps>
        </Card>
      </div>
    </main>
  )
}
