import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  Tabs,
  useConfirmation,
} from '../../components/ui'
import { detailProjet, supprimerProjet } from '../../api/projets'
import { ErreurApi, messageErreur } from '../../api/erreurs'
import { demandesDuProjet, membresDuProjet, retirerMembre, traiterDemande } from '../../api/equipes'
import { useSession } from '../../features/auth/SessionProvider'
import { useDemandesRecues } from '../../features/equipes/useDemandesRecues'
import { oublierProjet, rafraichirProjets } from '../../lib/cache'
import { useLibelles } from '../../lib/labels'
import { varianteStatutDemande } from '../equipes/statutDemande'
import { Discussion } from '../messagerie/Discussion'
import { OngletRessources } from '../ressources/OngletRessources'
import { BoutonRejoindre } from './BoutonRejoindre'
import { varianteStatut } from './statut'
import type { DemandeAdhesion, Projet } from '../../types'
import { useI18n } from '../../i18n'
import { useNomCompetence } from '../../lib/competences'

/**
 * Détail d'un projet, organisé en ONGLETS.
 *
 * Le contrat prévoit 5 onglets : Vue, Équipe, Discussion, Ressources, Demandes.
 * Discussion et Ressources arrivent avec leurs modules. Ici :
 *   - « Vue »     → le contenu du projet ;
 *   - « Équipe »  → les membres (+ retirer / quitter) ;
 *   - « Demandes »→ propriétaire uniquement, accepter / refuser.
 */
