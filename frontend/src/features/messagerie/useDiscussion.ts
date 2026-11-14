import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { envoyerMessage, lireMessages, supprimerMessage } from '../../api/messages'
import { ErreurApi } from '../../api/erreurs'
import {
  ajouterEnvoye,
  fusionnerHistorique,
  fusionnerPoll,
  retirerMessage,
  TAILLE_PAGE,
  type EtatDiscussion,
} from './fil'

/** Intervalle du polling — fixé par le contrat (« toutes les 5 secondes »). */
export const INTERVALLE_POLLING_MS = 5_000

/** 403 (plus membre) et 404 (projet supprimé) sont définitifs : inutile de continuer à interroger. */
function estDefinitive(erreur: unknown): boolean {
  return erreur instanceof ErreurApi && (erreur.nonAutorise || erreur.introuvable)
}

/**
 * Discussion d'un projet : lecture par POLLING, envoi, suppression, historique.
 *
 * L'état complet (messages + curseurs) vit dans le cache de TanStack Query sous
 * `['discussion', projetId]` : quitter l'onglet puis y revenir ne perd rien, et
 * le cache est purgé au changement de compte comme le reste.
 *
 * Le polling est le `refetchInterval` de la requête : il s'arrête tout seul
 * quand l'onglet du navigateur est masqué, et reprend (avec un poll immédiat)
 * au retour. Il s'arrête aussi quand le composant est démonté.
 */
export function useDiscussion(projetId: number) {
  const queryClient = useQueryClient()
  const cle = ['discussion', projetId] as const
  const [historiqueEnCours, setHistoriqueEnCours] = useState(false)

  const requete = useQuery({
    queryKey: cle,
    staleTime: 0,
    refetchInterval: (query) => (estDefinitive(query.state.error) ? false : INTERVALLE_POLLING_MS),
    refetchOnWindowFocus: true,
    retry: (tentatives, erreur) => !estDefinitive(erreur) && tentatives < 1,
    queryFn: async (): Promise<EtatDiscussion> => {
      const avant = queryClient.getQueryData<EtatDiscussion>(cle)
      const fil = await lireMessages(
        projetId,
        avant
          ? { apres_id: avant.dernierId || undefined, depuis: avant.serverTime ?? undefined }
          : { limit: TAILLE_PAGE }
      )
      /* On fusionne dans l'état LE PLUS RÉCENT (relu après l'attente) : pendant
         ce poll, l'utilisateur a pu charger l'historique ou envoyer un message. */
      return fusionnerPoll(queryClient.getQueryData<EtatDiscussion>(cle), fil)
    },
  })

  const etat = requete.data

  /* Poll plein (≥ 50 messages) : on a du retard, on rattrape sans attendre 5 s. */
  const enRetard = etat?.enRetard ?? false
  const { refetch } = requete
  useEffect(() => {
    if (!enRetard) return
    const minuteur = window.setTimeout(() => void refetch(), 150)
    return () => window.clearTimeout(minuteur)
  }, [enRetard, etat?.dernierId, refetch])

  const chargerHistorique = useCallback(async () => {
    const actuel = queryClient.getQueryData<EtatDiscussion>(cle)
    const plusAncien = actuel?.messages[0]?.id
    if (!actuel || plusAncien === undefined || historiqueEnCours) return
    setHistoriqueEnCours(true)
    try {
      const fil = await lireMessages(projetId, { avant_id: plusAncien, limit: TAILLE_PAGE })
      queryClient.setQueryData<EtatDiscussion>(cle, (ancien) =>
        ancien ? fusionnerHistorique(ancien, fil) : ancien
      )
    } finally {
      setHistoriqueEnCours(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `cle` est dérivée de projetId
  }, [queryClient, projetId, historiqueEnCours])

  const envoyer = useCallback(
    async (contenu: string) => {
      const message = await envoyerMessage(projetId, contenu)
      queryClient.setQueryData<EtatDiscussion>(cle, (ancien) => ajouterEnvoye(ancien, message))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `cle` est dérivée de projetId
    [queryClient, projetId]
  )

  const supprimer = useCallback(
    async (messageId: number) => {
      try {
        await supprimerMessage(projetId, messageId)
      } catch (erreur) {
        /* Déjà supprimé ailleurs : le résultat voulu est atteint, on retire quand même. */
        if (!(erreur instanceof ErreurApi && erreur.introuvable)) throw erreur
      }
      queryClient.setQueryData<EtatDiscussion | undefined>(cle, (ancien) => retirerMessage(ancien, messageId))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `cle` est dérivée de projetId
    [queryClient, projetId]
  )

  return {
    messages: etat?.messages ?? [],
    chargement: requete.isPending,
    /** Erreur sans aucune donnée : on ne peut rien afficher. */
    erreurFatale: requete.isError && !etat ? requete.error : null,
    /** Un poll a échoué mais le fil reste affiché : bandeau discret « reconnexion ». */
    reconnexion: requete.isError && etat !== undefined,
    historiqueComplet: etat?.historiqueComplet ?? false,
    historiqueEnCours,
    chargerHistorique,
    envoyer,
    supprimer,
    reessayer: () => void requete.refetch(),
  }
}
