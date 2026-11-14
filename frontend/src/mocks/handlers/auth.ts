import { http, HttpResponse } from 'msw'
import {
  ajouterProfil,
  enregistrerMotDePasse,
  fermerSession,
  ouvrirSession,
  trouverParEmail,
  utilisateurConnecte,
  verifierMotDePasse,
} from '../db'
import type { UserLogin, UserRegister } from '../../types'

/**
 * Mocks du module Auth — fidèles à la sémantique verrouillée du contrat :
 *
 *   1. GET  /sanctum/csrf-cookie  → 204
 *   2. POST /auth/login           → 200 (session) ou 422 (identifiants)
 *   3. POST /auth/register        → 201 (session ouverte) ou 422
 *   4. GET  /auth/me              → 200 ou 401
 *   5. POST /auth/logout          → 204
 *
 * Un mock ne teste PAS les cas d'infrastructure (419, 429, 413) : ceux-là sont
 * couverts par le test de conformité contre la vraie API (scripts/conformite/).
 */

/** 422 au format Laravel : { message, errors: { champ: [messages] } }. */
function reponseValidation(message: string, errors: Record<string, string[]>) {
  return HttpResponse.json({ message, errors }, { status: 422 })
}

export const handlersAuth = [
  /* 1. Initialiser la protection CSRF. Le mock n'a pas à poser de vrai cookie :
     axios lira le cookie uniquement si on en pose un, et l'intercepteur 419 ne
     se déclenche que sur une réponse 419 — que le mock ne renvoie jamais. */
  http.get('/sanctum/csrf-cookie', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  /* 2. Connexion. */
  http.post('/api/v1/auth/login', async ({ request }) => {
    const corps = (await request.json()) as Partial<UserLogin>

    if (!corps.email?.trim()) {
      return reponseValidation('The email field is required.', {
        email: ['L’adresse e-mail est requise.'],
      })
    }
    if (!corps.mot_de_passe) {
      return reponseValidation('The password field is required.', {
        mot_de_passe: ['Le mot de passe est requis.'],
      })
    }

    const utilisateur = trouverParEmail(corps.email)
    if (!utilisateur || !verifierMotDePasse(corps.email, corps.mot_de_passe)) {
      return reponseValidation('These credentials do not match our records.', {
        email: ['Ces identifiants ne correspondent pas.'],
      })
    }

    ouvrirSession(utilisateur.id)
    return HttpResponse.json(utilisateur, { status: 200 })
  }),

  /* 3. Inscription — ouvre directement la session. */
  http.post('/api/v1/auth/register', async ({ request }) => {
    const corps = (await request.json()) as Partial<UserRegister>

    /* On normalise en variables locales : le corps est `Partial`, donc chaque
       champ est `string | undefined`. Valider des locales (plutôt que le corps
       directement) évite les assertions non-null et les `?.` inutiles. */
    const nom = (corps.nom ?? '').trim()
    const email = (corps.email ?? '').trim()
    const motDePasse = corps.mot_de_passe ?? ''
    const confirmation = corps.mot_de_passe_confirmation ?? ''
    const pays = (corps.pays ?? '').trim().toUpperCase()

    const errors: Record<string, string[]> = {}
    if (!nom) errors.nom = ['Le nom est requis.']
    if (!email) errors.email = ['L’adresse e-mail est requise.']
    else if (trouverParEmail(email)) errors.email = ['Cette adresse e-mail est déjà utilisée.']
    if (!motDePasse) errors.mot_de_passe = ['Le mot de passe est requis.']
    else if (motDePasse.length < 8) errors.mot_de_passe = ['Le mot de passe doit contenir au moins 8 caractères.']
    if (motDePasse !== confirmation) errors.mot_de_passe_confirmation = ['La confirmation ne correspond pas.']
    if (!pays) errors.pays = ['Le pays est requis.']

    if (Object.keys(errors).length > 0) {
      return reponseValidation('Certains champs sont invalides.', errors)
    }

    const profil = ajouterProfil(nom, email, pays)
    /* Le mot de passe est mémorisé séparément : sans lui, un compte créé ne
       pourrait jamais se reconnecter (c'est le bug corrigé ici). */
    enregistrerMotDePasse(profil.email, motDePasse)
    ouvrirSession(profil.id)
    return HttpResponse.json(profil, { status: 201 })
  }),

  /* 4. L'utilisateur courant. Un 401 est un ÉTAT NORMAL : pas de session. */
  http.get('/api/v1/auth/me', () => {
    const utilisateur = utilisateurConnecte()
    if (!utilisateur) {
      return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    }
    return HttpResponse.json(utilisateur, { status: 200 })
  }),

  /* 5. Déconnexion — invalide la session. */
  http.post('/api/v1/auth/logout', () => {
    fermerSession()
    return new HttpResponse(null, { status: 204 })
  }),
]
