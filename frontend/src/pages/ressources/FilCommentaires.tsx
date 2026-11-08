import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, CardCorps, CardEntete, EmptyState, FormField, SkeletonTexte, Textarea } from '../../components/ui'
import { commentaires, commenter, supprimerCommentaire } from '../../api/commentaires'
import { ErreurApi, messageErreur } from '../../api/erreurs'
import { useSession } from '../../features/auth/SessionProvider'
import { rafraichirCommentaires } from '../../lib/cache'
import { LIBELLES_ROLE_PROFIL } from '../../lib/labels'
import type { Ressource } from '../../types'
import { LONGUEUR_MAX_COMMENTAIRE } from './commentaires'
import { dateCourte } from './outils'

const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const PAR_PAGE = 10

/**
 * Fil de commentaires d'une ressource (P1) : poser une question, proposer une amélioration.
 *
 * - Qui peut supprimer : l'AUTEUR du commentaire ou l'AUTEUR de la ressource (contrat).
 *   Le front n'affiche le bouton que pour ces deux cas ; la barrière reste le 403 du serveur.
 * - Suppression en deux temps, EN LIGNE (« Supprimer » → « Confirmer » / « Annuler ») :
 *   accessible au clavier, sans `window.confirm`.
 * - `403` sur la lecture = ressource réservée à une équipe : section vide, pas une erreur (cf. A-8).
 * - Tri : hypothèse A-1 (plus récent en premier) — jamais retrié côté front.
 */
