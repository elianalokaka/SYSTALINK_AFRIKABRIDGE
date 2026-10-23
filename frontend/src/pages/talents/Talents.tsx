import { useState } from 'react'
import { Link } from 'react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, Input, SkeletonTexte } from '../../components/ui'
import { listeCompetences } from '../../api/profil'
import { rechercherTalents } from '../../api/talents'
import { PAYS } from '../../lib/constants'
import { LISTE_DOMAINES, LISTE_ROLES_PROFIL } from '../../lib/labels'
import { cn } from '../../lib/cn'
import type { Domaine, RoleProfil } from '../../types'
import { CarteTalent } from './CarteTalent'

const CLASSE_SELECT = 'h-9 w-full rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'
const PAR_PAGE = 12

/**
 * « Trouver des talents » — recherche de membres.
 *
 * Filtres du contrat, tous appliqués côté SERVEUR : `q` (nom + bio), `competence_ids`
 * (+ `competence_match` any|all, utile seulement à partir de 2 compétences),
 * `domaine`, `pays`, `region`, `role_profil`. Tout changement de filtre ramène à la page 1.
 * Le serveur exclut déjà l'utilisateur connecté des résultats.
 */
export function Talents() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<RoleProfil | ''>('')
  const [domaine, setDomaine] = useState<Domaine | ''>('')
  const [pays, setPays] = useState('')
  const [region, setRegion] = useState('')
  const [competences, setCompetences] = useState<number[]>([])
  const [match, setMatch] = useState<'any' | 'all'>('any')
  const [page, setPage] = useState(1)

  const catalogue = useQuery({ queryKey: ['skills'], queryFn: listeCompetences })

  const filtres = {
    q: q.trim() || undefined,
    role_profil: role || undefined,
    domaine: domaine || undefined,
    pays: pays || undefined,
    region: region.trim() || undefined,
    competence_ids: competences.length > 0 ? competences : undefined,
    /* `any` est le défaut du contrat ; on n'envoie `all` que s'il change quelque chose. */
    competence_match: competences.length > 1 && match === 'all' ? ('all' as const) : undefined,
    page,
    per_page: PAR_PAGE,
  }
  const requete = useQuery({
    queryKey: ['talents', filtres],
    queryFn: () => rechercherTalents(filtres),
    placeholderData: keepPreviousData,
  })

  function filtre<T>(fixer: (valeur: T) => void) {
    return (valeur: T) => {
      fixer(valeur)
      setPage(1)
    }
  }

  function basculerCompetence(id: number) {
    setCompetences((actuelles) => (actuelles.includes(id) ? actuelles.filter((c) => c !== id) : [...actuelles, id]))
    setPage(1)
  }

  const filtreActif = Boolean(q.trim() || role || domaine || pays || region.trim() || competences.length > 0)

  function reinitialiser() {
    setQ('')
    setRole('')
    setDomaine('')
    setPays('')
    setRegion('')
    setCompetences([])
    setMatch('any')
    setPage(1)
  }

  const total = requete.data?.meta.total ?? 0
  const dernierePage = requete.data?.meta.last_page ?? 1

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-fg-1">Trouver des talents</h1>
        <p className="mt-1 text-sm text-fg-2">
          {total} membre{total === 1 ? '' : 's'}
          {filtreActif ? ' correspondant à ta recherche' : ''}
        </p>
      </div>

      <Card>
        <CardCorps className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              aria-label="Rechercher un membre"
              placeholder="Nom ou bio…"
              value={q}
              onChange={(e) => filtre(setQ)(e.target.value)}
              className="sm:col-span-2 lg:col-span-4"
            />
            <select
              aria-label="Filtrer par profil"
              value={role}
              onChange={(e) => filtre(setRole)(e.target.value as RoleProfil | '')}
              className={CLASSE_SELECT}
            >
              <option value="">Tous les profils</option>
              {LISTE_ROLES_PROFIL.map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par domaine"
              value={domaine}
              onChange={(e) => filtre(setDomaine)(e.target.value as Domaine | '')}
              className={CLASSE_SELECT}
            >
              <option value="">Tous les domaines</option>
              {LISTE_DOMAINES.map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par pays"
              value={pays}
              onChange={(e) => filtre(setPays)(e.target.value)}
              className={CLASSE_SELECT}
            >
              <option value="">Tous les pays</option>
              {PAYS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.nom}
                </option>
              ))}
            </select>
            <Input
              aria-label="Filtrer par région"
              placeholder="Région ou ville…"
              value={region}
              onChange={(e) => filtre(setRegion)(e.target.value)}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-fg-2">Compétences</legend>
            <div className="flex flex-wrap gap-2">
              {(catalogue.data ?? []).map((comp) => {
                const actif = competences.includes(comp.id)
                return (
                  <button
                    key={comp.id}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => basculerCompetence(comp.id)}
                    className={cn(
                      'h-8 rounded-md border px-3 text-xs font-medium transition-colors',
                      actif
                        ? 'border-accent bg-accent-subtle text-accent'
                        : 'border-border-strong bg-surface-1 text-fg-2 hover:text-fg-1'
                    )}
                  >
                    {comp.nom}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {competences.length > 1 ? (
              <label className="flex items-center gap-2 text-sm text-fg-2">
                Doit maîtriser
                <select
                  aria-label="Correspondance des compétences"
                  value={match}
                  onChange={(e) => filtre(setMatch)(e.target.value as 'any' | 'all')}
                  className="h-9 rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1"
                >
                  <option value="any">au moins une compétence</option>
                  <option value="all">toutes les compétences</option>
                </select>
              </label>
            ) : (
              <span />
            )}
            {filtreActif && (
              <Button variante="discret" onClick={reinitialiser}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </CardCorps>
      </Card>

      {requete.isPending ? (
        <Card>
          <CardCorps>
            <SkeletonTexte lignes={5} />
          </CardCorps>
        </Card>
      ) : requete.isError && !requete.data ? (
        <Card>
          <EmptyState
            titre="Impossible de charger les talents"
            description="Vérifie ta connexion puis réessaie."
            action={
              <Button variante="secondaire" onClick={() => void requete.refetch()}>
                Réessayer
              </Button>
            }
          />
        </Card>
      ) : requete.data && requete.data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requete.data.data.map((talent) => (
              <Link key={talent.id} to={`/talents/${talent.id}`}>
                <CarteTalent talent={talent} />
              </Link>
            ))}
          </div>

          {dernierePage > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
              <Button variante="secondaire" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <span className="text-sm tabular-nums text-fg-2">
                Page {page} / {dernierePage}
              </span>
              <Button variante="secondaire" disabled={page >= dernierePage} onClick={() => setPage((p) => p + 1)}>
                Suivant
              </Button>
            </nav>
          )}
        </>
      ) : (
        <Card>
          <EmptyState
            titre="Aucun membre ne correspond"
            description="Essaie d'élargir tes critères ou de retirer une compétence."
            action={
              filtreActif ? (
                <Button variante="secondaire" onClick={reinitialiser}>
                  Réinitialiser les filtres
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}
    </div>
  )
}