export function ProjetDetail() {
  const { t } = useI18n()
  const L = useLibelles()
  const { id } = useParams()
  const { profil } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [onglet, setOnglet] = useState('vue')
  const [erreurAction, setErreurAction] = useState<string | null>(null)
  const demandesRecues = useDemandesRecues()
  const { confirmer, dialogue } = useConfirmation()

  const requete = useQuery({
    queryKey: ['projet', id],
    queryFn: () => detailProjet(Number(id)),
    enabled: id != null,
    /* Un 404/403 est définitif : inutile de le rejouer (et ça évite d'attendre). */
    retry: (tentatives, erreur) =>
      !(erreur instanceof ErreurApi && (erreur.introuvable || erreur.nonAutorise)) && tentatives < 1,
  })

  async function onSupprimer() {
    const confirme = await confirmer({
      titre: t('projetDetail.confirmerTitre'),
      description: t('projetDetail.confirmerTexte'),
    })
    if (!confirme) return
    setErreurAction(null)
    try {
      await supprimerProjet(Number(id))
    } catch (erreur) {
      setErreurAction(messageErreur(erreur))
      return
    }
    /* Ordre voulu : on QUITTE la page avant de purger, sinon la page en cours
       tenterait de recharger un projet qui n'existe plus. */
    navigate('/projets', { replace: true })
    oublierProjet(queryClient, Number(id))
    rafraichirProjets(queryClient)
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

  /* « Introuvable » = le serveur a RÉPONDU 404 : le projet n'existe plus.
     Toute autre panne (réseau, 5xx) n'est PAS « introuvable » : si on a déjà des
     données on les garde à l'écran, sinon on propose de réessayer.
     C'était le bug : un rechargement en arrière-plan raté faisait disparaître
     un projet pourtant affiché. */
  const introuvable = requete.error instanceof ErreurApi && requete.error.introuvable
  if (introuvable) {
    return (
      <EmptyState
        titre={t('projetDetail.introuvableTitre')}
        description={t('projetDetail.introuvableTexte')}
        action={<Button variante="secondaire" onClick={() => navigate('/projets')}>{t('projetDetail.retourProjets')}</Button>}
      />
    )
  }
  if (!requete.data) {
    return (
      <EmptyState
        titre={t('projetDetail.chargementImpossible')}
        description={messageErreur(requete.error)}
        action={<Button variante="secondaire" onClick={() => requete.refetch()}>{t('commun.reessayer')}</Button>}
      />
    )
  }

  const projet = requete.data
  const estProprietaire = projet.createur.id === profil?.id

  const onglets = [
    { id: 'vue', libelle: t('projetDetail.ongletVue') },
    { id: 'equipe', libelle: t('projetDetail.ongletEquipe'), compteur: projet.nombre_membres_actuel },
    /* La discussion est réservée aux membres (le propriétaire en est un) : 403 sinon. */
    ...(projet.is_member
      ? [
          { id: 'discussion', libelle: t('projetDetail.ongletDiscussion') },
          { id: 'ressources', libelle: t('projetDetail.ongletRessources') },
        ]
      : []),
    ...(estProprietaire
      ? [{ id: 'demandes', libelle: t('projetDetail.ongletDemandes'), compteur: demandesRecues.data?.parProjet[projet.id] || undefined }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={'/projets'} className="mb-3 inline-flex min-h-9 items-center text-sm text-fg-2 hover:text-fg-1">
          {t('projetDetail.tousProjets')}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-fg-1">{projet.nom}</h1>
              <Badge variante={varianteStatut(projet.statut)}>{L.statutProjet[projet.statut]}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {projet.domaines.map((domaine) => (
                <Badge key={domaine} variante="neutre">
                  {L.domaine[domaine]}
                </Badge>
              ))}
            </div>
          </div>

          {estProprietaire ? (
            <div className="flex gap-2">
              <Button variante="secondaire" onClick={() => navigate(`/projets/${projet.id}/modifier`)}>
                {t('projetDetail.modifier')}
              </Button>
              <Button variante="danger" onClick={onSupprimer}>
                {t('commun.supprimer')}
              </Button>
            </div>
          ) : (
            <BoutonRejoindre projet={projet} />
          )}
        </div>
      </div>

      {erreurAction && (
        <p role="alert" className="text-sm text-danger">
          {erreurAction}
        </p>
      )}

      <Tabs onglets={onglets} actif={onglet} onChange={setOnglet} avecPanneaux />

      <div role="tabpanel" id={`panneau-${onglet}`} aria-labelledby={`onglet-${onglet}`} className="flex flex-col gap-6">
      {onglet === 'vue' && <VueProjet projet={projet} />}
      {onglet === 'equipe' && <OngletEquipe projetId={projet.id} estProprietaire={estProprietaire} />}
      {onglet === 'discussion' && projet.is_member && (
        <Discussion projetId={projet.id} proprietaireId={projet.createur.id} />
      )}
      {onglet === 'ressources' && projet.is_member && <OngletRessources projetId={projet.id} />}
      {onglet === 'demandes' && estProprietaire && <OngletDemandes projetId={projet.id} />}
      </div>
      {dialogue}
    </div>
  )
}

/* ── Onglet « Vue » ───────────────────────────────────────────────────────── */

function VueProjet({ projet }: { projet: Projet }) {
  const { t } = useI18n()
  const L = useLibelles()
  const nomComp = useNomCompetence()
  return (
    <>
      <Card>
        <CardCorps className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-fg-2">{t('projetDetail.avancement')}</span>
            <span className="text-sm font-medium text-fg-1">{projet.progression} %</span>
          </div>
          <ProgressBar valeur={projet.progression} afficherValeur={false} />
          <p className="text-xs text-fg-3">
            {t('projetDetail.effectif', { count: projet.nombre_membres_actuel, souhaite: projet.nombre_membres_souhaite })}
          </p>
        </CardCorps>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardEntete titre={t('projetDetail.description')} />
          <CardCorps>
            <p className="text-sm text-fg-1">{projet.description}</p>
          </CardCorps>
        </Card>

        <Card>
          <CardEntete titre={t('projetDetail.objectifs')} />
          <CardCorps>
            <p className="text-sm text-fg-1">{projet.objectifs}</p>
          </CardCorps>
        </Card>
      </div>

      <Card>
        <CardEntete titre={t('projetDetail.competences')} compteur={projet.competences_recherchees.length} />
        <CardCorps>
          {projet.competences_recherchees.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {projet.competences_recherchees.map((comp) => (
                <Badge key={comp.id} variante="accent">
                  {nomComp(comp.nom)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fg-3">{t('projetDetail.aucuneCompetence')}</p>
          )}
        </CardCorps>
      </Card>

      <Card>
        <CardEntete titre={t('projetDetail.creePar')} />
        <CardCorps className="flex items-center gap-3">
          <Avatar nom={projet.createur.nom} photoUrl={projet.createur.photo_url} taille="md" />
          <div className="min-w-0">
            <Link to={`/talents/${projet.createur.id}`} className="block truncate py-1 text-sm font-medium text-fg-1 hover:text-accent">{projet.createur.nom}</Link>
            <p className="truncate text-xs text-fg-2">
              {L.role[projet.createur.role_profil]}
            </p>
          </div>
        </CardCorps>
      </Card>

      {projet.lien_realisation && (
        <Card>
          <CardEntete titre={t('projetDetail.livrable')} />
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
    </>
  )
}

/* ── Onglet « Équipe » ────────────────────────────────────────────────────── */

function OngletEquipe({ projetId, estProprietaire }: { projetId: number; estProprietaire: boolean }) {
  const { t } = useI18n()
  const L = useLibelles()
  const queryClient = useQueryClient()
  const { profil } = useSession()
  const requete = useQuery({ queryKey: ['membres', projetId], queryFn: () => membresDuProjet(projetId) })
  const [erreur, setErreur] = useState<string | null>(null)

  async function onRetirer(userId: number) {
    setErreur(null)
    try {
      await retirerMembre(projetId, userId)
    } catch (e) {
      setErreur(
        messageErreur(e, {
          404: t('projetDetail.dejaPlusMembre'),
          409: t('projetDetail.proprioNePeutQuitter'),
        })
      )
    }
    /* Succès OU échec : on recale l'écran sur le serveur. */
    rafraichirProjets(queryClient, projetId)
  }

  if (requete.isPending) {
    return (
      <Card>
        <CardCorps>
          <SkeletonTexte lignes={3} />
        </CardCorps>
      </Card>
    )
  }

  const membres = requete.data?.data ?? []

  return (
    <Card>
      <CardEntete titre={t('projetDetail.membres')} compteur={membres.length} />
      <CardCorps className="flex flex-col gap-2">
        {erreur && (
          <p role="alert" className="text-sm text-danger">
            {erreur}
          </p>
        )}
        {membres.map((membre) => {
          const moi = membre.utilisateur.id === profil?.id
          const peutAgir = (estProprietaire && !moi) || (moi && !estProprietaire)

          return (
            <div
              key={membre.utilisateur.id}
              className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar nom={membre.utilisateur.nom} photoUrl={membre.utilisateur.photo_url} taille="sm" />
                <div className="min-w-0">
                  <Link to={`/talents/${membre.utilisateur.id}`} className="block truncate py-1 text-sm font-medium text-fg-1 hover:text-accent">{membre.utilisateur.nom}</Link>
                  <p className="truncate text-xs text-fg-2">
                    {L.role[membre.utilisateur.role_profil]}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {membre.role_equipe === 'proprietaire' && <Badge variante="accent">{t('projetDetail.proprietaire')}</Badge>}
                {peutAgir && (
                  <Button taille="sm" variante="discret" onClick={() => onRetirer(membre.utilisateur.id)}>
                    {moi ? t('projetDetail.quitter') : t('projetDetail.retirer')}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardCorps>
    </Card>
  )
}

/* ── Onglet « Demandes » (propriétaire) ───────────────────────────────────── */

function OngletDemandes({ projetId }: { projetId: number }) {
  const { t } = useI18n()
  const L = useLibelles()
  const queryClient = useQueryClient()
  const requete = useQuery({
    queryKey: ['demandes-projet', projetId, 'en_attente'],
    queryFn: () => demandesDuProjet(projetId, 'en_attente'),
  })
  const [retour, setRetour] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [enCours, setEnCours] = useState<number | null>(null)

  async function onDecision(demande: DemandeAdhesion, decision: 'acceptee' | 'refusee') {
    setRetour(null)
    setEnCours(demande.id)
    try {
      await traiterDemande(demande.id, { decision })
      setRetour({
        type: 'succes',
        texte:
          decision === 'acceptee'
            ? t('projetDetail.accepteeMsg', { nom: demande.utilisateur.nom })
            : t('projetDetail.refuseeMsg', { nom: demande.utilisateur.nom }),
      })
    } catch (e) {
      setRetour({
        type: 'erreur',
        texte: messageErreur(e, {
          404: t('projetDetail.demandeAnnulee'),
          409: t('projetDetail.demandeTraitee'),
        }),
      })
    } finally {
      setEnCours(null)
    }
    /* Dans tous les cas on recale l'écran : la liste, l'équipe, le compteur. */
    rafraichirProjets(queryClient, projetId)
  }

  if (requete.isPending) {
    return (
      <Card>
        <CardCorps>
          <SkeletonTexte lignes={3} />
        </CardCorps>
      </Card>
    )
  }

  const demandes = requete.data?.data ?? []

  return (
    <Card>
      <CardEntete titre={t('projetDetail.demandesTitre')} compteur={demandes.length} />
      <CardCorps className="flex flex-col gap-2">
        {retour && (
          <p role="status" className={retour.type === 'erreur' ? 'text-sm text-danger' : 'text-sm text-success'}>
            {retour.texte}
          </p>
        )}
        {demandes.length === 0 ? (
          <EmptyState
            titre={t('projetDetail.aucuneDemande')}
            description={t('projetDetail.aucuneDemandeTexte')}
          />
        ) : (
          demandes.map((demande) => (
            <div
              key={demande.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar
                  nom={demande.utilisateur.nom}
                  photoUrl={demande.utilisateur.photo_url}
                  taille="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg-1">{demande.utilisateur.nom}</p>
                  {demande.message ? (
                    <p className="text-xs text-fg-2">« {demande.message} »</p>
                  ) : (
                    <p className="text-xs text-fg-3">{t('demandes.sansMessage')}</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {demande.statut === 'en_attente' ? (
                  <>
                    <Button
                      taille="sm"
                      variante="secondaire"
                      chargement={enCours === demande.id}
                      onClick={() => onDecision(demande, 'refusee')}
                    >
                      {t('projetDetail.refuser')}
                    </Button>
                    <Button taille="sm" chargement={enCours === demande.id} onClick={() => onDecision(demande, 'acceptee')}>
                      {t('projetDetail.accepter')}
                    </Button>
                  </>
                ) : (
                  <Badge variante={varianteStatutDemande(demande.statut)}>
                    {L.statutDemande[demande.statut]}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardCorps>
    </Card>
  )
}
