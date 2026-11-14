import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Button, Card, CardCorps, CardEntete } from '../../components/ui'
import { useSession } from '../../features/auth/SessionProvider'
import { useNomDePays } from '../../lib/pays'
import { useI18n } from '../../i18n'
import { useNomCompetence } from '../../lib/competences'
import { profilPublic } from '../../api/talents'
import { estLivre } from '../../lib/priorites'
import { CompteursSuivi, ListeReseau } from '../talents/ListeReseau'
import { useLibelles } from '../../lib/labels'

/**
 * « Mon profil » — vue en lecture du compte connecté.
 *
 * Alimenté par la session (`ProfilPrive`) : c'est le SEUL écran qui a le droit
 * d'afficher l'email. Le profil public (`GET /users/{id}`) n'en aura jamais —
 * règle de sécurité du contrat.
 *
 * Les états vides sont assumés : une section sans donnée affiche un libellé
 * discret au lieu de disparaître sans explication.
 */
export function MonProfil() {
  const { t } = useI18n()
  const L = useLibelles()
  const nomComp = useNomCompetence()
  const nomDePays = useNomDePays()
  const { profil } = useSession()
  const navigate = useNavigate()
  const suiviLivre = estLivre('follow')

  /* Les compteurs de suivi viennent du profil PUBLIC de MON id (`GET /users/{id}`,
     autorisé par le contrat) : la session (`/auth/me`) ne bouge pas quand je
     suis quelqu'un, alors que cette requête est rafraîchie par `rafraichirSuivi`. */
  const reseau = useQuery({
    queryKey: ['talent', String(profil?.id)],
    queryFn: () => profilPublic(profil!.id),
    enabled: suiviLivre && profil != null,
  })

  if (!profil) return null
  const nbAbonnes = reseau.data?.followers_count ?? profil.followers_count
  const nbAbonnements = reseau.data?.following_count ?? profil.following_count

  const regionPays = [nomDePays(profil.pays), profil.region].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardCorps className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar nom={profil.nom} photoUrl={profil.photo_url} taille="lg" className="self-start" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-fg-1">{profil.nom}</h1>
              <Badge variante="info">{L.role[profil.role_profil]}</Badge>
            </div>

            <p className="mt-1 text-sm text-fg-2">{regionPays || t('profil.lieuNonRenseigne')}</p>

            {profil.bio ? (
              <p className="mt-3 text-sm text-fg-1">{profil.bio}</p>
            ) : (
              <p className="mt-3 text-sm text-fg-3">{t('profil.aucuneBio')}</p>
            )}

            <p className="mt-3 text-xs text-fg-3">{profil.email}</p>
            {suiviLivre && (
              <div className="mt-3">
                <CompteursSuivi nbAbonnes={nbAbonnes} nbAbonnements={nbAbonnements} />
              </div>
            )}
          </div>

          <div className="shrink-0">
            <Button variante="secondaire" onClick={() => navigate('/profil/modifier')}>
              {t('profil.modifier')}
            </Button>
          </div>
        </CardCorps>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardEntete titre={t('profil.domaines')} compteur={profil.domaines.length} />
          <CardCorps>
            {profil.domaines.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profil.domaines.map((domaine) => (
                  <Badge key={domaine} variante="neutre">
                    {L.domaine[domaine] ?? domaine}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-fg-3">{t('profil.aucunDomaine')}</p>
            )}
          </CardCorps>
        </Card>

        <Card>
          <CardEntete titre={t('profil.liens')} compteur={profil.liens.length} />
          <CardCorps className="flex flex-col gap-2">
            {profil.liens.length > 0 ? (
              profil.liens.map((lien) => (
                <div key={lien.url} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-fg-2">{L.typeLien[lien.type]}</span>
                  <a
                    href={lien.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-accent hover:text-accent-hover"
                  >
                    {lien.url}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-fg-3">{t('profil.aucunLien')}</p>
            )}
          </CardCorps>
        </Card>
      </div>

      {suiviLivre && <ListeReseau membreId={profil.id} nbAbonnes={nbAbonnes} nbAbonnements={nbAbonnements} />}

      <Card>
        <CardEntete titre={t('profil.competences')} compteur={profil.competences.length} />
        <CardCorps>
          {profil.competences.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {profil.competences.map((comp) => (
                <li
                  key={comp.id}
                  className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="text-fg-1">{nomComp(comp.nom)}</span>
                  <Badge variante="neutre">
                    {comp.niveau ? L.niveau[comp.niveau] : L.niveauNonPrecise}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-3">
              {t('profil.aucuneCompetence')}
            </p>
          )}
        </CardCorps>
      </Card>
    </div>
  )
}
