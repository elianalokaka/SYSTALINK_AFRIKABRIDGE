import { Link, Navigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Button, Card, CardCorps, CardEntete, EmptyState, SkeletonTexte } from '../../components/ui'
import { portfolio, profilPublic } from '../../api/talents'
import { ErreurApi } from '../../api/erreurs'
import { useSession } from '../../features/auth/SessionProvider'
import { useNomDePays } from '../../lib/pays'
import { useLibelles } from '../../lib/labels'
import { estLivre } from '../../lib/priorites'
import { domaineDe, lienSur } from '../ressources/outils'
import { BoutonSuivre } from './BoutonSuivre'
import { CompteursSuivi, ListeReseau } from './ListeReseau'
import { useDates, useI18n } from '../../i18n'
import { useNomCompetence } from '../../lib/competences'

/**
 * Profil PUBLIC d'un membre (`GET /users/{id}`) + « Projets réalisés » (`GET /users/{id}/portfolio`).
 *
 * - Jamais d'e-mail (le contrat ne le renvoie pas) ;
 * - mon propre id redirige vers « Mon profil » (c'est là qu'on modifie) ;
 * - liens externes : http(s) uniquement, `rel="noopener noreferrer"` ;
 * - le suivi (P1) : bouton « Suivre », compteurs et carte « Réseau » ne s'affichent que
 *   si `priorites.follow` est vrai ; sinon les compteurs sont des champs fantômes (0).
 *
 * Le portfolio est une section indépendante : s'il échoue, le profil reste lisible.
 */
