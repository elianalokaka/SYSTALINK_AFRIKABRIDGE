import {
  CATALOGUE_COMPETENCES,
  competenceCatalogue,
  creerProfil,
  membresParProjet,
  MOT_DE_PASSE_DEMO,
  profilsDemo,
  projetsDemo,
  resume,
} from './seed'
import type {
  Competence,
  CompetenceUtilisateur,
  Projet,
  ProjetCarte,
  ProjetCreate,
  ProjetUpdate,
  ProfilPrive,
  ProfilUpdate,
} from '../types'

/**
 * Base de données en mémoire, STATEFUL.
 *
 * Les mocks MSW sont le SEUL endroit du frontend qui sait qu'une simulation
 * existe. Cette base est volontairement stateful : le login, l'inscription et
 * la déconnexion modifient un état qui persiste le temps de la session de page.
 *
 * ⚠️ Deux simplifications assumées :
 *   1. la session est portée par un cookie NON-HttpOnly (`document.cookie`),
 *      pour qu'elle survive à un rechargement de page.
 *   2. la base est EN MÉMOIRE : un rechargement complet la réinitialise.
 */

const NOM_COOKIE_SESSION = 'africabridge_session'

/** Liste des comptes — démarre sur le seed, s'enrichit avec les inscriptions. */
const profils: ProfilPrive[] = [...profilsDemo]

/* Les mots de passe ne font PAS partie du profil : le contrat ne les renvoie
   jamais. Ils vivent dans une table séparée, comme un hash en base. */
const motsDePasse = new Map<string, string>()

for (const profil of profils) {
  motsDePasse.set(profil.email.toLowerCase(), MOT_DE_PASSE_DEMO)
}

/* ── Session ──────────────────────────────────────────────────────────────── */

function lireSession(): number | null {
  if (typeof document === 'undefined') return null
  const correspondance = document.cookie.match(new RegExp(`${NOM_COOKIE_SESSION}=mock-(\\d+)`))
  return correspondance ? Number(correspondance[1]) : null
}

export function ouvrirSession(userId: number): void {
  if (typeof document === 'undefined') return
  document.cookie = `${NOM_COOKIE_SESSION}=mock-${userId}; Path=/; SameSite=Lax`
}

export function fermerSession(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${NOM_COOKIE_SESSION}=; Path=/; Max-Age=0`
}

export function utilisateurConnecte(): ProfilPrive | null {
  const id = lireSession()
  return profils.find((profil) => profil.id === id) ?? null
}

/** L'id de l'utilisateur connecté, ou `null`. */
export function idUtilisateurConnecte(): number | null {
  return lireSession()
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

export function verifierMotDePasse(email: string, motDePasse: string): boolean {
  return motsDePasse.get(email.trim().toLowerCase()) === motDePasse
}

export function enregistrerMotDePasse(email: string, motDePasse: string): void {
  motsDePasse.set(email.trim().toLowerCase(), motDePasse)
}

/* ── Catalogue de compétences ─────────────────────────────────────────────── */

export function catalogueCompetences(): Competence[] {
  return CATALOGUE_COMPETENCES
}

/* ── Édition du profil ────────────────────────────────────────────────────── */

export function mettreAJourProfil(id: number, patch: ProfilUpdate): ProfilPrive | null {
  const profil = profils.find((profil) => profil.id === id)
  if (!profil) return null
  Object.assign(profil, patch)
  return profil
}

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

export function definirPhoto(id: number, url: string): void {
  const profil = profils.find((profil) => profil.id === id)
  if (profil) profil.photo_url = url
}

/* ══════════════════════════════════════════════════════════════════════════
   PROJETS
   ══════════════════════════════════════════════════════════════════════════ */

const projets: Projet[] = [...projetsDemo]

/* Membres par projet (id d'utilisateur). Mutable : s'enrichit à la création. */
const membres = new Map<number, number[]>(
  Object.entries(membresParProjet).map(([id, ids]) => [Number(id), [...ids]])
)

function prochainIdProjet(): number {
  return projets.reduce((max, projet) => Math.max(max, projet.id), 0) + 1
}

export function listeProjets(): Projet[] {
  return projets
}

export function projetParId(id: number): Projet | undefined {
  return projets.find((projet) => projet.id === id)
}

export function membresDuProjet(projetId: number): number[] {
  return membres.get(projetId) ?? []
}

export function estMembre(projetId: number, userId: number): boolean {
  return (membres.get(projetId) ?? []).includes(userId)
}

/** Le projet vu par un spectateur : `is_member` recalculé selon la session. */
export function projetPour(projet: Projet, userId: number | null): Projet {
  return {
    ...projet,
    is_member: userId != null && estMembre(projet.id, userId),
    ma_demande_statut: null, // arrive avec le module équipes
  }
}

/** Projet vu par un spectateur, réduit à sa carte de liste. */
export function cartePour(projet: Projet, userId: number | null): ProjetCarte {
  return {
    id: projet.id,
    nom: projet.nom,
    domaines: projet.domaines,
    statut: projet.statut,
    progression: projet.progression,
    nombre_membres_souhaite: projet.nombre_membres_souhaite,
    nombre_membres_actuel: projet.nombre_membres_actuel,
    description_courte: projet.description.slice(0, 200),
    createur: projet.createur,
    competences_recherchees: projet.competences_recherchees,
    is_member: userId != null && estMembre(projet.id, userId),
    ma_demande_statut: null,
  }
}

export function mesProjets(userId: number): Projet[] {
  return projets.filter((projet) => estMembre(projet.id, userId))
}

/** Crée un projet. Le créateur devient automatiquement `proprietaire`. */
export function creerProjetDb(createurId: number, donnees: ProjetCreate): Projet {
  const createur = profils.find((profil) => profil.id === createurId)
  if (!createur) throw new Error('Créateur introuvable')

  const id = prochainIdProjet()
  const projet: Projet = {
    id,
    nom: donnees.nom,
    domaines: donnees.domaines,
    statut: donnees.statut ?? 'recrutement',
    progression: 0,
    nombre_membres_souhaite: donnees.nombre_membres_souhaite,
    nombre_membres_actuel: 1,
    description: donnees.description,
    objectifs: donnees.objectifs,
    competences_recherchees: (donnees.competence_ids ?? []).map(competenceCatalogue),
    createur: resume(createur),
    lien_realisation: null,
    date_fin: null,
    is_member: true,
    ma_demande_statut: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  projets.push(projet)
  membres.set(id, [createurId])
  return projet
}

/** PATCH. Règle du contrat : passer à `termine` pose `date_fin` et `progression=100`. */
export function mettreAJourProjetDb(id: number, patch: ProjetUpdate): Projet | null {
  const projet = projets.find((projet) => projet.id === id)
  if (!projet) return null
  Object.assign(projet, patch)

  if (patch.statut === 'termine') {
    projet.date_fin = new Date().toISOString().slice(0, 10)
    projet.progression = 100
  }
  projet.updated_at = new Date().toISOString()
  return projet
}

/** Suppression logique — le projet quitte les listes. */
export function supprimerProjetDb(id: number): boolean {
  const index = projets.findIndex((projet) => projet.id === id)
  if (index === -1) return false
  projets.splice(index, 1)
  membres.delete(id)
  return true
}
