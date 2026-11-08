import { http, HttpResponse } from 'msw'
import {
  commentaireParIdDb,
  commentairesDeDb,
  creerCommentaireDb,
  idUtilisateurConnecte,
  peutVoirRessource,
  ressourceParIdDb,
  supprimerCommentaireDb,
} from '../db'

/**
 * Mocks des commentaires d'une ressource (P1), alignés sur le contrat :
 *
 *   GET    /resources/{id}/comments   200 paginé (plus récent d'abord — hypothèse A-1) | 403 | 404
 *   POST   /resources/{id}/comments   201 | 403 | 404 | 422 (`contenu` : 1 à 1000 caractères)
 *   DELETE /comments/{id}             204 | 403 (ni auteur du commentaire, ni auteur de la ressource) | 404
 *
 * Qui peut lire / écrire : toute ressource que l'utilisateur a le droit de VOIR
 * (publique, ou réservée à un projet dont il est membre) — sinon 403.
 */

const non401 = () => HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
const non403 = () => HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
const non404 = () => HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
const non422 = (message: string) =>
  HttpResponse.json({ message: 'The given data was invalid.', errors: { contenu: [message] } }, { status: 422 })

export const handlersCommentaires = [
  http.get('/api/v1/resources/:id/comments', ({ params, request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()
    const ressource = ressourceParIdDb(Number(params.id))
    if (!ressource) return non404()
    if (!peutVoirRessource(userId, ressource)) return non403()

    const sp = new URL(request.url).searchParams
    const page = Math.max(1, Number(sp.get('page') ?? '1') || 1)
    const perPage = Math.min(50, Math.max(1, Number(sp.get('per_page') ?? '15') || 15))
    const liste = commentairesDeDb(ressource.id)
    const debut = (page - 1) * perPage
    return HttpResponse.json(
      {
        data: liste.slice(debut, debut + perPage),
        meta: { current_page: page, per_page: perPage, total: liste.length, last_page: Math.max(1, Math.ceil(liste.length / perPage)) },
      },
      { status: 200 }
    )
  }),

  http.post('/api/v1/resources/:id/comments', async ({ params, request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()
    const ressource = ressourceParIdDb(Number(params.id))
    if (!ressource) return non404()
    if (!peutVoirRessource(userId, ressource)) return non403()

    const corps = (await request.json().catch(() => ({}))) as { contenu?: unknown }
    const contenu = typeof corps.contenu === 'string' ? corps.contenu.trim() : ''
    if (contenu === '') return non422('Le contenu est requis.')
    if (contenu.length > 1000) return non422('Le contenu ne doit pas dépasser 1000 caractères.')

    return HttpResponse.json(creerCommentaireDb(ressource.id, userId, contenu), { status: 201 })
  }),

  http.delete('/api/v1/comments/:id', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return non401()
    const commentaire = commentaireParIdDb(Number(params.id))
    if (!commentaire) return non404()
    const ressource = ressourceParIdDb(commentaire.ressource_id)
    const autorise = commentaire.auteur.id === userId || ressource?.auteur.id === userId
    if (!autorise) return non403()
    supprimerCommentaireDb(commentaire.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
