import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { connexion, deconnexion, inscription, profilCourant } from '../../api/auth'
import { surExpirationSession } from '../../api/client'
import { ErreurApi } from '../../api/erreurs'
import type { ProfilPrive, UserLogin, UserRegister } from '../../types'

interface ValeurSession {
  /** L'utilisateur connecté, ou `null` s'il n'y a pas de session. */
  profil: ProfilPrive | null
  /** `true` pendant la résolution initiale de `GET /auth/me`. */
  chargement: boolean
  seConnecter: (corps: UserLogin) => Promise<ProfilPrive>
  sInscrire: (corps: UserRegister) => Promise<ProfilPrive>
  seDeconnecter: () => Promise<void>
}

const ContexteSession = createContext<ValeurSession | null>(null)

/**
 * Source unique de l'état de session.
 *
 * Au démarrage, `GET /auth/me` décide : un 401 est un ÉTAT NORMAL (« pas de
 * session »), pas une erreur à afficher — c'est exactement ce que dit le
 * contrat. Toute autre erreur est rejetée et laisse l'application sans profil.
 *
 * L'état est posé dans le cache de TanStack Query sous la clé `['session']` :
 * les mutations (connexion, inscription, déconnexion) écrivent dedans, et
 * l'expiration de session signalée par le client HTTP le vide. Un seul endroit
 * possède la vérité.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const requete = useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<ProfilPrive | null> => {
      try {
        return await profilCourant()
      } catch (erreur) {
        if (erreur instanceof ErreurApi && erreur.nonAuthentifie) return null
        throw erreur
      }
    },
    retry: false,
    /* La session ne change que par nos propres mutations : rien ne sert de la revalider. */
    staleTime: Number.POSITIVE_INFINITY,
  })

  /* Le client HTTP prévient quand une session expire en cours de route
     (un 401 sur n'importe quelle route). On vide l'état, et la route protégée
     redirige. C'est l'interface qui décide, pas le transport. */
  useEffect(() => {
    return surExpirationSession(() => {
      queryClient.setQueryData(['session'], null)
    })
  }, [queryClient])

  const seConnecter = useCallback(
    async (corps: UserLogin) => {
      const profil = await connexion(corps)
      queryClient.setQueryData(['session'], profil)
      return profil
    },
    [queryClient]
  )

  const sInscrire = useCallback(
    async (corps: UserRegister) => {
      const profil = await inscription(corps)
      queryClient.setQueryData(['session'], profil)
      return profil
    },
    [queryClient]
  )

  const seDeconnecter = useCallback(async () => {
    await deconnexion()
    queryClient.setQueryData(['session'], null)
  }, [queryClient])

  const valeur = useMemo<ValeurSession>(
    () => ({
      profil: requete.data ?? null,
      chargement: requete.isPending,
      seConnecter,
      sInscrire,
      seDeconnecter,
    }),
    [requete.data, requete.isPending, seConnecter, sInscrire, seDeconnecter]
  )

  return <ContexteSession.Provider value={valeur}>{children}</ContexteSession.Provider>
}

/** Accès à l'état de session. Doit être appelé sous `<SessionProvider>`. */
export function useSession(): ValeurSession {
  const contexte = useContext(ContexteSession)
  if (!contexte) {
    throw new Error('useSession doit être utilisé à l’intérieur de <SessionProvider>.')
  }
  return contexte
}
