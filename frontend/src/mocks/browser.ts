import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * Worker MSW — mode développement.
 *
 * Démarré de façon conditionnelle dans `main.tsx` UNIQUEMENT quand
 * `VITE_USE_MOCKS === 'true'`. C'est le seul endroit du frontend qui connaît
 * l'existence des mocks : aucun composant n'en sait rien.
 */
export const worker = setupWorker(...handlers)
