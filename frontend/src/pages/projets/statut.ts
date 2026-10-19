import type { StatutProjet } from '../../types'
import { LIBELLES_STATUT_PROJET } from '../../lib/labels'

/** Libellé affiché d'un statut de projet (imposé par le contrat). */
export function libelleStatut(statut: StatutProjet): string {
  return LIBELLES_STATUT_PROJET[statut]
}

/**
 * Variante de badge associée à un statut.
 * La couleur d'un statut est une couleur SÉMANTIQUE, jamais l'accent — celui-ci
 * est réservé à l'ACTION. Rappel du mapping (AGENTS.md § 3 ter) :
 *   recrutement → « Ouvert »  → succès
 *   en_cours    → « En cours »→ info
 *   termine     → « Terminé » → neutre (un projet fini recule visuellement)
 */
export function varianteStatut(statut: StatutProjet): 'succes' | 'info' | 'neutre' {
  switch (statut) {
    case 'recrutement':
      return 'succes'
    case 'en_cours':
      return 'info'
    case 'termine':
      return 'neutre'
  }
}
