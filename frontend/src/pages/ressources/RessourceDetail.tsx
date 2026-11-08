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
  SkeletonTexte,
} from '../../components/ui'
import { detailRessource, supprimerRessource } from '../../api/ressources'
import { detailProjet } from '../../api/projets'
import { ErreurApi, messageErreur } from '../../api/erreurs'
import { useSession } from '../../features/auth/SessionProvider'
import { rafraichirRessources } from '../../lib/cache'
import { LIBELLES_TYPE_RESSOURCE, LIBELLES_VISIBILITE_RESSOURCE, LIBELLES_ROLE_PROFIL } from '../../lib/labels'
import { estLivre } from '../../lib/priorites'
import { FilCommentaires } from './FilCommentaires'
import { dateCourte, domaineDe, fichierSur, lienSur } from './outils'

/**
 * Détail d'une ressource.
 *
 * Qui peut modifier / supprimer : l'AUTEUR, ou le PROPRIÉTAIRE du projet lié.
 * Le front n'affiche les boutons que pour ces deux cas ; la vraie barrière reste
 * la Policy du serveur (403), dont on affiche le message si elle refuse.
 */
export function RessourceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profil } = useSession()
  const [erreur, setErreur] = useState<string | null>(null)
  const [suppression, setSuppression] = useState(false)
  const [copie, setCopie] = useState(false)

  const requete = useQuery({
    queryKey: ['ressource', id],
    queryFn: () => detailRessource(Number(id)),
    enabled: id != null,
    retry: (tentatives, e) => !(e instanceof ErreurApi && (e.introuvable || e.nonAutorise)) && tentatives < 1,
  })
  const ressource = requete.data

  /* Le projet lié : son nom (lien) et son propriétaire (droit de gestion). Même clé
     que le détail d'un projet → partage le cache. */
  const projetLie = useQuery({
    queryKey: ['projet', String(ressource?.projet_id)],
    queryFn: () => detailProjet(ressource!.projet_id!),
    enabled: ressource?.projet_id != null,
  })

  async function onSupprimer() {
    if (!ressource || !window.confirm('Supprimer définitivement cette ressource ?')) return
    setSuppression(true)
    setErreur(null)
    try {
      await supprimerRessource(ressource.id)
    } catch (e) {
      setErreur(messageErreur(e, { 403: "Seuls l'auteur et le propriétaire du projet peuvent la supprimer." }))
      setSuppression(false)
      return
    }
    navigate('/ressources', { replace: true })
    queryClient.removeQueries({ queryKey: ['ressource', String(ressource.id)] })
    rafraichirRessources(queryClient)
  }

  async function copierCode() {
    if (!ressource?.contenu_code) return
    try {
      await navigator.clipboard.writeText(ressource.contenu_code)
      setCopie(true)
      window.setTimeout(() => setCopie(false), 2000)
    } catch {
      setErreur('Copie impossible : sélectionne le code et copie-le manuellement.')
    }
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

  if (!ressource) {
    const interdit = requete.error instanceof ErreurApi && requete.error.nonAutorise
    return (
      <EmptyState
        titre={interdit ? 'Ressource réservée' : 'Ressource introuvable'}
        description={
          interdit
            ? "Cette ressource est réservée aux membres d'un projet."
            : "Cette ressource n'existe pas ou a été supprimée."
        }
        action={
          <Button variante="secondaire" onClick={() => navigate('/ressources')}>
            Retour à la bibliothèque
          </Button>
        }
      />
    )
  }

  const estAuteur = ressource.auteur.id === profil?.id
  const estProprietaireDuProjet = projetLie.data?.createur.id === profil?.id
  const peutGerer = estAuteur || estProprietaireDuProjet

  const lien = lienSur(ressource.url)
  const fichier = fichierSur(ressource.fichier_url)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={'/ressources'} className="mb-3 inline-flex min-h-9 items-center text-sm text-fg-2 hover:text-fg-1">
          ← Bibliothèque
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge variante="accent">{LIBELLES_TYPE_RESSOURCE[ressource.type]}</Badge>
              <Badge variante={ressource.visibilite === 'projet' ? 'info' : 'neutre'}>
                {LIBELLES_VISIBILITE_RESSOURCE[ressource.visibilite]}
              </Badge>
            </div>
            <h1 className="break-words text-xl font-semibold text-fg-1">{ressource.titre}</h1>
          </div>

          {peutGerer && (
            <div className="flex gap-2">
              <Button variante="secondaire" onClick={() => navigate(`/ressources/${ressource.id}/modifier`)}>
                Modifier
              </Button>
              <Button variante="danger" chargement={suppression} onClick={() => void onSupprimer()}>
                Supprimer
              </Button>
            </div>
          )}
        </div>

        {erreur && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {erreur}
          </p>
        )}
      </div>

      {ressource.description && (
        <Card>
          <CardEntete titre="Description" />
          <CardCorps>
            <p className="whitespace-pre-wrap break-words text-sm text-fg-1">{ressource.description}</p>
          </CardCorps>
        </Card>
      )}

      {lien && (
        <Card>
          <CardEntete titre="Lien" />
          <CardCorps>
            <a
              href={lien}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-accent hover:text-accent-hover"
            >
              {domaineDe(lien)} ↗
            </a>
            <p className="mt-1 break-all text-xs text-fg-3">{lien}</p>
          </CardCorps>
        </Card>
      )}

      {ressource.contenu_code && (
        <Card>
          <CardEntete titre={ressource.langage ? `Code · ${ressource.langage}` : 'Code'} />
          <CardCorps className="flex flex-col gap-3">
            <pre className="max-h-96 overflow-auto rounded-md border border-border-subtle bg-surface-1 p-3 font-mono text-xs leading-relaxed text-fg-1">
              <code>{ressource.contenu_code}</code>
            </pre>
            <div>
              <Button taille="sm" variante="secondaire" onClick={() => void copierCode()}>
                {copie ? 'Copié ✓' : 'Copier le code'}
              </Button>
            </div>
          </CardCorps>
        </Card>
      )}

      {fichier && (
        <Card>
          <CardEntete titre="Fichier" />
          <CardCorps>
            <a href={fichier} download target="_blank" rel="noopener noreferrer">
              <Button variante="secondaire">Télécharger le fichier</Button>
            </a>
          </CardCorps>
        </Card>
      )}

      {ressource.competences.length > 0 && (
        <Card>
          <CardEntete titre="Compétences" compteur={ressource.competences.length} />
          <CardCorps className="flex flex-wrap gap-1.5">
            {ressource.competences.map((comp) => (
              <Badge key={comp.id} variante="accent">
                {comp.nom}
              </Badge>
            ))}
          </CardCorps>
        </Card>
      )}

      <Card>
        <CardEntete titre="Partagée par" />
        <CardCorps className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar nom={ressource.auteur.nom} photoUrl={ressource.auteur.photo_url} taille="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg-1">{ressource.auteur.nom}</p>
              <p className="truncate text-xs text-fg-2">
                {LIBELLES_ROLE_PROFIL[ressource.auteur.role_profil]} · le {dateCourte(ressource.created_at)}
              </p>
            </div>
          </div>
          {ressource.projet_id !== null && (
            <Link
              to={`/projets/${ressource.projet_id}`}
              className="text-sm text-accent hover:text-accent-hover"
            >
              Projet : {projetLie.data?.nom ?? `n°${ressource.projet_id}`}
            </Link>
          )}
        </CardCorps>
      </Card>

      {estLivre('commentaires') && <FilCommentaires ressource={ressource} />}
    </div>
  )
}
