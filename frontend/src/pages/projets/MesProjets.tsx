import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, SkeletonTexte } from '../../components/ui'
import { mesProjets } from '../../api/projets'
import { CarteProjet } from './CarteProjet'

/**
 * « Mes projets » — les projets dont je suis membre.
 *
 * Le contrat (`GET /me/projects`) accepte un filtre `role_equipe`, mais le
 * concept de rôle d'équipe arrive avec le module équipes : ici on liste tout.
 */
export function MesProjets() {
  const requete = useQuery({ queryKey: ['mes-projets'], queryFn: mesProjets })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-fg-1">Mes projets</h1>
          <p className="mt-1 text-sm text-fg-2">
            {requete.data?.meta.total ?? 0} projet{requete.data?.meta.total === 1 ? '' : 's'}
          </p>
        </div>
        <Link to="/projets/nouveau">
          <Button>Créer un projet</Button>
        </Link>
      </div>

      {requete.isPending ? (
        <Card>
          <CardCorps>
            <SkeletonTexte lignes={5} />
          </CardCorps>
        </Card>
      ) : requete.data && requete.data.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requete.data.data.map((projet) => (
            <Link key={projet.id} to={`/projets/${projet.id}`}>
              <CarteProjet projet={projet} />
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            titre="Aucun projet pour l'instant"
            description="Crée ton premier projet, ou rejoins une équipe qui te ressemble."
            action={
              <Link to="/projets/nouveau">
                <Button>Créer un projet</Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  )
}
