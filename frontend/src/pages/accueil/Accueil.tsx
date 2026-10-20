import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Badge,
  Button,
  Card,
  CardCorps,
  CardEntete,
  EmptyState,
  ProgressBar,
  SkeletonTexte,
} from '../../components/ui'
import { portfolio } from '../../api/talents'
import { useSession } from '../../features/auth/SessionProvider'
import { useDemandesRecues } from '../../features/equipes/useDemandesRecues'
import { useTableauDeBord } from '../../features/dashboard/useTableauDeBord'
import { LIBELLES_DOMAINE } from '../../lib/labels'
import { dateCourte, lienSur } from '../ressources/outils'
import { libelleStatut, varianteStatut } from '../projets/statut'

/**
 * Tableau de bord — l'écran d'accueil après connexion.
 *
 * Les données viennent de `chargerTableauDeBord()` : `GET /me/dashboard` (P1) s'il est livré,
 * sinon le repli P0 du contrat (A-15). L'écran ne sait pas laquelle des deux a servi.
 *
 * Règles de présentation :
 *   - un chiffre indisponible s'affiche « — », jamais « 0 » (un faux zéro est un mensonge) ;
 *   - le follow est P1 : aucun compteur d'abonnés ;
 *   - l'accent n'est utilisé que pour l'ACTION principale (« Créer un projet »).
 */

function Tuile({
  to,
  libelle,
  valeur,
  alerte = false,
}: {
  to: string
  libelle: string
  valeur: number | null
  alerte?: boolean
}) {
  return (
    <Link to={to} className="block">
      <Card className="h-full transition-colors hover:border-border-strong">
        <CardCorps className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tabular-nums text-fg-1">{valeur ?? '—'}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-fg-2">{libelle}</span>
            {alerte && valeur !== null && valeur > 0 && <Badge variante="attente">À traiter</Badge>}
          </div>
        </CardCorps>
      </Card>
    </Link>
  )
}

export function Accueil() {
  const { profil } = useSession()
  const tableau = useTableauDeBord()
  const demandesRecues = useDemandesRecues()
  const realises = useQuery({
    queryKey: ['portfolio', String(profil?.id)],
    queryFn: () => portfolio(profil!.id),
    enabled: profil !== null,
  })

  const prenom = profil?.nom.split(' ')[0] ?? ''
  const profilIncomplet = profil !== null && (profil.competences.length === 0 || !profil.bio)
  const donnees = tableau.data

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="break-words text-lg font-semibold text-fg-1">Bonjour {prenom}</h1>
        <p className="mt-1 text-sm text-fg-2">Voici où en sont tes projets et tes demandes.</p>
      </div>

      {profilIncomplet && (
        <Card>
          <CardCorps className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-fg-1">
              Complète ton profil (bio, compétences) pour apparaître dans les recherches de talents.
            </p>
            <Link to="/profil/modifier" className="shrink-0">
              <Button variante="secondaire">Compléter mon profil</Button>
            </Link>
          </CardCorps>
        </Card>
      )}

      {tableau.isPending ? (
        <Card>
          <CardCorps>
            <SkeletonTexte lignes={4} />
          </CardCorps>
        </Card>
      ) : tableau.isError || !donnees ? (
        <Card>
          <EmptyState
            titre="Impossible de charger ton tableau de bord"
            description="Vérifie ta connexion puis réessaie."
            action={
              <Button variante="secondaire" onClick={() => void tableau.refetch()}>
                Réessayer
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Tuile to="/mes-projets" libelle="Mes projets" valeur={donnees.projets_count} />
            <Tuile
              to="/mes-projets"
              libelle="Demandes à traiter"
              valeur={donnees.demandes_recues_en_attente}
              alerte
            />
            <Tuile to="/mes-demandes" libelle="Mes demandes en attente" valeur={donnees.mes_demandes_en_attente} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/projets/nouveau">
              <Button>Créer un projet</Button>
            </Link>
            <Link to="/projets">
              <Button variante="secondaire">Explorer les projets</Button>
            </Link>
            <Link to="/talents">
              <Button variante="secondaire">Trouver des talents</Button>
            </Link>
            <Link to="/ressources/nouveau">
              <Button variante="secondaire">Partager une ressource</Button>
            </Link>
          </div>

          <Card>
            <CardEntete titre="Mes projets récents" compteur={donnees.projets_count} />
            <CardCorps>
              {donnees.projets.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {donnees.projets.map((projet) => {
                    const enAttente = demandesRecues.data?.parProjet[projet.id] ?? 0
                    return (
                      <li
                        key={projet.id}
                        className="flex flex-col gap-2 border-b border-border-subtle pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link to={`/projets/${projet.id}`} className="min-w-0 text-sm font-semibold text-fg-1 hover:text-accent">
                            {projet.nom}
                          </Link>
                          <div className="flex items-center gap-2">
                            {enAttente > 0 && (
                              <Badge variante="attente">
                                {enAttente} demande{enAttente > 1 ? 's' : ''}
                              </Badge>
                            )}
                            <Badge variante={varianteStatut(projet.statut)}>{libelleStatut(projet.statut)}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {projet.domaines.map((d) => (
                            <Badge key={d} variante="neutre">
                              {LIBELLES_DOMAINE[d]}
                            </Badge>
                          ))}
                        </div>
                        <ProgressBar valeur={projet.progression} />
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState
                  titre="Tu n'as pas encore de projet"
                  description="Crée le tien ou rejoins une équipe qui recrute."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link to="/projets/nouveau">
                        <Button>Créer un projet</Button>
                      </Link>
                      <Link to="/projets">
                        <Button variante="secondaire">Explorer les projets</Button>
                      </Link>
                    </div>
                  }
                />
              )}
            </CardCorps>
          </Card>
        </>
      )}

      <Card>
        <CardEntete titre="Mes projets réalisés" compteur={realises.data?.length} />
        <CardCorps>
          {realises.isPending ? (
            <SkeletonTexte lignes={2} />
          ) : realises.isError ? (
            <p className="text-sm text-fg-3">Projets réalisés indisponibles pour le moment.</p>
          ) : realises.data.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {realises.data.map((projet) => {
                const realisation = lienSur(projet.lien_realisation)
                return (
                  <li key={projet.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <Link to={`/projets/${projet.id}`} className="font-medium text-fg-1 hover:text-accent">
                      {projet.nom}
                    </Link>
                    <span className="flex items-center gap-3 text-xs text-fg-3">
                      {realisation && (
                        <a href={realisation} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
                          Voir la réalisation
                        </a>
                      )}
                      {projet.date_fin && <span className="tabular-nums">Terminé le {dateCourte(projet.date_fin)}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-fg-3">Tes projets terminés apparaîtront ici, dans ton portfolio.</p>
          )}
        </CardCorps>
      </Card>
    </div>
  )
}
