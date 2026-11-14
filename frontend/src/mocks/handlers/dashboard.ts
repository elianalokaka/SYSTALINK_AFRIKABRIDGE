import { http, HttpResponse } from 'msw'
import { demandesDeDb, demandesDuProjetDb, idUtilisateurConnecte, mesProjets } from '../db'

/**
 * Mock de `GET /me/dashboard` (P1). Il existe pour que la bascule `priorites.dashboard = true`
 * soit testable : tant que le P1 n'est pas livré, le front n'appelle pas cette route
 * et reconstruit le tableau de bord avec les routes P0 (cf. `api/dashboard.ts`).
 * `followers_count` / `following_count` valent 0 (follow = P1).
 */
export const handlersDashboard = [
  http.get('/api/v1/me/dashboard', () => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const miens = mesProjets(userId)
    const recues = miens
      .filter((projet) => projet.createur.id === userId && projet.statut !== 'termine')
      .reduce((somme, projet) => somme + demandesDuProjetDb(projet.id, 'en_attente').length, 0)

    return HttpResponse.json(
      {
        mes_projets: miens.slice(0, 5).map((p) => ({
          id: p.id,
          nom: p.nom,
          domaines: p.domaines,
          statut: p.statut,
          progression: p.progression,
          nombre_membres_souhaite: p.nombre_membres_souhaite,
          nombre_membres_actuel: p.nombre_membres_actuel,
        })),
        projets_count: miens.length,
        demandes_recues_en_attente: recues,
        mes_demandes_en_attente: demandesDeDb(userId).filter((d) => d.statut === 'en_attente').length,
        followers_count: 0,
        following_count: 0,
      },
      { status: 200 }
    )
  }),
]
