import { useQuery, useQueryClient } from '@tanstack/react-query'
import { chargerDemandesRecues, chargerTableauDeBord } from '../../api/dashboard'
import { useSession } from '../auth/SessionProvider'

/**
 * Tableau de bord de l'utilisateur connecté.
 *
 * Les demandes reçues passent par `fetchQuery(['demandes-recues'])` : même cache que le
 * badge de la navigation, donc les N appels du repli ne sont faits qu'UNE fois.
 */
export function useTableauDeBord() {
  const { profil } = useSession()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['dashboard'],
    enabled: profil !== null,
    queryFn: () =>
      chargerTableauDeBord({
        demandesRecues: () => queryClient.fetchQuery({ queryKey: ['demandes-recues'], queryFn: chargerDemandesRecues }),
      }),
  })
}
