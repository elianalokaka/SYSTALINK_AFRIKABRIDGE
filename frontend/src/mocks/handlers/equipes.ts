import { http, HttpResponse } from 'msw'
import {
  annulerDemandeDb,
  demandeParIdDb,
  demanderAdhesionDb,
  demandesDeDb,
  demandesDuProjetDb,
  idUtilisateurConnecte,
  membresObjetsDb,
  projetParId,
  retirerMembreDb,
  traiterDemandeDb,
} from '../db'
import type { DemandeAdhesionCreate, DemandeDecision, StatutDemande } from '../../types'

/**
 * Mocks du module Équipes.
 *
 * Fidèles à la sémantique du contrat :
 *   - `POST /projects/{id}/join-requests` → 409 si déjà membre / en attente / complet ;
 *   - `GET /projects/{id}/join-requests` → propriétaire uniquement (403) ;
 *   - `PATCH /join-requests/{id}` → accepter crée la ligne membre (transaction) ;
 *   - `DELETE /join-requests/{id}` → auteur uniquement, `en_attente` seulement ;
 *   - `DELETE /projects/{id}/members/{userId}` → le propriétaire ne peut pas quitter (409).
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

function paginationDepuis(request: Request) {
  const sp = new URL(request.url).searchParams
  const page = Math.max(1, Number(sp.get('page') ?? '1') || 1)
  const perPage = Math.min(50, Math.max(1, Number(sp.get('per_page') ?? '15') || 15))
  return { page, perPage }
}

export const handlersEquipes = [
  /* Demander à rejoindre. */
  http.post('/api/v1/projects/:id/join-requests', async ({ request, params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const corps = (await request.json().catch(() => ({}))) as DemandeAdhesionCreate
    if ((corps.message?.length ?? 0) > 500) {
      return HttpResponse.json(
        { message: 'The given data was invalid.', errors: { message: ['Le message ne doit pas dépasser 500 caractères.'] } },
        { status: 422 }
      )
    }
    const resultat = demanderAdhesionDb(userId, Number(params.id), corps.message ?? null)
    if (resultat === 'introuvable') {
      return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    }
    if ('conflit' in resultat) {
      return HttpResponse.json({ message: resultat.conflit }, { status: 409 })
    }
    return HttpResponse.json(resultat, { status: 201 })
  }),

  /* Demandes reçues par un projet (propriétaire uniquement). */
  http.get('/api/v1/projects/:id/join-requests', ({ request, params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const projet = projetParId(Number(params.id))
    if (!projet) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (projet.createur.id !== userId) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const { page, perPage } = paginationDepuis(request)
    const demandeStatut = new URL(request.url).searchParams.get('statut') ?? 'en_attente'
    if (!['en_attente', 'acceptee', 'refusee'].includes(demandeStatut)) {
      return HttpResponse.json(
        { message: 'The given data was invalid.', errors: { statut: ['Statut invalide.'] } },
        { status: 422 }
      )
    }
    const pagee = paginer(demandesDuProjetDb(projet.id, demandeStatut as StatutDemande), page, perPage)
    return HttpResponse.json(pagee, { status: 200 })
  }),

  /* Mes demandes envoyées. */
  http.get('/api/v1/me/join-requests', ({ request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const { page, perPage } = paginationDepuis(request)
    const pagee = paginer(demandesDeDb(userId), page, perPage)
    return HttpResponse.json(pagee, { status: 200 })
  }),

  /* Accepter / refuser une demande (propriétaire). */
  http.patch('/api/v1/join-requests/:id', async ({ request, params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const id = Number(params.id)
    const demande = demandeParIdDb(id)
    if (!demande) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })

    const projet = projetParId(demande.projet.id)
    if (!projet || projet.createur.id !== userId) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const corps = (await request.json()) as DemandeDecision
    const resultat = traiterDemandeDb(id, corps.decision)
    if (!resultat) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if ('conflit' in resultat) return HttpResponse.json({ message: resultat.conflit }, { status: 409 })

    return HttpResponse.json(resultat, { status: 200 })
  }),

  /* Annuler ma demande. */
  http.delete('/api/v1/join-requests/:id', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const resultat = annulerDemandeDb(Number(params.id), userId)
    if (resultat === 'introuvable') return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (resultat === 'interdit') {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }
    if (resultat === 'traitee') {
      return HttpResponse.json({ message: 'Cette demande a déjà été traitée.' }, { status: 409 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  /* Membres du projet. */
  http.get('/api/v1/projects/:id/members', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const id = Number(params.id)
    if (!projetParId(id)) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    return HttpResponse.json({ data: membresObjetsDb(id) }, { status: 200 })
  }),

  /* Retirer un membre / quitter. */
  http.delete('/api/v1/projects/:id/members/:userId', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const projet = projetParId(Number(params.id))
    if (!projet) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })

    const cible = Number(params.userId)
    // Autorisation : le propriétaire retire qui il veut ; un membre ne retire que lui-même.
    const estProprietaire = projet.createur.id === userId
    if (!estProprietaire && cible !== userId) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const resultat = retirerMembreDb(projet.id, cible)
    if (resultat === 'proprietaire') {
      return HttpResponse.json(
        { message: 'Le propriétaire ne peut pas quitter son projet.' },
        { status: 409 }
      )
    }
    if (resultat === 'introuvable') {
      return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
