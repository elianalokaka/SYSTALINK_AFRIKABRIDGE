import { useState } from 'react'
import { Link } from 'react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, Input, SkeletonTexte } from '../../components/ui'
import { listerRessources } from '../../api/ressources'
import { listeCompetences } from '../../api/profil'
import { useSession } from '../../features/auth/SessionProvider'
import { useLibelles } from '../../lib/labels'
import type { TypeRessource } from '../../types'
import { CarteRessource } from './CarteRessource'

const CLASSE_SELECT = 'h-9 w-full rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'
const PAR_PAGE = 12

/**
 * « Bibliothèque » — les ressources publiques + celles de MES projets.
 *
 * Les filtres reflètent le contrat : `q`, `type`, `competence_ids`, `auteur_id`.
 * Ils sont appliqués côté SERVEUR. Un changement de filtre ramène à la page 1.
 */
export function Bibliotheque() {
  const L = useLibelles()
  const { profil } = useSession()
  const [q, setQ] = useState('')
  const [type, setType] = useState<TypeRessource | ''>('')
  const [competence, setCompetence] = useState('')
  const [miennes, setMiennes] = useState(false)
  const [page, setPage] = useState(1)

  const catalogue = useQuery({ queryKey: ['skills'], queryFn: listeCompetences })

  const filtres = {
    q: q.trim() || undefined,
    type: type || undefined,
    competence_ids: competence ? [Number(competence)] : undefined,
    auteur_id: miennes ? profil?.id : undefined,
    page,
    per_page: PAR_PAGE,
  }
  const requete = useQuery({
    queryKey: ['ressources', filtres],
    queryFn: () => listerRessources(filtres),
    placeholderData: keepPreviousData,
  })

  /** Tout changement de filtre repart de la page 1. */
  function filtre<T>(fixer: (valeur: T) => void) {
    return (valeur: T) => {
      fixer(valeur)
      setPage(1)
    }
  }

  const total = requete.data?.meta.total ?? 0
  const dernierePage = requete.data?.meta.last_page ?? 1

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-fg-1">Bibliothèque</h1>
          <p className="mt-1 text-sm text-fg-2">
            {total} ressource{total === 1 ? '' : 's'} partagée{total === 1 ? '' : 's'}
          </p>
        </div>
        <Link to="/ressources/nouveau">
          <Button>Partager une ressource</Button>
        </Link>
      </div>

      <Card>
        <CardCorps className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
          <Input
            aria-label="Rechercher une ressource"
            placeholder="Rechercher une ressource…"
            value={q}
            onChange={(e) => filtre(setQ)(e.target.value)}
            className="sm:col-span-2 lg:col-span-1"
          />
          <select
            aria-label="Filtrer par type"
            value={type}
            onChange={(e) => filtre(setType)(e.target.value as TypeRessource | '')}
            className={CLASSE_SELECT}
          >
            <option value="">Tous les types</option>
            {L.listeTypesRessource.map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer par compétence"
            value={competence}
            onChange={(e) => filtre(setCompetence)(e.target.value)}
            className={CLASSE_SELECT}
          >
            <option value="">Toutes les compétences</option>
            {(catalogue.data ?? []).map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.nom}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-fg-2 sm:col-span-2 lg:col-span-3">
            <input
              type="checkbox"
              checked={miennes}
              onChange={(e) => filtre(setMiennes)(e.target.checked)}
              className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
            />
            Seulement mes ressources
          </label>
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
            titre="Impossible de charger la bibliothèque"
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
            {requete.data.data.map((ressource) => (
              <Link key={ressource.id} to={`/ressources/${ressource.id}`}>
                <CarteRessource ressource={ressource} />
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
            titre="Aucune ressource ne correspond"
            description="Essaie d'élargir tes filtres, ou partage la première ressource."
            action={
              <Link to="/ressources/nouveau">
                <Button>Partager une ressource</Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  )
}
