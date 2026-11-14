import { Logo } from './Logo'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Avatar, Button } from '../ui'
import { useSession } from '../../features/auth/SessionProvider'
import { useDemandesRecues } from '../../features/equipes/useDemandesRecues'
import { cn } from '../../lib/cn'
import { useSuiviDeRoute } from './useSuiviDeRoute'

/**
 * OSSATURE de l'application — le cadre commun à toutes les pages protégées.
 *
 * Elle fournit la barre supérieure (marque + navigation + utilisateur) et rend
 * les pages enfants dans un `<Outlet>`. Une page ne recrée jamais sa propre barre.
 *
 * RESPONSIVE (jamais de défilement horizontal dans la barre) :
 *   - à partir de `lg` (1024 px) : une seule ligne, tous les liens visibles d'emblée ;
 *   - en dessous : marque + bouton « menu » ; le menu se déroule en liste verticale
 *     (liens + utilisateur + déconnexion) et se referme au choix d'un lien, à
 *     `Échap`, ou en repassant en grand écran.
 * La pastille de demandes en attente reste visible même menu fermé.
 */

const LIENS = [
  { to: '/', libelle: 'Accueil', end: true },
  { to: '/projets', libelle: 'Projets' },
  { to: '/mes-projets', libelle: 'Mes projets', pastille: true },
  { to: '/mes-demandes', libelle: 'Mes demandes' },
  { to: '/ressources', libelle: 'Bibliothèque' },
  { to: '/talents', libelle: 'Talents' },
  { to: '/profil', libelle: 'Mon profil' },
] as const

function IconeMenu({ ouvert }: { ouvert: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {ouvert ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  )
}

export function AppShell() {
  const { profil, seDeconnecter } = useSession()
  const navigate = useNavigate()
  const demandesRecues = useDemandesRecues()
  const enAttente = demandesRecues.data?.total ?? 0
  const [menuOuvert, setMenuOuvert] = useState(false)
  const principal = useRef<HTMLElement>(null)
  useSuiviDeRoute(principal)

  /* Choisir un lien referme le menu ; Échap aussi ; passer en grand écran aussi. */
  useEffect(() => {
    if (!menuOuvert) return
    const surTouche = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOuvert(false)
    const grandEcran = window.matchMedia('(min-width: 1024px)')
    const surTaille = () => grandEcran.matches && setMenuOuvert(false)
    window.addEventListener('keydown', surTouche)
    grandEcran.addEventListener('change', surTaille)
    return () => {
      window.removeEventListener('keydown', surTouche)
      grandEcran.removeEventListener('change', surTaille)
    }
  }, [menuOuvert])

  async function onDeconnexion() {
    await seDeconnecter()
    navigate('/connexion', { replace: true })
  }

  const libellePastille = `${enAttente} demande${enAttente > 1 ? 's' : ''} d'adhésion en attente`
  const pastille = (
    <span
      aria-label={libellePastille}
      className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-accent px-1.5 text-xs font-semibold text-accent-fg"
    >
      {enAttente}
    </span>
  )

  const classeLien = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors lg:px-2.5 lg:py-1.5',
      isActive ? 'bg-surface-3 text-fg-1' : 'text-fg-2 hover:bg-surface-2 hover:text-fg-1'
    )

  const liens = LIENS.map((lien) => (
    <NavLink key={lien.to} to={lien.to} end={'end' in lien} className={classeLien} onClick={() => setMenuOuvert(false)}>
      {lien.libelle}
      {'pastille' in lien && enAttente > 0 && pastille}
    </NavLink>
  ))

  return (
    <div className="flex min-h-dvh flex-col bg-surface-0">
      {/* Premier élément focalisable : visible seulement au clavier (WCAG 2.4.1). */}
      <a
        href="#contenu"
        onClick={(e) => {
          e.preventDefault()
          principal.current?.focus()
        }}
        className="sr-only z-20 rounded-md border border-border-strong bg-surface-3 text-sm text-fg-1 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-1">
        <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-4 py-2.5 sm:px-6 lg:gap-x-6">
          <Link to="/" className="inline-flex shrink-0 items-center gap-2 py-2 text-sm font-semibold text-fg-1">
            <Logo className="h-7 w-7 shrink-0 text-accent" />
            AfricaBridge
          </Link>

          {/* Grand écran : tous les liens sur la ligne, sans défilement. */}
          <nav aria-label="Navigation principale" className="hidden flex-1 items-center gap-0.5 lg:flex">
            {liens}
          </nav>

          <div className="hidden shrink-0 items-center gap-2.5 lg:ml-auto lg:flex">
            <span className="hidden max-w-40 truncate text-sm text-fg-2 xl:inline">{profil?.nom}</span>
            <Avatar nom={profil?.nom ?? ''} taille="sm" />
            <Button taille="sm" variante="discret" onClick={onDeconnexion}>
              Déconnexion
            </Button>
          </div>

          {/* Petit écran : bouton menu (+ pastille d'alerte même menu fermé). */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {enAttente > 0 && !menuOuvert && (
              <span aria-label={libellePastille} className="inline-flex min-w-5 items-center justify-center rounded-md bg-accent px-1.5 text-xs font-semibold text-accent-fg">
                {enAttente}
              </span>
            )}
            <button
              type="button"
              aria-expanded={menuOuvert}
              aria-controls="menu-mobile"
              aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMenuOuvert((o) => !o)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-strong text-fg-1 transition-colors hover:bg-surface-2"
            >
              <IconeMenu ouvert={menuOuvert} />
            </button>
          </div>
        </div>

        {/* Menu déroulant : la hauteur s'anime de 0 à auto (grid-rows), `inert` quand fermé. */}
        <div
          id="menu-mobile"
          inert={!menuOuvert}
          className={cn(
            'grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none lg:hidden',
            menuOuvert ? 'grid-rows-[1fr] border-t border-border-subtle' : 'invisible grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:px-6">
              <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
                {liens}
              </nav>
              <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar nom={profil?.nom ?? ''} taille="sm" />
                  <span className="truncate text-sm text-fg-2">{profil?.nom}</span>
                </div>
                <Button taille="sm" variante="secondaire" onClick={onDeconnexion}>
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="contenu" ref={principal} tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
