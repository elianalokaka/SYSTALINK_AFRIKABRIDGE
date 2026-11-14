import type { StatutDemande } from '../../types'

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
