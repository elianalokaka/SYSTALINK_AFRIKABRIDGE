import { http, HttpResponse } from 'msw'
import {
  creerMessageDb,
  estMembre,
  idUtilisateurConnecte,
  membresDuProjet,
  messageParIdDb,
  messagesDuProjetDb,
  projetParId,
  supprimerMessageDb,
  supprimesDepuisDb,
} from '../db'

/**
 * Mocks du module Messagerie.
 *
 * Fidèles au contrat :
 *   - lecture / envoi : membres uniquement (403) ;
 *   - messages « du plus ancien au plus récent » ; `supprimes` vide sans `depuis` ;
 *   - `meta.server_time` : horloge du serveur, à renvoyer telle quelle dans `depuis` ;
 *   - suppression : auteur ou propriétaire (403 sinon), logique (soft delete).
 *
 * ── Simulation d'équipe (MOCKS UNIQUEMENT) ────────────────────────────────────
 * La base du mock vit dans l'onglet : un seul utilisateur y écrit. Pour pouvoir
 * VOIR le polling et les suppressions distantes à l'œuvre, un coéquipier simulé :
 *   - répond environ 6 à 9 s après chacun de tes messages ;
 *   - si ton message commence par `/bot`, poste un message éphémère puis le
 *     SUPPRIME 8 s plus tard → tu vois le message arriver (polling) puis
 *     disparaître (`supprimes`).
 * Rien de tout cela n'existe côté vrai backend : ce fichier disparaît avec les mocks.
 */

const REPONSES = [
  'Bien reçu 👍',
  "Ok, je regarde ça et je reviens vers toi.",
  'Bonne idée, on part là-dessus.',
  "Je suis dispo ce soir si tu veux qu'on en parle.",
  'Merci pour la mise à jour !',
]

function simulerEquipe(projetId: number, auteurId: number, contenu: string): void {
  const autres = membresDuProjet(projetId).filter((id) => id !== auteurId)
  if (autres.length === 0) return
  const coequipier = autres[Math.floor(Math.random() * autres.length)]

  if (contenu.trim().toLowerCase().startsWith('/bot')) {
    setTimeout(() => {
      const ephemere = creerMessageDb(projetId, coequipier, 'Message éphémère : il sera supprimé dans 8 secondes.')
      setTimeout(() => supprimerMessageDb(ephemere.id), 8_000)
    }, 3_000)
    return
  }

  const delai = 6_000 + Math.random() * 3_000
  setTimeout(() => {
    creerMessageDb(projetId, coequipier, REPONSES[Math.floor(Math.random() * REPONSES.length)])
  }, delai)
}

function entier(valeur: string | null): number | undefined {
  if (valeur === null || valeur === '') return undefined
  const n = Number(valeur)
  return Number.isInteger(n) ? n : NaN
}

export const handlersMessagerie = [
  /* Lire le fil. */
  http.get('/api/v1/projects/:id/messages', ({ request, params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const projetId = Number(params.id)
    if (!projetParId(projetId)) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (!estMembre(projetId, userId)) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const sp = new URL(request.url).searchParams
    const apres_id = entier(sp.get('apres_id'))
    const avant_id = entier(sp.get('avant_id'))
    const limit = entier(sp.get('limit')) ?? 50
    const depuis = sp.get('depuis')

    const erreurs: Record<string, string[]> = {}
    if (Number.isNaN(apres_id)) erreurs.apres_id = ['apres_id doit être un entier.']
    if (Number.isNaN(avant_id)) erreurs.avant_id = ['avant_id doit être un entier.']
    if (Number.isNaN(limit) || limit < 1 || limit > 100) erreurs.limit = ['limit doit être compris entre 1 et 100.']
    if (depuis !== null && Number.isNaN(Date.parse(depuis))) erreurs.depuis = ['depuis doit être une date ISO 8601.']
    if (Object.keys(erreurs).length > 0) {
      return HttpResponse.json({ message: 'The given data was invalid.', errors: erreurs }, { status: 422 })
    }

    /* L'horloge est lue AVANT la requête : un message supprimé pendant le calcul
       sera de toute façon repris au tour suivant (`deleted_at >= depuis`). */
    const serverTime = new Date().toISOString()
    return HttpResponse.json(
      {
        data: messagesDuProjetDb(projetId, { apres_id, avant_id, limit }),
        supprimes: depuis ? supprimesDepuisDb(projetId, depuis) : [],
        meta: { server_time: serverTime },
      },
      { status: 200 }
    )
  }),

  /* Envoyer un message. */
  http.post('/api/v1/projects/:id/messages', async ({ request, params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const projetId = Number(params.id)
    if (!projetParId(projetId)) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (!estMembre(projetId, userId)) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const corps = (await request.json().catch(() => ({}))) as { contenu?: unknown }
    const contenu = typeof corps.contenu === 'string' ? corps.contenu : ''
    if (contenu.trim().length < 1 || contenu.length > 2000) {
      return HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: { contenu: ['Le message doit contenir entre 1 et 2000 caractères.'] },
        },
        { status: 422 }
      )
    }

    const message = creerMessageDb(projetId, userId, contenu)
    simulerEquipe(projetId, userId, contenu)
    return HttpResponse.json(message, { status: 201 })
  }),

  /* Supprimer un message (auteur ou propriétaire). */
  http.delete('/api/v1/projects/:id/messages/:messageId', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const projetId = Number(params.id)
    const projet = projetParId(projetId)
    if (!projet) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })

    const message = messageParIdDb(projetId, Number(params.messageId))
    if (!message) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })

    if (message.auteur.id !== userId && projet.createur.id !== userId) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    supprimerMessageDb(message.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
