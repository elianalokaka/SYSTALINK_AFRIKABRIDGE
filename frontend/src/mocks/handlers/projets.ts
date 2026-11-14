import { http, HttpResponse } from 'msw'
import {
  cartePour,
  creerProjetDb,
  idUtilisateurConnecte,
  listeProjets,
  mesProjets,
  mettreAJourProjetDb,
  projetParId,
  projetPour,
  supprimerProjetDb,
} from '../db'
import type { ProjetCreate, ProjetUpdate } from '../../types'

/**
 * Mocks du module Projets.
 *
 * Fidèles à la sémantique du contrat :
 *   - `GET /projects` → CARTES paginées `{ data, meta }`, filtrables ;
 *   - `GET /me/projects` → mes projets (dont je suis membre) ;
 *   - `GET /projects/{id}` → détail complet ;
 *   - `POST /projects` → `termine` refusé à la création (422) ;
 *   - `PATCH` / `DELETE` → propriétaire uniquement (403 sinon).
 */

function paginer<T>(items: T[], page: number, perPage: number) {
  const debut = (page - 1) * perPage
  return {
    data: items.slice(debut, debut + perPage),
    meta: {
      current_page: page,
      per_page: perPage,
      total: items.length,
      last_page: Math.max(1, Math.ceil(items.length / perPage)),
    },
  }
}

/** Lit `page` et `per_page` (défaut 15, plafond 50) depuis la query string. */
function paginationDepuis(request: Request) {
  const sp = new URL(request.url).searchParams
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1)
  const perPage = Math.min(50, Math.max(1, Number(sp.get('per_page') ?? '15') || 15))
  return { page, perPage }
}

export const handlersProjets = [
  /* Explorer / rechercher les projets. */
  http.get('/api/v1/projects', ({ request }) => {
    const userId = idUtilisateurConnecte()
    const sp = new URL(request.url).searchParams

    let resultats = listeProjets()

    const q = sp.get('q')
    if (q) {
      const terme = q.toLowerCase()
      resultats = resultats.filter(
        (projet) =>
          projet.nom.toLowerCase().includes(terme) ||
          projet.description.toLowerCase().includes(terme)
      )
    }

    const domaine = sp.get('domaine')
    if (domaine) resultats = resultats.filter((projet) => projet.domaines.includes(domaine as never))

    const statut = sp.get('statut')
    if (statut) resultats = resultats.filter((projet) => projet.statut === statut)

    /* Axios sérialise `competence_ids` en `competence_ids[]=1&competence_ids[]=2`. */
    const competenceIds = sp
      .getAll('competence_ids[]')
      .map(Number)
      .filter((n) => Number.isFinite(n))
    if (competenceIds.length > 0) {
      resultats = resultats.filter((projet) =>
        projet.competences_recherchees.some((comp) => competenceIds.includes(comp.id))
      )
    }

    if (sp.get('places_disponibles') === 'true') {
      resultats = resultats.filter(
        (projet) => projet.nombre_membres_actuel < projet.nombre_membres_souhaite
      )
    }

    const { page, perPage } = paginationDepuis(request)
    const pagee = paginer(resultats, page, perPage)
    return HttpResponse.json(
      { data: pagee.data.map((projet) => cartePour(projet, userId)), meta: pagee.meta },
      { status: 200 }
    )
  }),

  /* Mes projets. */
  http.get('/api/v1/me/projects', ({ request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const { page, perPage } = paginationDepuis(request)
    const sp = new URL(request.url).searchParams
    const pagee = paginer(
      mesProjets(userId, { role_equipe: sp.get('role_equipe'), statut: sp.get('statut') }),
      page,
      perPage
    )
    return HttpResponse.json(
      { data: pagee.data.map((projet) => cartePour(projet, userId)), meta: pagee.meta },
      { status: 200 }
    )
  }),

  /* Détail complet. */
  http.get('/api/v1/projects/:id', ({ params }) => {
    const userId = idUtilisateurConnecte()
    const id = Number(params.id)
    const projet = projetParId(id)
    if (!projet) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    return HttpResponse.json(projetPour(projet, userId), { status: 200 })
  }),

  /* Créer un projet. */
  http.post('/api/v1/projects', async ({ request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const corps = (await request.json()) as ProjetCreate

    /* Règle du contrat : un projet ne peut pas naître `termine`.
       `ProjetCreate.statut` est typé sans `termine`, mais un client malformé
       pourrait l'envoyer : on le détecte quand même, comme le ferait Laravel. */
    if ((corps.statut as string) === 'termine') {
      return HttpResponse.json(
        {
          message: 'The selected statut is invalid.',
          errors: { statut: ['Un projet ne peut pas naître déjà terminé.'] },
        },
        { status: 422 }
      )
    }

    const projet = creerProjetDb(userId, corps)
    return HttpResponse.json(projet, { status: 201 })
  }),

  /* Modifier un projet (propriétaire). */
  http.patch('/api/v1/projects/:id', async ({ request, params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const id = Number(params.id)
    const projet = projetParId(id)
    if (!projet) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (projet.createur.id !== userId) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const patch = (await request.json()) as ProjetUpdate
    if (
      patch.nombre_membres_souhaite !== undefined &&
      patch.nombre_membres_souhaite < projet.nombre_membres_actuel
    ) {
      return HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: {
            nombre_membres_souhaite: [
              `L'équipe compte déjà ${projet.nombre_membres_actuel} membres : l'effectif souhaité ne peut pas être inférieur.`,
            ],
          },
        },
        { status: 422 }
      )
    }
    const maj = mettreAJourProjetDb(id, patch)
    return HttpResponse.json(maj, { status: 200 })
  }),

  /* Supprimer un projet (propriétaire). */
  http.delete('/api/v1/projects/:id', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const id = Number(params.id)
    const projet = projetParId(id)
    if (!projet) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (projet.createur.id !== userId) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    supprimerProjetDb(id)
    return new HttpResponse(null, { status: 204 })
  }),
]
