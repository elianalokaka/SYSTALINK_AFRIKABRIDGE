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
  DemandeAdhesion,
  Membre,
  Projet,
  ProjetCarte,
  ProjetCreate,
  ProjetUpdate,
  ProfilPrive,
  ProfilUpdate,
  StatutDemande,
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
    ma_demande_statut: maDemandeStatut(projet.id, userId),
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
    ma_demande_statut: maDemandeStatut(projet.id, userId),
  }
}

export function mesProjets(
  userId: number,
  filtres: { role_equipe?: string | null; statut?: string | null } = {}
): Projet[] {
  return projets.filter((projet) => {
    if (!estMembre(projet.id, userId)) return false
    const proprietaire = projet.createur.id === userId
    if (filtres.role_equipe === 'proprietaire' && !proprietaire) return false
    if (filtres.role_equipe === 'membre' && proprietaire) return false
    if (filtres.statut && projet.statut !== filtres.statut) return false
    return true
  })
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
  /* Les demandes d'un projet supprimé disparaissent avec lui (cascade). */
  for (let i = demandes.length - 1; i >= 0; i--) {
    if (demandes[i].projet.id === id) demandes.splice(i, 1)
  }
  return true
}

/* ══════════════════════════════════════════════════════════════════════════
   ÉQUIPES — demandes d'adhésion et membres
   ══════════════════════════════════════════════════════════════════════════ */

const demandes: DemandeAdhesion[] = []
let prochainIdDemande = 1

/** Statut de la DERNIÈRE demande de l'utilisateur sur ce projet. */
export function maDemandeStatut(projetId: number, userId: number | null): StatutDemande | null {
  if (userId == null) return null
  const miennes = demandes
    .filter((demande) => demande.projet.id === projetId && demande.utilisateur.id === userId)
    .sort((a, b) => b.id - a.id)
  return miennes[0]?.statut ?? null
}

/**
 * Crée une demande. Les 4 cas de 409 du contrat reçoivent chacun SON message :
 * déjà membre · demande déjà en attente · projet terminé · équipe complète.
 * `'introuvable'` → 404.
 */
export function demanderAdhesionDb(
  userId: number,
  projetId: number,
  message: string | null
): DemandeAdhesion | { conflit: string } | 'introuvable' {
  const projet = projetParId(projetId)
  const utilisateur = profils.find((profil) => profil.id === userId)
  if (!projet || !utilisateur) return 'introuvable'
  if (estMembre(projetId, userId)) return { conflit: 'Tu fais déjà partie de ce projet.' }
  if (maDemandeStatut(projetId, userId) === 'en_attente') {
    return { conflit: 'Tu as déjà une demande en attente pour ce projet.' }
  }
  if (projet.statut === 'termine') return { conflit: 'Ce projet est terminé.' }
  if (projet.nombre_membres_actuel >= projet.nombre_membres_souhaite) {
    return { conflit: 'Ce projet a déjà son équipe complète.' }
  }

  const demande: DemandeAdhesion = {
    id: prochainIdDemande++,
    projet: {
      id: projet.id,
      nom: projet.nom,
      domaines: projet.domaines,
      statut: projet.statut,
      progression: projet.progression,
      nombre_membres_souhaite: projet.nombre_membres_souhaite,
      nombre_membres_actuel: projet.nombre_membres_actuel,
    },
    utilisateur: resume(utilisateur),
    message,
    statut: 'en_attente',
    created_at: new Date().toISOString(),
    traitee_at: null,
  }
  demandes.push(demande)
  return demande
}

/** Demandes d'un projet, filtrées par statut (le contrat : `en_attente` par défaut), les plus récentes d'abord. */
export function demandesDuProjetDb(projetId: number, statut: StatutDemande = 'en_attente'): DemandeAdhesion[] {
  return demandes
    .filter((demande) => demande.projet.id === projetId && demande.statut === statut)
    .sort((a, b) => b.id - a.id)
}

export function demandesDeDb(userId: number): DemandeAdhesion[] {
  return demandes.filter((demande) => demande.utilisateur.id === userId).sort((a, b) => b.id - a.id)
}

export function demandeParIdDb(id: number): DemandeAdhesion | undefined {
  return demandes.find((demande) => demande.id === id)
}

/** Accepte ou refuse. `acceptee` ajoute le membre dans la même transaction. */
export function traiterDemandeDb(
  id: number,
  decision: 'acceptee' | 'refusee'
): DemandeAdhesion | { conflit: string } | null {
  const demande = demandeParIdDb(id)
  if (!demande) return null
  if (demande.statut !== 'en_attente') return { conflit: 'Cette demande a déjà été traitée.' }

  if (decision === 'acceptee') {
    const projet = projetParId(demande.projet.id)
    if (projet && projet.nombre_membres_actuel >= projet.nombre_membres_souhaite) {
      return { conflit: "L'équipe est complète : impossible d'accepter une personne de plus." }
    }
  }

  demande.statut = decision
  demande.traitee_at = new Date().toISOString()

  if (decision === 'acceptee') {
    const projet = projetParId(demande.projet.id)
    if (projet) {
      const ids = membres.get(projet.id) ?? []
      if (!ids.includes(demande.utilisateur.id)) {
        membres.set(projet.id, [...ids, demande.utilisateur.id])
        projet.nombre_membres_actuel = (membres.get(projet.id) ?? []).length
      }
    }
  }
  return demande
}

/** Annulation par son AUTEUR, uniquement tant que la demande est en attente. */
export function annulerDemandeDb(id: number, userId: number): 'ok' | 'introuvable' | 'interdit' | 'traitee' {
  const index = demandes.findIndex((demande) => demande.id === id)
  if (index === -1) return 'introuvable'
  if (demandes[index].utilisateur.id !== userId) return 'interdit'
  if (demandes[index].statut !== 'en_attente') return 'traitee'
  demandes.splice(index, 1)
  return 'ok'
}

export function retirerMembreDb(
  projetId: number,
  userId: number
): 'ok' | 'introuvable' | 'proprietaire' {
  const projet = projetParId(projetId)
  if (!projet) return 'introuvable'
  if (projet.createur.id === userId) return 'proprietaire'

  const ids = membres.get(projetId) ?? []
  if (!ids.includes(userId)) return 'introuvable'
  membres.set(projetId, ids.filter((id) => id !== userId))
  projet.nombre_membres_actuel = (membres.get(projetId) ?? []).length
  return 'ok'
}

export function membresObjetsDb(projetId: number): Membre[] {
  const projet = projetParId(projetId)
  if (!projet) return []
  return (membres.get(projetId) ?? [])
    .map((userId) => {
      const profil = profils.find((profil) => profil.id === userId)
      if (!profil) return null
      return {
        utilisateur: resume(profil),
        role_equipe: userId === projet.createur.id ? ('proprietaire' as const) : ('membre' as const),
        rejoint_le: projet.created_at,
      }
    })
    .filter((membre): membre is Membre => membre !== null)
}
