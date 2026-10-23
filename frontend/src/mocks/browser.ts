import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * Worker MSW — mode développement.
 *
 * Démarré de façon conditionnelle dans `main.tsx` UNIQUEMENT quand
 * `VITE_USE_MOCKS === 'true'`. C'est le seul endroit du frontend qui connaît
 * l'existence des mocks : aucun composant n'en sait rien.
 */
const ROUTE_PING = '/api/v1/__mock/ping'

export const worker = setupWorker(http.get(ROUTE_PING, () => HttpResponse.json({ ok: true })), ...handlers)

/**
 * Démarre MSW ET le surveille.
 *
 * POURQUOI UNE SURVEILLANCE — c'est un défaut des outils, pas de l'application :
 * le navigateur ENDORT le service worker au bout de ~30 s sans événement, et
 * ralentit les minuteurs d'un onglet en arrière-plan (le « keepalive » de MSW,
 * toutes les 5 s, n'est alors plus tenu). Au réveil, le worker ne reconnaît plus
 * la page : il laisse passer les requêtes jusqu'à Vite, qui répond 404 partout
 * (« Élément introuvable » sur la connexion, les projets, la déconnexion…).
 *
 * On vérifie donc régulièrement, et surtout au retour sur l'onglet, que les
 * mocks répondent encore ; sinon on relance le worker. Rien de tout cela
 * n'existe en production : ce fichier n'est chargé qu'avec VITE_USE_MOCKS=true,
 * et disparaît le jour où le vrai backend est branché.
 */
export async function demarrerMocks(): Promise<void> {
  await worker.start()

  let enCours: Promise<void> | null = null
  const verifier = () => {
    enCours ??= (async () => {
      try {
        /* Attention : sans mock, Vite répond 200 avec sa page HTML (repli SPA).
           « 200 » ne prouve rien — seul le JSON du mock prouve qu'il répond. */
        const reponse = await fetch(ROUTE_PING, { cache: 'no-store', headers: { Accept: 'application/json' } })
        const corps = (await reponse.json().catch(() => null)) as { ok?: boolean } | null
        if (corps?.ok === true) return
      } catch {
        /* pas de réponse : on relance aussi */
      }
      await worker.stop()
      await worker.start({ quiet: true })
    })().finally(() => {
      enCours = null
    })
    return enCours
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void verifier()
  })
  window.addEventListener('focus', () => void verifier())
  window.setInterval(() => void verifier(), 20_000)
}
