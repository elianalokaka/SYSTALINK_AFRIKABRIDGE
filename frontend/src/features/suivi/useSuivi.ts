import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ErreurApi } from '../../api/erreurs'
import { nePlusSuivre, suivre } from '../../api/suivi'
import type { Page } from '../../api/projets'
import { rafraichirSuivi } from '../../lib/cache'
import type { FollowState, Profil, Talent } from '../../types'
import { useSession } from '../auth/SessionProvider'

/**
 * Suivre / ne plus suivre un membre, avec mise à jour OPTIMISTE.
 *
 * Le contrat le demande (« mise à jour optimiste du compteur ») : au clic,
 * `is_following` et `followers_count` changent tout de suite dans les deux
 * endroits où le membre est affiché :
 *   - `['talent', id]`  : son profil public (aussi son `following_count`, pour MOI) ;
 *   - `['talents', …]`  : les pages de la recherche de talents ;
 *   - `['suggestions-talents']` : cartes du tableau de bord.
 * Si le serveur échoue, on restaure l'état d'avant. Quand il répond, on
 * remplace les valeurs optimistes par `FollowState` (la vérité du serveur),
 * puis on invalide les caches concernés.
 */

type Contexte = { avant: Array<[readonly unknown[], unknown]> }

export function useSuivi(membreId: number) {
  const queryClient = useQueryClient()
  const { profil: moi } = useSession()
  const cleProfil = ['talent', String(membreId)] as const
  const cleMoi = moi ? (['talent', String(moi.id)] as const) : null

  function appliquer(etat: FollowState | { is_following: boolean; delta: number }) {
    const ajuster = <T extends { id: number; is_following: boolean; followers_count: number }>(m: T): T => {
      if (m.id !== membreId) return m
      return 'delta' in etat
        ? { ...m, is_following: etat.is_following, followers_count: Math.max(0, m.followers_count + etat.delta) }
        : { ...m, is_following: etat.is_following, followers_count: etat.followers_count }
    }
    queryClient.setQueryData<Profil>(cleProfil, (p) => (p ? ajuster(p) : p))
    queryClient.setQueriesData<Page<Talent>>({ queryKey: ['talents'] }, (page) =>
      page ? { ...page, data: page.data.map(ajuster) } : page
    )
    queryClient.setQueriesData<Talent[]>({ queryKey: ['suggestions-talents'] }, (liste) =>
      liste ? liste.map(ajuster) : liste
    )
  }

  function ajusterMesAbonnements(delta: number) {
    if (!cleMoi) return
    queryClient.setQueryData<Profil>(cleMoi, (p) =>
      p ? { ...p, following_count: Math.max(0, p.following_count + delta) } : p
    )
  }

  const mutation = useMutation<FollowState, Error, boolean, Contexte>({
    mutationFn: (veutSuivre) => (veutSuivre ? suivre(membreId) : nePlusSuivre(membreId)),

    onMutate: async (veutSuivre) => {
      await queryClient.cancelQueries({ queryKey: ['talent'] })
      await queryClient.cancelQueries({ queryKey: ['talents'] })
      await queryClient.cancelQueries({ queryKey: ['suggestions-talents'] })
      const avant: Contexte['avant'] = [
        ...queryClient.getQueriesData({ queryKey: ['talent'] }),
        ...queryClient.getQueriesData({ queryKey: ['talents'] }),
        ...queryClient.getQueriesData({ queryKey: ['suggestions-talents'] }),
      ]
      const delta = veutSuivre ? 1 : -1
      appliquer({ is_following: veutSuivre, delta })
      ajusterMesAbonnements(delta)
      return { avant }
    },

    onError: (erreur, veutSuivre, contexte) => {
      if (veutSuivre && erreur instanceof ErreurApi && erreur.conflit) {
        appliquer({ is_following: true, delta: 0 })
        return
      }
      contexte?.avant.forEach(([cle, donnees]) => queryClient.setQueryData(cle, donnees))
    },

    onSuccess: (etat) => appliquer(etat),

    onSettled: () => rafraichirSuivi(queryClient),
  })

  return {
    /** `true` pendant l'appel : le bouton est désactivé (pas de double clic). */
    enCours: mutation.isPending,
    erreur: mutation.error,
    basculer: (veutSuivre: boolean) => mutation.mutate(veutSuivre),
  }
}