export function FilCommentaires({ ressource }: { ressource: Ressource }) {
  const queryClient = useQueryClient()
  const { profil: moi } = useSession()
  const estAuteurRessource = moi?.id === ressource.auteur.id

  const [page, setPage] = useState(1)
  const [texte, setTexte] = useState('')
  const [aConfirmer, setAConfirmer] = useState<number | null>(null)
  const [annonce, setAnnonce] = useState('')

  const requete = useQuery({
    queryKey: ['commentaires', String(ressource.id), page],
    queryFn: () => commentaires(ressource.id, { page, per_page: PAR_PAGE }),
    placeholderData: keepPreviousData,
    retry: (tentatives, e) => !(e instanceof ErreurApi && (e.nonAutorise || e.introuvable)) && tentatives < 1,
  })

  const publication = useMutation({
    mutationFn: () => commenter(ressource.id, texte.trim()),
    onSuccess: () => {
      setTexte('')
      setPage(1)
      setAnnonce('Commentaire publié.')
      rafraichirCommentaires(queryClient)
    },
  })

  const suppression = useMutation({
    mutationFn: (id: number) => supprimerCommentaire(id),
    onSuccess: () => {
      /* Dernier élément d'une page > 1 : on recule d'une page au lieu d'afficher une page vide. */
      if (page > 1 && (requete.data?.data.length ?? 0) <= 1) setPage(page - 1)
      setAConfirmer(null)
      setAnnonce('Commentaire supprimé.')
      rafraichirCommentaires(queryClient)
    },
  })

  const interdit = requete.error instanceof ErreurApi && requete.error.nonAutorise
  const liste = requete.data?.data ?? []
  const total = requete.data?.meta.total
  const dernierePage = requete.data?.meta.last_page ?? 1

  const erreurPublication = publication.error
  const erreursChamp = erreurPublication instanceof ErreurApi && erreurPublication.validation ? erreurPublication.erreursParChamp() : {}
  const erreurContenu = erreursChamp.contenu?.[0]
  const trop = texte.length > LONGUEUR_MAX_COMMENTAIRE

  function onPublier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (publication.isPending || texte.trim() === '' || trop) return
    setAnnonce('')
    publication.mutate()
  }

  return (
    <Card>
      <CardEntete titre="Commentaires" compteur={interdit ? undefined : total} />
      <CardCorps className="flex flex-col gap-5">
        {interdit ? (
          <p className="text-sm text-fg-3">Les commentaires de cette ressource sont réservés à son équipe.</p>
        ) : (
          <>
            <form onSubmit={onPublier} className="flex flex-col gap-3" noValidate>
              <FormField
                id="nouveau-commentaire"
                label="Ton commentaire"
                erreur={erreurContenu}
                aide={`${texte.length} / ${LONGUEUR_MAX_COMMENTAIRE} caractères`}
              >
                <Textarea
                  id="nouveau-commentaire"
                  rows={3}
                  value={texte}
                  maxLength={LONGUEUR_MAX_COMMENTAIRE}
                  placeholder="Pose une question ou propose une amélioration…"
                  invalide={Boolean(erreurContenu)}
                  aria-describedby={erreurContenu ? 'nouveau-commentaire-erreur' : 'nouveau-commentaire-aide'}
                  onChange={(e) => setTexte(e.target.value)}
                />
              </FormField>
              {erreurPublication && !erreurContenu && (
                <p role="alert" className="text-sm text-danger">
                  {messageErreur(erreurPublication, { 403: 'Tu ne peux pas commenter cette ressource.', 404: 'Cette ressource n’existe plus.' })}
                </p>
              )}
              <div>
                <Button type="submit" chargement={publication.isPending} disabled={texte.trim() === '' || trop}>
                  Publier
                </Button>
              </div>
            </form>

            {requete.isPending ? (
              <SkeletonTexte lignes={3} />
            ) : requete.isError && !requete.data ? (
              <EmptyState
                titre="Impossible de charger les commentaires"
                description="Vérifie ta connexion puis réessaie."
                action={
                  <Button variante="secondaire" onClick={() => void requete.refetch()}>
                    Réessayer
                  </Button>
                }
              />
            ) : liste.length > 0 ? (
              <>
                <ul className="flex flex-col">
                  {liste.map((commentaire) => {
                    const peutSupprimer = moi?.id === commentaire.auteur.id || estAuteurRessource
                    const enConfirmation = aConfirmer === commentaire.id
                    return (
                      <li key={commentaire.id} className="flex gap-3 border-t border-border-subtle py-4 first:border-t-0 first:pt-0">
                        <Avatar nom={commentaire.auteur.nom} photoUrl={commentaire.auteur.photo_url} taille="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <Link to={`/talents/${commentaire.auteur.id}`} className="py-1 text-sm font-semibold text-fg-1 hover:text-accent">
                              {commentaire.auteur.nom}
                            </Link>
                            <span className="text-xs text-fg-3">{LIBELLES_ROLE_PROFIL[commentaire.auteur.role_profil]}</span>
                            <span className="text-xs tabular-nums text-fg-3">
                              le {dateCourte(commentaire.created_at)} à {heure(commentaire.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-fg-1">{commentaire.contenu}</p>

                          {peutSupprimer && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {enConfirmation ? (
                                <>
                                  <Button
                                    taille="sm"
                                    variante="danger"
                                    chargement={suppression.isPending}
                                    onClick={() => suppression.mutate(commentaire.id)}
                                  >
                                    Confirmer la suppression
                                  </Button>
                                  <Button taille="sm" variante="discret" onClick={() => setAConfirmer(null)}>
                                    Annuler
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  taille="sm"
                                  variante="discret"
                                  aria-label={`Supprimer le commentaire de ${commentaire.auteur.nom}`}
                                  onClick={() => {
                                    suppression.reset()
                                    setAConfirmer(commentaire.id)
                                  }}
                                >
                                  Supprimer
                                </Button>
                              )}
                              {enConfirmation && suppression.isError && (
                                <span role="alert" className="text-xs text-danger">
                                  {messageErreur(suppression.error, { 403: 'Tu ne peux pas supprimer ce commentaire.', 404: 'Ce commentaire n’existe plus.' })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {dernierePage > 1 && (
                  <nav aria-label="Pagination des commentaires" className="flex items-center justify-between gap-3">
                    <Button variante="secondaire" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Précédent
                    </Button>
                    <span className="text-sm tabular-nums text-fg-2">
                      Page {page} / {dernierePage}
                    </span>
                    <Button variante="secondaire" disabled={page >= dernierePage} onClick={() => setPage((p) => p + 1)}>
                      Suivant
                    </Button>
                  </nav>
                )}
              </>
            ) : (
              <p className="text-sm text-fg-3">Aucun commentaire pour l’instant. Sois le premier à réagir.</p>
            )}
          </>
        )}
        <span role="status" className="sr-only">
          {annonce}
        </span>
      </CardCorps>
    </Card>
  )
}
