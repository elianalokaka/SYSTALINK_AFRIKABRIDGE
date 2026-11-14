import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, Input, SkeletonTexte } from '../../components/ui'
import { listerProjets } from '../../api/projets'
import { useLibelles } from '../../lib/labels'
import { useI18n } from '../../i18n'
import { CarteProjet } from './CarteProjet'

const CLASSE_SELECT = 'h-9 rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'

/**
 * « Explorer les projets » — la liste filtrable.
 *
 * Les filtres reflètent les paramètres du contrat : `q`, `domaine`, `statut`.
 * Le filtre est APPLIQUÉ côté serveur (le mock filtre réellement), pas côté
 * client : c'est le comportement attendu avec le vrai backend.
 */
export function Projets() {
  const { t } = useI18n()
  const L = useLibelles()
  const [q, setQ] = useState('')
  const [statut, setStatut] = useState('')
  const [domaine, setDomaine] = useState('')

  const requete = useQuery({
    queryKey: ['projets', { q, statut, domaine }],
    queryFn: () =>
      listerProjets({
        q: q.trim() || undefined,
        statut: statut || undefined,
        domaine: domaine || undefined,
      }),
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-fg-1">{t('projets.titre')}</h1>
          <p className="mt-1 text-sm text-fg-2">
            {t('projets.nombre', { count: requete.data?.meta.total ?? 0 })}
          </p>
        </div>
        <Link to="/projets/nouveau">
          <Button>{t('projets.creer')}</Button>
        </Link>
      </div>

      <Card>
        <CardCorps className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            aria-label={t('projets.rechercher')}
            placeholder={t('projets.rechercherPoints')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            aria-label={t('talents.filtrerDomaine')}
            value={domaine}
            onChange={(e) => setDomaine(e.target.value)}
            className={CLASSE_SELECT}
          >
            <option value="">{t('talents.tousDomaines')}</option>
            {L.listeDomaines.map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
          <select
            aria-label={t('projets.filtrerStatut')}
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className={CLASSE_SELECT}
          >
            <option value="">{t('projets.tousStatuts')}</option>
            <option value="recrutement">{L.statutProjet.recrutement}</option>
            <option value="en_cours">{L.statutProjet.en_cours}</option>
            <option value="termine">{L.statutProjet.termine}</option>
          </select>
        </CardCorps>
      </Card>

      {requete.isPending ? (
        <Card>
          <CardCorps>
            <SkeletonTexte lignes={5} />
          </CardCorps>
        </Card>
      ) : requete.data && requete.data.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requete.data.data.map((projet) => (
            <Link key={projet.id} to={`/projets/${projet.id}`}>
              <CarteProjet projet={projet} />
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            titre={t('projets.aucunTitre')}
            description={t('projets.aucunTexte')}
            action={
              <Link to="/projets/nouveau">
                <Button>{t('projets.creer')}</Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  )
}
