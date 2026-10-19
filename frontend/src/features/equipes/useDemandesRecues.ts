import { useQuery } from '@tanstack/react-query'
import { demandesDuProjet } from '../../api/equipes'
import { mesProjets } from '../../api/projets'
import { useSession } from '../auth/SessionProvider'

export interface DemandesRecues {
  /** Nombre total de demandes en attente sur tous mes projets. */
  total: number
  /** Demandes en attente, par id de projet (seulement les projets que je possède). */
  parProjet: Record<number, number>
}

/**
 * Demandes d'adhésion EN ATTENTE sur les projets dont je suis propriétaire.
 *
 * C'est ce qui permet au propriétaire de SAVOIR qu'une demande l'attend : le
 * contrat n'a ni notification ni e-mail (hors périmètre confirmé), donc l'alerte
 * est un compteur visible dans la navigation et sur ses projets.
 *
 * COÛT ASSUMÉ (ASSUMPTIONS.md A-16) : le contrat n'expose pas de total « reçues »
 * hors `GET /me/dashboard` (P1). On lit donc mes projets possédés, puis les
 * demandes de chacun EN PARALLÈLE (`per_page: 1` : seul `meta.total` nous
 * intéresse). Un projet dont l'appel échoue est ignoré : il ne fait pas tomber
 * les autres. Quand `GET /me/dashboard` sera livré, le total pourra venir de
 * `demandes_recues_en_attente` — le détail par projet restera à N appels.
 *
 * Les projets `termine` sont ignorés : ils n'acceptent plus de demandes.
 */
export function useDemandesRecues() {
  const { profil } = useSession()

  return useQuery({
    queryKey: ['demandes-recues'],
    enabled: profil !== null,
    queryFn: async (): Promise<DemandesRecues> => {
      const possedes = await mesProjets({ role_equipe: 'proprietaire', per_page: 50 })
      const ouverts = possedes.data.filter((projet) => projet.statut !== 'termine')

      const reponses = await Promise.allSettled(
        ouverts.map((projet) => demandesDuProjet(projet.id, 'en_attente', { per_page: 1 }))
      )

      const parProjet: Record<number, number> = {}
      let total = 0
      reponses.forEach((reponse, index) => {
        if (reponse.status !== 'fulfilled') return
        const nombre = reponse.value.meta.total
        parProjet[ouverts[index].id] = nombre
        total += nombre
      })
      return { total, parProjet }
    },
  })
}
