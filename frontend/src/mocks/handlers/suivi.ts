import { http, HttpResponse } from 'msw'
import {
  abonnementsDb,
  abonnesDb,
  idUtilisateurConnecte,
  nePlusSuivreDb,
  nombreAbonnesDb,
  suitDb,
  suivreDb,
} from '../db'

/**
 * Mocks du suivi entre développeurs (P1), alignés sur le contrat :
 *
 *   POST   /users/{id}/follow     201 | 409 (déjà suivi, corps = état à jour) | 422 (soi-même) | 404
 *   DELETE /users/{id}/follow     200 (idempotent) | 404
 *   GET    /users/{id}/followers  200 paginé, du plus récent au plus ancien | 404
 *   GET    /users/{id}/following  200 paginé | 404
 *
 * `FollowState` = `is_following` + `followers_count` du membre CIBLE après l'opération.
 */

const non401 = () => HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
const non404 = () => HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })

function etat(userId: number, cibleId: number) {
  return { is_following: suitDb(userId, cibleId), followers_count: nombreAbonnesDb(cibleId) }
}

function paginer<T>(elements: T[], request: Request) {
  const sp = new URL(request.url).searchParams
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1)
  const perPage = Math.min(50, Math.max(1, Number(sp.get('per_page') ?? '15') || 15))
  const debut = (page - 1) * perPage
  return {
    data: elements.slice(debut, debut + perPage),
    meta: {
      current_page: page,
      per_page: perPage,
      total: elements.length,
      last_page: Math.max(1, Math.ceil(elements.length / perPage)),
    },
  }
}

export const handlersSuivi = [
  http.post('/api/v1/users/:id/follow', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()
    const cibleId = Number(params.id)
    const resultat = suivreDb(userId, cibleId)
    if (resultat === 'introuvable') return non404()
    if (resultat === 'soi') {
      return HttpResponse.json(
        { message: 'You cannot follow yourself.', errors: { id: ['Impossible de se suivre soi-même.'] } },
        { status: 422 }
      )
    }
    return HttpResponse.json(etat(userId, cibleId), { status: resultat === 'cree' ? 201 : 409 })
  }),

  http.delete('/api/v1/users/:id/follow', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()
    const cibleId = Number(params.id)
    if (nePlusSuivreDb(userId, cibleId) === 'introuvable') return non404()
    return HttpResponse.json(etat(userId, cibleId), { status: 200 })
  }),

  http.get('/api/v1/users/:id/followers', ({ params, request }) => {
    if (!idUtilisateurConnecte()) return non401()
    const liste = abonnesDb(Number(params.id))
    return liste ? HttpResponse.json(paginer(liste, request), { status: 200 }) : non404()
  }),

  http.get('/api/v1/users/:id/following', ({ params, request }) => {
    if (!idUtilisateurConnecte()) return non401()
    const liste = abonnementsDb(Number(params.id))
    return liste ? HttpResponse.json(paginer(liste, request), { status: 200 }) : non404()
  }),
]
