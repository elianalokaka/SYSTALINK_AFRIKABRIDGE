import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Serveur MSW — mode tests.
 *
 * Réservé aux tests (`vitest`), il intercepte `fetch`/XHR côté Node. Pas encore
 * utilisé tant que la suite de tests n'est pas branchée, mais il fait partie de
 * la structure cible (AGENTS.md § 4) : browser en dev, server en test.
 */
export const server = setupServer(...handlers)
