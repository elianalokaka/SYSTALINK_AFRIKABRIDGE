import { http, HttpResponse } from 'msw'
import { idUtilisateurConnecte, listerTalentsDb, portfolioDb, profilPublicDb, projetPour } from '../db'

/**
 * Mocks de la recherche de talents, du profil public et du portfolio.
 *
 *   - `GET /users` : membres paginés, l'utilisateur connecté EST EXCLU ;
 *     filtres `q` (nom + bio, jamais l'e-mail), `competence_ids[]` + `competence_match`
 *     (any|all), `domaine`, `pays`, `region`, `role_profil` ;
 *   - `GET /users/{id}` : profil PUBLIC (jamais d'e-mail) — 404 si inconnu ;
 *   - `GET /users/{id}/portfolio` : projets `termine` dont le membre fait partie.
 *
 * Le suivi (follow, followers, following) est dans `suivi.ts` ; suggestions : non construites.
 */

function non401() {
  return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
}

export const handlersTalents = [
  http.get('/api/v1/users', ({ request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()

    const sp = new URL(request.url).searchParams
    const page = Math.max(1, Number(sp.get('page') ?? '1') || 1)
    const perPage = Math.min(50, Math.max(1, Number(sp.get('per_page') ?? '15') || 15))

    const match = sp.get('competence_match') === 'all' ? 'all' : 'any'
    const resultats = listerTalentsDb(userId, {
      q: sp.get('q'),
      competenceIds: sp.getAll('competence_ids[]').map(Number).filter((n) => Number.isFinite(n)),
      competenceMatch: match,
      domaine: sp.get('domaine'),
      pays: sp.get('pays'),
      region: sp.get('region'),
      roleProfil: sp.get('role_profil'),
    })

    const debut = (page - 1) * perPage
    return HttpResponse.json(
      {
        data: resultats.slice(debut, debut + perPage),
        meta: {
          current_page: page,
          per_page: perPage,
          total: resultats.length,
          last_page: Math.max(1, Math.ceil(resultats.length / perPage)),
        },
      },
      { status: 200 }
    )
  }),

  http.get('/api/v1/users/:id/portfolio', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()
    const id = Number(params.id)
    if (!profilPublicDb(id)) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    return HttpResponse.json({ data: portfolioDb(id).map((projet) => projetPour(projet, userId)) }, { status: 200 })
  }),

  http.get('/api/v1/users/:id', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()
    const profil = profilPublicDb(Number(params.id), userId)
    if (!profil) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    return HttpResponse.json(profil, { status: 200 })
  }),
]
