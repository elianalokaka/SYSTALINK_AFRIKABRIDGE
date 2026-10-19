import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardCorps,
  CardEntete,
  EmptyState,
  ProgressBar,
  SkeletonTexte,
} from '../../components/ui'
import { detailProjet, supprimerProjet } from '../../api/projets'
import { useSession } from '../../features/auth/SessionProvider'
import { LIBELLES_DOMAINE, LIBELLES_ROLE_PROFIL } from '../../lib/labels'
import { libelleStatut, varianteStatut } from './statut'

/**
 * Détail d'un projet.
 *
 * C'est ici que vit la logique la plus délicate du front (AGENTS.md § 2) :
 * `is_member` + `createur` pilotent les boutons. Pour ce module :
 *   - propriétaire → Modifier / Supprimer ;
 *   - membre      → badge « Membre » ;
 *   - étranger    → le bouton « Rejoindre » arrive avec le module équipes.
 */
export function ProjetDetail() {
  const { id } = useParams()
  const { profil } = useSession()
  const navigate = useNavigate()

  const requete = useQuery({
    queryKey: ['projet', id],
    queryFn: () => detailProjet(Number(id)),
    enabled: id != null,
  })

  async function onSupprimer() {
    if (!window.confirm('Supprimer définitivement ce projet ?')) return
    await supprimerProjet(Number(id))
    navigate('/projets', { replace: true })
  }

  if (requete.isPending) {
    return (
      <Card>
        <CardCorps>
          <SkeletonTexte lignes={6} />
        </CardCorps>
      </Card>
    )
  }

  if (requete.isError || !requete.data) {
    return (
      <EmptyState
        titre="Projet introuvable"
        description="Ce projet n'existe pas ou a été supprimé."
        action={<Button variante="secondaire" onClick={() => navigate('/projets')}>Retour aux projets</Button>}
      />
    )
  }

  const projet = requete.data
  const estProprietaire = projet.createur.id === profil?.id

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/projets')}
          className="mb-3 text-sm text-fg-2 hover:text-fg-1"
        >
          ← Tous les projets
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-fg-1">{projet.nom}</h1>
            <Badge variante={varianteStatut(projet.statut)}>{libelleStatut(projet.statut)}</Badge>
            {projet.is_member && <Badge variante="info">Membre</Badge>}
          </div>

          {estProprietaire && (
            <div className="flex gap-2">
              <Button variante="secondaire" onClick={() => navigate(`/projets/${projet.id}/modifier`)}>
                Modifier
              </Button>
              <Button variante="danger" onClick={onSupprimer}>
                Supprimer
              </Button>
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {projet.domaines.map((domaine) => (
            <Badge key={domaine} variante="neutre">
              {LIBELLES_DOMAINE[domaine]}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardCorps className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-fg-2">Avancement</span>
            <span className="text-sm font-medium text-fg-1">{projet.progression} %</span>
          </div>
          <ProgressBar valeur={projet.progression} afficherValeur={false} />
          <p className="text-xs text-fg-3">
            {projet.nombre_membres_actuel} membre{projet.nombre_membres_actuel > 1 ? 's' : ''} sur{' '}
            {projet.nombre_membres_souhaite} recherché{projet.nombre_membres_souhaite > 1 ? 's' : ''}
          </p>
        </CardCorps>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardEntete titre="Description" />
          <CardCorps>
            <p className="text-sm text-fg-1">{projet.description}</p>
          </CardCorps>
        </Card>

        <Card>
          <CardEntete titre="Objectifs" />
          <CardCorps>
            <p className="text-sm text-fg-1">{projet.objectifs}</p>
          </CardCorps>
        </Card>
      </div>

      <Card>
        <CardEntete titre="Compétences recherchées" compteur={projet.competences_recherchees.length} />
        <CardCorps>
          {projet.competences_recherchees.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {projet.competences_recherchees.map((comp) => (
                <Badge key={comp.id} variante="accent">
                  {comp.nom}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fg-3">Aucune compétence recherchée.</p>
          )}
        </CardCorps>
      </Card>

      <Card>
        <CardEntete titre="Créé par" />
        <CardCorps className="flex items-center gap-3">
          <Avatar nom={projet.createur.nom} photoUrl={projet.createur.photo_url} taille="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg-1">{projet.createur.nom}</p>
            <p className="truncate text-xs text-fg-2">
              {LIBELLES_ROLE_PROFIL[projet.createur.role_profil]}
            </p>
          </div>
        </CardCorps>
      </Card>

      {projet.lien_realisation && (
        <Card>
          <CardEntete titre="Livrable" />
          <CardCorps>
            <a
              href={projet.lien_realisation}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-accent hover:text-accent-hover"
            >
              {projet.lien_realisation}
            </a>
          </CardCorps>
        </Card>
      )}
    </div>
  )
}
