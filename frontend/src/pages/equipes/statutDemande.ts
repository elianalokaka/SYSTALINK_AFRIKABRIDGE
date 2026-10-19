import type { StatutDemande } from '../../types'
import { LIBELLES_STATUT_DEMANDE } from '../../lib/labels'

/** Libellé d'un statut de demande d'adhésion. */
export function libelleStatutDemande(statut: StatutDemande): string {
  return LIBELLES_STATUT_DEMANDE[statut]
}

/** Variante de badge associée — couleurs SÉMANTIQUES, jamais l'accent. */
export function varianteStatutDemande(statut: StatutDemande): 'attente' | 'succes' | 'danger' {
  switch (statut) {
    case 'en_attente':
      return 'attente'
    case 'acceptee':
      return 'succes'
    case 'refusee':
      return 'danger'
  }
}
