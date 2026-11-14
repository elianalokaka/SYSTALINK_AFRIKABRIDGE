import { useQuery } from '@tanstack/react-query'
import { chargerDemandesRecues } from '../../api/dashboard'
import { useSession } from '../auth/SessionProvider'

export type { DemandesRecues } from '../../api/dashboard'

/**
 * Demandes d'adhésion EN ATTENTE sur les projets dont je suis propriétaire.
 *
 * C'est ce qui permet au propriétaire de SAVOIR qu'une demande l'attend : le
 * contrat n'a ni notification ni e-mail (hors périmètre confirmé), donc l'alerte
 * est un compteur visible dans la navigation et sur ses projets.
 *
 * COÛT ASSUMÉ (ASSUMPTIONS.md A-16) : N appels (un par projet possédé), détaillés
 * dans `chargerDemandesRecues`. Même clé de cache que le tableau de bord :
 * `['demandes-recues']` — une seule série d'appels pour les deux.
 */
export function useDemandesRecues() {
  const { profil } = useSession()

  return useQuery({
    queryKey: ['demandes-recues'],
    enabled: profil !== null,
    queryFn: chargerDemandesRecues,
  })
}
