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
import { useI18n } from '../../i18n'
import { useNomCompetence } from '../../lib/competences'

const CLASSE_SELECT = 'h-9 w-full rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'
const PAR_PAGE = 12

/**
 * « Bibliothèque » — les ressources publiques + celles de MES projets.
 *
 * Les filtres reflètent le contrat : `q`, `type`, `competence_ids`, `auteur_id`.
 * Ils sont appliqués côté SERVEUR. Un changement de filtre ramène à la page 1.
 */
export function Bibliotheque() {
  const { t } = useI18n()
  const L = useLibelles()
  const nomComp = useNomCompetence()
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
          <h1 className="text-lg font-semibold text-fg-1">{t('biblio.titre')}</h1>
          <p className="mt-1 text-sm text-fg-2">
            {t('biblio.compte', { count: total })}
          </p>
        </div>
        <Link to="/ressources/nouveau">
          <Button>{t('biblio.partager')}</Button>
        </Link>
      </div>

      <Card>
        <CardCorps className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
          <Input
            aria-label={t('biblio.rechercher')}
            placeholder={t('biblio.rechercherPoints')}
            value={q}
            onChange={(e) => filtre(setQ)(e.target.value)}
            className="sm:col-span-2 lg:col-span-1"
          />
          <select
            aria-label={t('biblio.filtrerType')}
            value={type}
            onChange={(e) => filtre(setType)(e.target.value as TypeRessource | '')}
            className={CLASSE_SELECT}
          >
            <option value="">{t('biblio.tousTypes')}</option>
            {L.listeTypesRessource.map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
          <select
            aria-label={t('biblio.filtrerCompetence')}
            value={competence}
            onChange={(e) => filtre(setCompetence)(e.target.value)}
            className={CLASSE_SELECT}
          >
            <option value="">{t('biblio.toutesCompetences')}</option>
            {(catalogue.data ?? []).map((comp) => (
              <option key={comp.id} value={comp.id}>
                {nomComp(comp.nom)}
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
            {t('biblio.miennes')}
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
            titre={t('biblio.chargementImpossible')}
            description={t('commun.verifierConnexion')}
            action={
              <Button variante="secondaire" onClick={() => void requete.refetch()}>
                {t('commun.reessayer')}
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
            <nav aria-label={t('commun.pagination')} className="flex items-center justify-between gap-3">
              <Button variante="secondaire" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('commun.precedent')}
              </Button>
              <span className="text-sm tabular-nums text-fg-2">
                {t('commun.page', { page, total: dernierePage })}
              </span>
              <Button variante="secondaire" disabled={page >= dernierePage} onClick={() => setPage((p) => p + 1)}>
                {t('commun.suivant')}
              </Button>
            </nav>
          )}
        </>
      ) : (
        <Card>
          <EmptyState
            titre={t('biblio.aucuneTitre')}
            description={t('biblio.aucuneTexte')}
            action={
              <Link to="/ressources/nouveau">
                <Button>{t('biblio.partager')}</Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  )
}
