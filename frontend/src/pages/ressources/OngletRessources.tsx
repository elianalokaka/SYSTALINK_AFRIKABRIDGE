import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, CardCorps, CardEntete, EmptyState, SkeletonTexte } from '../../components/ui'
import { listerRessources } from '../../api/ressources'
import { ErreurApi } from '../../api/erreurs'
import { LIBELLES_TYPE_RESSOURCE, LIBELLES_VISIBILITE_RESSOURCE } from '../../lib/labels'
import { dateCourte } from './outils'

/**
 * Onglet « Ressources » d'un projet — réservé aux membres.
 *
 * `GET /resources?projet_id=N` renvoie 403 si je ne suis pas membre : ce n'est
 * PAS une erreur d'interface (A-8) → section vide, sans alerte.
 */
export function OngletRessources({ projetId }: { projetId: number }) {
  const requete = useQuery({
    queryKey: ['ressources-projet', projetId],
    queryFn: () => listerRessources({ projet_id: projetId, per_page: 50 }),
    retry: (tentatives, e) => !(e instanceof ErreurApi && e.nonAutorise) && tentatives < 1,
  })

  if (requete.isPending) {
    return (
      <Card>
        <CardCorps>
          <SkeletonTexte lignes={3} />
        </CardCorps>
      </Card>
    )
  }

  const interdit = requete.error instanceof ErreurApi && requete.error.nonAutorise
  const liste = interdit ? [] : (requete.data?.data ?? [])

  return (
    <Card>
      <CardEntete
        titre="Ressources du projet"
        compteur={liste.length}
        action={
          <Link to={`/ressources/nouveau?projet=${projetId}`}>
            <Button taille="sm">Partager ici</Button>
          </Link>
        }
      />
      <CardCorps className="flex flex-col gap-2">
        {requete.isError && !interdit ? (
          <EmptyState
            titre="Impossible de charger les ressources"
            description="Vérifie ta connexion puis réessaie."
            action={
              <Button variante="secondaire" onClick={() => void requete.refetch()}>
                Réessayer
              </Button>
            }
          />
        ) : liste.length === 0 ? (
          <EmptyState
            titre="Aucune ressource pour l'instant"
            description="Partage un lien, un extrait de code ou un document avec ton équipe."
          />
        ) : (
          liste.map((ressource) => (
            <Link
              key={ressource.id}
              to={`/ressources/${ressource.id}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg-1">{ressource.titre}</p>
                <p className="truncate text-xs text-fg-3">
                  {ressource.auteur.nom} · {dateCourte(ressource.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {ressource.visibilite === 'publique' && (
                  <Badge variante="neutre">{LIBELLES_VISIBILITE_RESSOURCE.publique}</Badge>
                )}
                <Badge variante="accent">{LIBELLES_TYPE_RESSOURCE[ressource.type]}</Badge>
              </div>
            </Link>
          ))
        )}
      </CardCorps>
    </Card>
  )
}
