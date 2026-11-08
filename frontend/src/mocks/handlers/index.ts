import { handlersAuth } from './auth'
import { handlersCommentaires } from './commentaires'
import { handlersDashboard } from './dashboard'
import { handlersEquipes } from './equipes'
import { handlersMessagerie } from './messagerie'
import { handlersProfil } from './profil'
import { handlersProjets } from './projets'
import { handlersRessources } from './ressources'
import { handlersSuivi } from './suivi'
import { handlersTalents } from './talents'

/**
 * Point d'entrée unique des handlers MSW.
 *
 * Un fichier par domaine (auth, profil, projets…) s'agrège ici. Quand les
 * modules suivants ajouteront leurs routes, ils n'auront qu'à ajouter leur
 * handler à cette liste — sans toucher à `browser.ts` ni `server.ts`.
 */
export const handlers = [...handlersAuth, ...handlersProfil, ...handlersProjets, ...handlersEquipes, ...handlersMessagerie, ...handlersRessources, ...handlersCommentaires, ...handlersTalents, ...handlersSuivi, ...handlersDashboard]
