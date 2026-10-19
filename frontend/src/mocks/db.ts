import { CATALOGUE_COMPETENCES, creerProfil, MOT_DE_PASSE_DEMO, profilsDemo } from './seed'
import type { Competence, CompetenceUtilisateur, ProfilPrive, ProfilUpdate } from '../types'

/**
 * Base de données en mémoire, STATEFUL.
 *
 * Les mocks MSW sont le SEUL endroit du frontend qui sait qu'une simulation
 * existe. Cette base est volontairement stateful : le login, l'inscription et
 * la déconnexion modifient un état qui persiste le temps de la session de page.
 *
 * ⚠️ Deux simplifications assumées :
 *   1. la session est portée par un cookie NON-HttpOnly (`document.cookie`),
 *      pour qu'elle survive à un rechargement de page. Le vrai cookie est
 *      HttpOnly et ne peut PAS être écrit par JavaScript.
 *   2. la base est EN MÉMOIRE : un rechargement complet de page la réinitialise.
 *      Les comptes de démo reviennent (ils sont dans le seed), mais les comptes
 *      créés pendant la session disparaissent. C'est le comportement attendu
 *      d'un mock — la persistance arrive avec le vrai backend.
 */

const NOM_COOKIE_SESSION = 'africabridge_session'

/** Liste des comptes — démarre sur le seed, s'enrichit avec les inscriptions. */
const profils: ProfilPrive[] = [...profilsDemo]

/* Les mots de passe ne font PAS partie du profil : le contrat ne les renvoie
   jamais (aucun schéma ne contient de mot de passe, même ProfilPrive). Ils
   vivent donc dans une table séparée — comme une vraie base où le hash est une
   colonne de `users` mais n'est jamais sérialisé dans l'API. */
const motsDePasse = new Map<string, string>()

/* Les comptes de démonstration partagent tous le même mot de passe. */
for (const profil of profils) {
  motsDePasse.set(profil.email.toLowerCase(), MOT_DE_PASSE_DEMO)
}

/* ── Session ──────────────────────────────────────────────────────────────── */

function lireSession(): number | null {
  if (typeof document === 'undefined') return null
  const correspondance = document.cookie.match(new RegExp(`${NOM_COOKIE_SESSION}=mock-(\\d+)`))
  return correspondance ? Number(correspondance[1]) : null
}

/** Ouvre une session pour l'utilisateur — équivaut au cookie HttpOnly de Laravel. */
export function ouvrirSession(userId: number): void {
  if (typeof document === 'undefined') return
  document.cookie = `${NOM_COOKIE_SESSION}=mock-${userId}; Path=/; SameSite=Lax`
}

/** Ferme la session — équivaut à `session()->invalidate()`. */
export function fermerSession(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${NOM_COOKIE_SESSION}=; Path=/; Max-Age=0`
}

/** L'utilisateur connecté, ou `null` si aucune session n'est ouverte. */
export function utilisateurConnecte(): ProfilPrive | null {
  const id = lireSession()
  return profils.find((profil) => profil.id === id) ?? null
}

/* ── Accès aux comptes ────────────────────────────────────────────────────── */

export function trouverParEmail(email: string): ProfilPrive | undefined {
  const normalise = email.trim().toLowerCase()
  return profils.find((profil) => profil.email.toLowerCase() === normalise)
}

export function prochainId(): number {
  return profils.reduce((max, profil) => Math.max(max, profil.id), 0) + 1
}

export function ajouterProfil(nom: string, email: string, pays: string): ProfilPrive {
  const profil = creerProfil(prochainId(), nom, email, pays, 'autre')
  profils.push(profil)
  return profil
}

/* ── Mots de passe ────────────────────────────────────────────────────────── */

/** Vérifie le mot de passe d'un compte. */
export function verifierMotDePasse(email: string, motDePasse: string): boolean {
  return motsDePasse.get(email.trim().toLowerCase()) === motDePasse
}

/** Enregistre le mot de passe d'un compte fraîchement créé. */
export function enregistrerMotDePasse(email: string, motDePasse: string): void {
  motsDePasse.set(email.trim().toLowerCase(), motDePasse)
}

/* ── Catalogue de compétences ─────────────────────────────────────────────── */

/** Le catalogue fermé — c'est ce que renvoie `GET /skills`. */
export function catalogueCompetences(): Competence[] {
  return CATALOGUE_COMPETENCES
}

/* ── Édition du profil ────────────────────────────────────────────────────── */

/** Applique un patch PATCH au profil. Retourne le profil, ou `null` si absent. */
export function mettreAJourProfil(id: number, patch: ProfilUpdate): ProfilPrive | null {
  const profil = profils.find((profil) => profil.id === id)
  if (!profil) return null
  Object.assign(profil, patch)
  return profil
}

/**
 * Remplace TOUTE la liste de compétences de l'utilisateur (règle `sync()` du
 * contrat : ce n'est PAS un ajout, c'est un remplacement).
 */
export function definirCompetences(
  id: number,
  entrees: Array<{ competence_id: number; niveau?: string | null }>
): void {
  const profil = profils.find((profil) => profil.id === id)
  if (!profil) return

  profil.competences = entrees
    .map((entree) => {
      const source = CATALOGUE_COMPETENCES.find((comp) => comp.id === entree.competence_id)
      return source ? { ...source, niveau: entree.niveau ?? null } : null
    })
    .filter((comp): comp is CompetenceUtilisateur => comp !== null)
}

/** Pose la nouvelle URL de photo (après un upload). */
export function definirPhoto(id: number, url: string): void {
  const profil = profils.find((profil) => profil.id === id)
  if (profil) profil.photo_url = url
}
