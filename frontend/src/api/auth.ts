import { client, rafraichirJetonCsrf } from './client'
import type { ProfilPrive, UserLogin, UserRegister } from '../types'

/**
 * Le module d'authentification, dans l'ordre IMPOSÉ par le contrat.
 *
 *   1. GET  /sanctum/csrf-cookie   → pose le cookie XSRF-TOKEN (204)
 *   2. POST /auth/login            → pose le cookie de session HttpOnly
 *   3. GET  /auth/me               → l'utilisateur courant
 *   4. POST /auth/logout           → invalide la session
 *
 * AUCUN token n'est lu, stocké ou renvoyé. L'authentification repose
 * entièrement sur les cookies — pas de localStorage, pas d'en-tête Authorization.
 */

/**
 * ÉTAPE 1 — Initialiser la protection CSRF.
 *
 * À appeler au démarrage de l'application, ou juste avant une écriture.
 * Le contrat précise que l'appel CSRF est nécessaire AVANT la connexion.
 */
export function initialiserCsrf(): Promise<void> {
  return rafraichirJetonCsrf()
}

/**
 * ÉTAPE 2 — Connexion.
 *
 * Succès : 200 + cookie de session + `ProfilPrive` (le SEUL endroit avec l'email).
 * Limitation de débit : 5 tentatives/minute par email+IP → 429 avec `Retry-After`.
 * Échec de validation : 422 avec `errors.email` / `errors.mot_de_passe`.
 */
export async function connexion(corps: UserLogin): Promise<ProfilPrive> {
  const { data } = await client.post<ProfilPrive>('/auth/login', corps)
  return data
}

/**
 * Inscription — ouvre **directement** la session, sans seconde étape de connexion.
 * Codes renvoyés : 201, 419, 422. Pas de 429 sur cette route.
 */
export async function inscription(corps: UserRegister): Promise<ProfilPrive> {
  const { data } = await client.post<ProfilPrive>('/auth/register', corps)
  return data
}

/**
 * ÉTAPE 3 — L'utilisateur courant.
 *
 * ⚠️ C'est LA route de l'utilisateur connecté : `GET /users/me` **n'existe pas**
 * (le contrat l'interdit explicitement, l'URL serait ambiguë avec `/users/{id}`).
 *
 * Un 401 signifie « pas de session » : c'est un ÉTAT NORMAL au démarrage,
 * pas une erreur à afficher.
 */
export async function profilCourant(): Promise<ProfilPrive> {
  const { data } = await client.get<ProfilPrive>('/auth/me')
  return data
}

/** ÉTAPE 4 — Déconnexion. Répond 204 et invalide la session côté serveur. */
export async function deconnexion(): Promise<void> {
  await client.post('/auth/logout')
}