export function ProfilPublic() {
  const { t } = useI18n()
  const nomComp = useNomCompetence()
  const { date } = useDates()
  const L = useLibelles()
  const nomDePays = useNomDePays()
  const { id } = useParams()
  const { profil: moi } = useSession()

  const requete = useQuery({
    queryKey: ['talent', id],
    queryFn: () => profilPublic(Number(id)),
    enabled: id != null && Number.isFinite(Number(id)),
    retry: (tentatives, e) => !(e instanceof ErreurApi && e.introuvable) && tentatives < 1,
  })
  const projets = useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => portfolio(Number(id)),
    enabled: requete.isSuccess,
  })

  if (moi && String(moi.id) === id) return <Navigate to="/profil" replace />

  const retour = (
    <Link to="/talents" className="inline-flex min-h-9 items-center text-sm text-fg-2 hover:text-fg-1">
      {t('profilPublic.retour')}
    </Link>
  )

  if (requete.isPending && requete.fetchStatus !== 'idle') {
    return (
      <div className="flex flex-col gap-4">
        {retour}
        <Card>
          <CardCorps>
            <SkeletonTexte lignes={5} />
          </CardCorps>
        </Card>
      </div>
    )
  }

  if (requete.isError || !requete.data) {
    const introuvable = requete.error instanceof ErreurApi && requete.error.introuvable
    return (
      <div className="flex flex-col gap-4">
        {retour}
        <Card>
          <EmptyState
            titre={introuvable ? t('profilPublic.introuvableTitre') : t('profilPublic.chargementImpossible')}
            description={introuvable ? t('profilPublic.introuvableTexte') : t('commun.verifierConnexion')}
            action={
              introuvable ? (
                <Link to="/talents">
                  <Button variante="secondaire">{t('profilPublic.voirTalents')}</Button>
                </Link>
              ) : (
                <Button variante="secondaire" onClick={() => void requete.refetch()}>
                  {t('commun.reessayer')}
                </Button>
              )
            }
          />
        </Card>
      </div>
    )
  }

  const membre = requete.data
  const suiviLivre = estLivre('follow')
  const lieu = [membre.region, nomDePays(membre.pays)].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-6">
      {retour}

      <Card>
        <CardCorps className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar nom={membre.nom} photoUrl={membre.photo_url} taille="lg" className="self-start" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-lg font-semibold text-fg-1">{membre.nom}</h1>
              <Badge variante="info">{L.role[membre.role_profil]}</Badge>
            </div>
            <p className="mt-1 text-sm text-fg-2">{lieu}</p>
            {membre.bio ? (
              <p className="mt-3 whitespace-pre-line break-words text-sm text-fg-1">{membre.bio}</p>
            ) : (
              <p className="mt-3 text-sm text-fg-3">{t('profilPublic.sansBio')}</p>
            )}
            <p className="mt-3 text-xs text-fg-3">{t('profilPublic.membreDepuis', { date: date(membre.created_at) })}</p>
            {suiviLivre && (
              <div className="mt-3">
                <CompteursSuivi nbAbonnes={membre.followers_count} nbAbonnements={membre.following_count} />
              </div>
            )}
          </div>
          {suiviLivre && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:self-start">
              <BoutonSuivre membre={membre} taille="md" />
            </div>
          )}
        </CardCorps>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardEntete titre={t('profil.competences')} compteur={membre.competences.length} />
          <CardCorps>
            {membre.competences.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {membre.competences.map((comp) => (
                  <li
                    key={comp.id}
                    className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2 text-sm last:border-b-0 last:pb-0"
                  >
                    <span className="text-fg-1">{nomComp(comp.nom)}</span>
                    <Badge variante="neutre">{comp.niveau ? L.niveau[comp.niveau] : L.niveauNonPrecise}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-3">{t('profilPublic.aucuneCompetence')}</p>
            )}
          </CardCorps>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardEntete titre={t('profil.domaines')} compteur={membre.domaines.length} />
            <CardCorps>
              {membre.domaines.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {membre.domaines.map((d) => (
                    <Badge key={d} variante="neutre">
                      {L.domaine[d] ?? d}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-fg-3">{t('profil.aucunDomaine')}</p>
              )}
            </CardCorps>
          </Card>

          <Card>
            <CardEntete titre={t('profil.liens')} compteur={membre.liens.length} />
            <CardCorps className="flex flex-col gap-2">
              {membre.liens.length > 0 ? (
                membre.liens.map((lien) => {
                  const sur = lienSur(lien.url)
                  return (
                    <div key={lien.url} className="flex items-center justify-between gap-3 text-sm">
                      <span className="shrink-0 text-fg-2">{L.typeLien[lien.type]}</span>
                      {sur ? (
                        <a
                          href={sur}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-accent hover:text-accent-hover"
                        >
                          {domaineDe(sur)}
                        </a>
                      ) : (
                        <span className="truncate text-fg-3">{t('profilPublic.lienInvalide')}</span>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-fg-3">{t('profil.aucunLien')}</p>
              )}
            </CardCorps>
          </Card>
        </div>
      </div>

      {suiviLivre && (
        <ListeReseau
          membreId={membre.id}
          nbAbonnes={membre.followers_count}
          nbAbonnements={membre.following_count}
        />
      )}

      <Card>
        <CardEntete titre={t('profilPublic.projetsRealises')} compteur={projets.data?.length ?? membre.projets_realises_count} />
        <CardCorps>
          {projets.isPending ? (
            <SkeletonTexte lignes={2} />
          ) : projets.isError ? (
            <p className="text-sm text-fg-3">
              {t('profilPublic.projetsIndispo')}{' '}
              <button type="button" onClick={() => void projets.refetch()} className="text-accent hover:text-accent-hover">
                {t('commun.reessayer')}
              </button>
            </p>
          ) : projets.data.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {projets.data.map((projet) => {
                const realisation = lienSur(projet.lien_realisation)
                return (
                  <li
                    key={projet.id}
                    className="flex flex-col gap-2 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/projets/${projet.id}`} className="py-1 text-sm font-semibold text-fg-1 hover:text-accent">
                        {projet.nom}
                      </Link>
                      {projet.date_fin && (
                        <span className="text-xs tabular-nums text-fg-3">{t('profilPublic.termineLe', { date: date(projet.date_fin) })}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {projet.domaines.map((d) => (
                        <Badge key={d} variante="neutre">
                          {L.domaine[d] ?? d}
                        </Badge>
                      ))}
                    </div>
                    {realisation && (
                      <a
                        href={realisation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate py-1 text-sm text-accent hover:text-accent-hover"
                      >
                        {t('profilPublic.voirRealisation', { domaine: domaineDe(realisation) })}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-fg-3">{t('profilPublic.aucunProjet')}</p>
          )}
        </CardCorps>
      </Card>
    </div>
  )
}
