import { handlersAuth } from './auth'

/**
 * Point d'entrée unique des handlers MSW.
 *
 * Un fichier par domaine (auth, projets, messages…) s'agrège ici. Quand les
 * modules suivants ajouteront leurs routes, ils n'auront qu'à ajouter leur
 * handler à cette liste — sans toucher à `browser.ts` ni `server.ts`.
 */
export const handlers = [...handlersAuth]
