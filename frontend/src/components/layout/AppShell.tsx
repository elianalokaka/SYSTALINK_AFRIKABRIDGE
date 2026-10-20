import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Avatar, Button } from '../ui'
import { useSession } from '../../features/auth/SessionProvider'
import { useDemandesRecues } from '../../features/equipes/useDemandesRecues'
import { cn } from '../../lib/cn'

/**
 * OSSATURE de l'application — le cadre commun à toutes les pages protégées.
 *
 * Elle fournit la barre supérieure (marque + navigation + utilisateur) et rend
 * les pages enfants dans un `<Outlet>`. C'est le premier élément de
 * `components/layout/` : une page ne recrée plus jamais sa propre barre.
 *
 * RESPONSIF : la navigation tient sur mobile (liens courts), le nom complet ne
 * s'affiche qu'à partir de `md`. Aucun élément ne déborde.
 */
export function AppShell() {
  const { profil, seDeconnecter } = useSession()
  const navigate = useNavigate()
  const demandesRecues = useDemandesRecues()
  const enAttente = demandesRecues.data?.total ?? 0

  async function onDeconnexion() {
    await seDeconnecter()
    navigate('/connexion', { replace: true })
  }

  const classeLien = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors',
      isActive ? 'bg-surface-3 text-fg-1' : 'text-fg-2 hover:bg-surface-2 hover:text-fg-1'
    )

  return (
    <div className="flex min-h-dvh flex-col bg-surface-0">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-1">
        {/* Mobile : marque + utilisateur sur la 1re ligne, navigation pleine largeur sur la 2e
            (sinon 5 liens se battent pour la place et la plupart sont cachés).
            À partir de md : tout tient sur une ligne. */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:px-6 md:flex-nowrap md:gap-x-6">
          <Link to="/" className="order-1 shrink-0 text-sm font-semibold text-fg-1">
            AfricaBridge
          </Link>

          <nav className="order-3 -mx-1 flex w-full items-center gap-0.5 overflow-x-auto md:order-2 md:mx-0 md:w-auto md:flex-1">
            <NavLink to="/" end className={classeLien}>
              Accueil
            </NavLink>
            <NavLink to="/projets" className={classeLien}>
              Projets
            </NavLink>
            <NavLink to="/mes-projets" className={classeLien}>
              Mes projets
              {enAttente > 0 && (
                <span
                  aria-label={`${enAttente} demande${enAttente > 1 ? 's' : ''} d'adhésion en attente`}
                  className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-accent px-1.5 text-xs font-semibold text-accent-fg"
                >
                  {enAttente}
                </span>
              )}
            </NavLink>
            <NavLink to="/mes-demandes" className={classeLien}>
              Mes demandes
            </NavLink>
            <NavLink to="/ressources" className={classeLien}>
              Bibliothèque
            </NavLink>
            <NavLink to="/profil" className={classeLien}>
              Mon profil
            </NavLink>
          </nav>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-2.5 md:order-3">
            <span className="hidden text-sm text-fg-2 md:inline">{profil?.nom}</span>
            <Avatar nom={profil?.nom ?? ''} taille="sm" />
            <Button taille="sm" variante="discret" onClick={onDeconnexion}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
