import { handlersAuth } from './auth'
import { handlersProfil } from './profil'
import { handlersProjets } from './projets'

/**
 * Point d'entrée unique des handlers MSW.
 *
 * Un fichier par domaine (auth, profil, projets…) s'agrège ici. Quand les
 * modules suivants ajouteront leurs routes, ils n'auront qu'à ajouter leur
 * handler à cette liste — sans toucher à `browser.ts` ni `server.ts`.
 */
export const handlers = [...handlersAuth, ...handlersProfil, ...handlersProjets]
