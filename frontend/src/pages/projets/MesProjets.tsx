import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, SkeletonTexte, Tabs } from '../../components/ui'
import { mesProjets } from '../../api/projets'
import { useDemandesRecues } from '../../features/equipes/useDemandesRecues'
import type { RoleEquipe } from '../../types'
import { CarteProjet } from './CarteProjet'
import { useI18n } from '../../i18n'

type Filtre = 'tous' | RoleEquipe

/**
 * « Mes projets » — les projets dont je suis membre.
 *
 * Le filtre « Que je possède / Que j'ai rejoints » est le paramètre `role_equipe`
 * de `GET /me/projects`. Sur les projets que je possède, une pastille signale
 * les demandes d'adhésion EN ATTENTE : c'est l'endroit où le propriétaire voit
 * qu'une décision l'attend.
 */
export function MesProjets() {
  const { t } = useI18n()
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const requete = useQuery({
    queryKey: ['mes-projets', filtre],
    queryFn: () => mesProjets(filtre === 'tous' ? {} : { role_equipe: filtre }),
  })
  const demandesRecues = useDemandesRecues()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-fg-1">{t('mesProjets.titre')}</h1>
          <p className="mt-1 text-sm text-fg-2">
            {t('projets.nombre', { count: requete.data?.meta.total ?? 0 })}
          </p>
        </div>
        <Link to="/projets/nouveau">
          <Button>{t('projets.creer')}</Button>
        </Link>
      </div>

      <Tabs
        onglets={[
          { id: 'tous', libelle: t('mesProjets.tous') },
          { id: 'proprietaire', libelle: t('mesProjets.possede') },
          { id: 'membre', libelle: t('mesProjets.rejoints') },
        ]}
        actif={filtre}
        onChange={(id) => setFiltre(id as Filtre)}
      />

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
              <CarteProjet
                projet={projet}
                demandesEnAttente={demandesRecues.data?.parProjet[projet.id] ?? 0}
              />
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            titre={t('mesProjets.videTitre')}
            description={t('mesProjets.videTexte')}
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
