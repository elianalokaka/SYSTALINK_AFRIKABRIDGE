import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { ErreurApi, messageParDefaut } from './erreurs'

/* ══════════════════════════════════════════════════════════════════════════
   LES DEUX RACINES

   Le contrat place `/sanctum/csrf-cookie` à la RACINE du serveur, HORS du
   préfixe `/api/v1`. Un client à racine unique ne peut donc pas fonctionner.

   `VITE_API_BASE_URL` désigne la RACINE, sans `/api/v1` :
     développement : http://localhost:8000
     production    : vide → les URL deviennent relatives (/api/v1, /sanctum),
                     front et API partageant la même origine sur le VPS.

   ⚠️ Mettre `/api/v1` dans cette variable provoque une 404 sur l'appel CSRF et
   rend le login IMPOSSIBLE. C'est l'erreur de configuration la plus probable.
   ══════════════════════════════════════════════════════════════════════════ */

const RACINE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export const URL_API = `${RACINE}/api/v1`
export const URL_SANCTUM = `${RACINE}/sanctum`

/* ══════════════════════════════════════════════════════════════════════════
   L'INSTANCE
   ══════════════════════════════════════════════════════════════════════════ */

export const client: AxiosInstance = axios.create({
  baseURL: URL_API,

  /* Session par COOKIE : le navigateur doit joindre les cookies à chaque appel. */
  withCredentials: true,

  /* axios recopie le cookie XSRF-TOKEN dans l'en-tête X-XSRF-TOKEN des écritures. */
  withXSRFToken: true,

  headers: { Accept: 'application/json' },

  /* Sérialisation des tableaux exigée par le contrat :
       competence_ids[]=1&competence_ids[]=2
     `indexes: false` produit exactement cette forme. (`indexes: null` donne `competence_ids=1&competence_ids=2`, SANS crochets : piège vérifié sur axios 1.x.)
     Le contrat le répète quatre fois — c'est un point de rupture du filtrage. */
  paramsSerializer: { indexes: false },
})

/* ══════════════════════════════════════════════════════════════════════════
   JETON CSRF — rafraîchissement mutualisé

   Cinq requêtes peuvent prendre un 419 EN MÊME TEMPS (une page qui charge
   plusieurs ressources). Sans mutualisation, cela déclencherait cinq appels à
   `/sanctum/csrf-cookie`. Ici, une seule promesse est partagée.
   ══════════════════════════════════════════════════════════════════════════ */

let rafraichissementEnCours: Promise<void> | null = null

export function rafraichirJetonCsrf(): Promise<void> {
  if (!rafraichissementEnCours) {
    rafraichissementEnCours = axios
      .get(`${URL_SANCTUM}/csrf-cookie`, { withCredentials: true })
      .then(() => undefined)
      /* On n'expose pas l'échec ici : si le rafraîchissement échoue, la requête
         rejouée produira une erreur explicite et exploitable. */
      .catch(() => undefined)
      .finally(() => {
        rafraichissementEnCours = null
      })
  }
  return rafraichissementEnCours
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPIRATION DE SESSION — l'application est prévenue, pas redirigée

   Le client ne redirige JAMAIS : la redirection est une décision d'interface.
   Il signale l'expiration, et l'application décide (vider l'état, naviguer…).
   ══════════════════════════════════════════════════════════════════════════ */

type EcouteurExpiration = () => void
const ecouteursExpiration = new Set<EcouteurExpiration>()

/** S'abonner à la perte de session. Retourne la fonction de désabonnement. */
export function surExpirationSession(ecouteur: EcouteurExpiration): () => void {
  ecouteursExpiration.add(ecouteur)
  return () => {
    ecouteursExpiration.delete(ecouteur)
  }
}

/* Routes pour lesquelles un 401 n'est PAS une expiration de session.
   Un échec de connexion ne doit jamais s'afficher comme « session expirée ». */
const ROUTES_SANS_EXPIRATION = ['/auth/login', '/auth/register']

/* ══════════════════════════════════════════════════════════════════════════
   INTERCEPTEUR DE RÉPONSE
   ══════════════════════════════════════════════════════════════════════════ */

interface ConfigRejouable extends InternalAxiosRequestConfig {
  /** Garde-fou : une requête n'est rejouée qu'UNE seule fois après un 419. */
  _csrfRejoue?: boolean
}

client.interceptors.response.use(
  (reponse) => reponse,

  async (erreur: AxiosError) => {
    const config = erreur.config as ConfigRejouable | undefined
    const statut = erreur.response?.status

    /* ── 419 : jeton CSRF absent ou périmé ────────────────────────────────
       Le contrat impose : rappeler `/sanctum/csrf-cookie` puis REJOUER.
       Deux garde-fous, tous deux indispensables :
         1. `_csrfRejoue` empêche la boucle infinie de requêtes ;
         2. `rafraichirJetonCsrf()` mutualise l'appel entre requêtes
            concurrentes.
       ⚠️ Limite connue : un corps `FormData` déjà consommé n'est pas
       rejouable. Les uploads (modules ressources et profil) devront conserver
       une FABRIQUE de corps, pas un corps déjà sérialisé. */
    if (statut === 419 && config && !config._csrfRejoue) {
      config._csrfRejoue = true
      await rafraichirJetonCsrf()
      return client.request(config)
    }

    /* ── 401 : session absente ou expirée ───────────────────────────────── */
    if (statut === 401) {
      const url = config?.url ?? ''
      const concernee = !ROUTES_SANS_EXPIRATION.some((route) => url.includes(route))
      if (concernee) ecouteursExpiration.forEach((ecouteur) => ecouteur())
    }

    /* ── 409 sur POST /users/{id}/follow : déjà suivi = succès du contrat ─
       Le navigateur logue quand même le 409 en rouge. Sans ce passage, l'intercepteur
       le transformait en ErreurApi, la mutation reculait, et le bouton restait « Suivre ». */
    const methode = (config?.method ?? '').toLowerCase()
    const url = config?.url ?? ''
    if (statut === 409 && methode === 'post' && /\/users\/[^/]+\/follow\/?$/.test(url) && erreur.response) {
      return erreur.response
    }

    /* Toute erreur sort normalisée : les composants ne voient jamais un AxiosError. */
    throw normaliserErreur(erreur)
  }
)

/* ══════════════════════════════════════════════════════════════════════════
   NORMALISATION
   ══════════════════════════════════════════════════════════════════════════ */

function normaliserErreur(erreur: AxiosError): ErreurApi {
  const reponse = erreur.response

  /* Pas de réponse : réseau coupé, serveur éteint, CORS bloqué. */
  if (!reponse) {
    return new ErreurApi(0, messageParDefaut(0))
  }

  const donnees = reponse.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined

  const entete = (reponse.headers as Record<string, unknown> | undefined)?.['retry-after']
  const retryAfter = typeof entete === 'string' ? Number(entete) : undefined

  return new ErreurApi(
    reponse.status,
    donnees?.message ?? messageParDefaut(reponse.status),
    donnees?.errors ?? {},
    retryAfter !== undefined && Number.isFinite(retryAfter) ? retryAfter : undefined
  )
}
