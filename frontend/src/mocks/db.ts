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
  Message,
  Projet,
  ProjetCarte,
  ProjetCreate,
  ProjetUpdate,
  Profil,
  ProfilPrive,
  ProfilUpdate,
  Ressource,
  StatutDemande,
  Talent,
  TypeRessource,
  VisibiliteRessource,
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
  }).sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id - a.id) /* V-5 : updated_at DESC */
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
  supprimerRessourcesDuProjetDb(id)
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

/* ══════════════════════════════════════════════════════════════════════════
   MESSAGERIE — fil de discussion par projet
   ══════════════════════════════════════════════════════════════════════════ */

/** Ligne « en base » : le `deleted_at` n'est jamais exposé, il alimente `supprimes`. */
interface LigneMessage {
  id: number
  projet_id: number
  auteur_id: number
  contenu: string
  created_at: string
  deleted_at: string | null
}

const lignesMessages: LigneMessage[] = []
let prochainIdMessage = 1

function enMessage(ligne: LigneMessage): Message {
  const auteur = profils.find((profil) => profil.id === ligne.auteur_id)
  if (!auteur) throw new Error('Auteur introuvable')
  return {
    id: ligne.id,
    projet_id: ligne.projet_id,
    auteur: resume(auteur),
    contenu: ligne.contenu,
    created_at: ligne.created_at,
  }
}

/**
 * Messages visibles (non supprimés) d'un projet, du plus ancien au plus récent.
 *   - `apres_id` : ceux dont l'id est supérieur — les PLUS ANCIENS d'abord (on rattrape dans l'ordre) ;
 *   - `avant_id` : ceux dont l'id est inférieur — les `limit` plus RÉCENTS d'entre eux ;
 *   - sans curseur : les `limit` derniers du fil.
 */
export function messagesDuProjetDb(
  projetId: number,
  filtres: { apres_id?: number; avant_id?: number; limit: number }
): Message[] {
  let lignes = lignesMessages
    .filter((ligne) => ligne.projet_id === projetId && ligne.deleted_at === null)
    .sort((a, b) => a.id - b.id)

  if (filtres.apres_id !== undefined) {
    lignes = lignes.filter((ligne) => ligne.id > filtres.apres_id!).slice(0, filtres.limit)
  } else {
    if (filtres.avant_id !== undefined) lignes = lignes.filter((ligne) => ligne.id < filtres.avant_id!)
    lignes = lignes.slice(-filtres.limit)
  }
  return lignes.map(enMessage)
}

/** Ids supprimés (soft delete) dont `deleted_at >= depuis`. */
export function supprimesDepuisDb(projetId: number, depuis: string): number[] {
  const seuil = Date.parse(depuis)
  return lignesMessages
    .filter(
      (ligne) =>
        ligne.projet_id === projetId &&
        ligne.deleted_at !== null &&
        Date.parse(ligne.deleted_at) >= seuil
    )
    .map((ligne) => ligne.id)
}

export function creerMessageDb(projetId: number, auteurId: number, contenu: string, creeLe?: string): Message {
  const ligne: LigneMessage = {
    id: prochainIdMessage++,
    projet_id: projetId,
    auteur_id: auteurId,
    contenu,
    created_at: creeLe ?? new Date().toISOString(),
    deleted_at: null,
  }
  lignesMessages.push(ligne)
  return enMessage(ligne)
}

export function messageParIdDb(projetId: number, id: number): Message | undefined {
  const ligne = lignesMessages.find(
    (l) => l.id === id && l.projet_id === projetId && l.deleted_at === null
  )
  return ligne ? enMessage(ligne) : undefined
}

export function supprimerMessageDb(id: number): void {
  const ligne = lignesMessages.find((l) => l.id === id)
  if (ligne) ligne.deleted_at = new Date().toISOString()
}

/* Messages de démonstration, répartis sur hier et aujourd'hui. */
function amorcerMessages(): void {
  const il_y_a = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
  const seed: Array<[number, number, string, number]> = [
    [3, 2, "Bienvenue dans la discussion d'Éducation Connectée ! On cale le premier sprint cette semaine.", 1700],
    [3, 1, "Super. Je prends la maquette de l'espace élève.", 1690],
    [3, 3, "De mon côté je prépare le jeu de données pour le suivi de progression.", 1650],
    [3, 2, "Parfait. Point rapide jeudi à 17h ?", 90],
    [3, 1, 'Ça me va 👍', 85],
    [1, 3, 'Salut ! Smart Agriculture RDC cherche encore des profils backend et IoT.', 300],
    [1, 1, "Je peux aider sur l'interface du tableau de bord agriculteur.", 280],
  ]
  for (const [projetId, auteurId, contenu, minutes] of seed) {
    creerMessageDb(projetId, auteurId, contenu, il_y_a(minutes))
  }
}
amorcerMessages()

/* ══════════════════════════════════════════════════════════════════════════
   RESSOURCES — bibliothèque partagée
   ══════════════════════════════════════════════════════════════════════════ */

const ressources: Ressource[] = []
let prochainIdRessource = 1

/** Données d'une création, déjà VALIDÉES par le handler. */
export interface DonneesRessource {
  type: TypeRessource
  titre: string
  description: string | null
  url: string | null
  contenu_code: string | null
  langage: string | null
  fichier_url: string | null
  projet_id: number | null
  visibilite: VisibiliteRessource
  competence_ids: number[]
}

export function creerRessourceDb(auteurId: number, donnees: DonneesRessource, creeLe?: string): Ressource {
  const auteur = profils.find((profil) => profil.id === auteurId)
  if (!auteur) throw new Error('Auteur introuvable')
  const ressource: Ressource = {
    id: prochainIdRessource++,
    type: donnees.type,
    titre: donnees.titre,
    description: donnees.description,
    url: donnees.url,
    contenu_code: donnees.contenu_code,
    langage: donnees.langage,
    fichier_url: donnees.fichier_url,
    visibilite: donnees.visibilite,
    projet_id: donnees.projet_id,
    auteur: resume(auteur),
    competences: donnees.competence_ids.map(competenceCatalogue),
    commentaires_count: 0,
    created_at: creeLe ?? new Date().toISOString(),
  }
  ressources.push(ressource)
  return ressource
}

export function ressourceParIdDb(id: number): Ressource | undefined {
  return ressources.find((ressource) => ressource.id === id)
}

/** Publique, OU réservée à un projet dont je suis membre. */
export function peutVoirRessource(userId: number, ressource: Ressource): boolean {
  if (ressource.visibilite === 'publique') return true
  return ressource.projet_id !== null && estMembre(ressource.projet_id, userId)
}

/** Auteur de la ressource, ou propriétaire du projet lié. */
export function peutGererRessource(userId: number, ressource: Ressource): boolean {
  if (ressource.auteur.id === userId) return true
  const projet = ressource.projet_id !== null ? projetParId(ressource.projet_id) : undefined
  return projet?.createur.id === userId
}

export function listerRessourcesDb(
  userId: number,
  filtres: { q?: string; type?: string; competence_ids: number[]; projet_id?: number; auteur_id?: number }
): Ressource[] {
  const q = filtres.q?.trim().toLowerCase()
  return ressources
    .filter((ressource) => {
      if (!peutVoirRessource(userId, ressource)) return false
      if (filtres.projet_id !== undefined && ressource.projet_id !== filtres.projet_id) return false
      if (filtres.type && ressource.type !== filtres.type) return false
      if (filtres.auteur_id !== undefined && ressource.auteur.id !== filtres.auteur_id) return false
      if (
        filtres.competence_ids.length > 0 &&
        !ressource.competences.some((comp) => filtres.competence_ids.includes(comp.id))
      ) {
        return false
      }
      if (q && !`${ressource.titre} ${ressource.description ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id)
}

export function modifierRessourceDb(
  id: number,
  patch: Partial<Pick<Ressource, 'titre' | 'description' | 'url' | 'contenu_code' | 'langage'>> & {
    competence_ids?: number[]
  }
): Ressource | null {
  const ressource = ressourceParIdDb(id)
  if (!ressource) return null
  const { competence_ids, ...champs } = patch
  Object.assign(ressource, champs)
  if (competence_ids) ressource.competences = competence_ids.map(competenceCatalogue)
  return ressource
}

export function supprimerRessourceDb(id: number): void {
  const index = ressources.findIndex((ressource) => ressource.id === id)
  if (index !== -1) ressources.splice(index, 1)
}

/** Cascade : les ressources d'un projet supprimé disparaissent avec lui (contrat : suppression logique). */
function supprimerRessourcesDuProjetDb(projetId: number): void {
  for (let i = ressources.length - 1; i >= 0; i--) {
    if (ressources[i].projet_id === projetId) ressources.splice(i, 1)
  }
}

function amorcerRessources(): void {
  const il_y_a = (jours: number) => new Date(Date.now() - jours * 86_400_000).toISOString()
  const base = {
    description: null, url: null, contenu_code: null, langage: null, fichier_url: null,
    projet_id: null, visibilite: 'publique' as const, competence_ids: [] as number[],
  }
  creerRessourceDb(2, {
    ...base, type: 'code', titre: 'Pagination Laravel avec filtres', langage: 'php', competence_ids: [6],
    description: 'Un scope Eloquent réutilisable pour paginer et filtrer une liste.',
    contenu_code: "public function scopeFiltre($query, array $f)\n{\n    return $query\n        ->when($f['q'] ?? null, fn ($q, $v) => $q->where('nom', 'like', \"%{$v}%\"))\n        ->latest();\n}",
  }, il_y_a(6))
  creerRessourceDb(1, {
    ...base, type: 'tutoriel', titre: 'Git pour travailler à plusieurs', competence_ids: [10],
    description: 'Le livre officiel, en français : branches, fusions, pull requests.',
    url: 'https://git-scm.com/book/fr/v2',
  }, il_y_a(5))
  creerRessourceDb(3, {
    ...base, type: 'api', titre: 'Open-Meteo — météo gratuite', competence_ids: [],
    description: "API météo sans clé, pratique pour des prototypes agricoles ou IoT.",
    url: 'https://open-meteo.com/en/docs',
  }, il_y_a(4))
  creerRessourceDb(1, {
    ...base, type: 'document', titre: 'Charte graphique AfricaBridge (brouillon)', competence_ids: [16, 17],
    description: 'Couleurs, typographies et règles d\'usage du logo.',
    fichier_url: 'data:text/plain;base64,Q2hhcnRlIGdyYXBoaXF1ZSAtIGJyb3VpbGxvbg==',
  }, il_y_a(3))
  creerRessourceDb(3, {
    ...base, type: 'lien', titre: 'Jeu de données : capteurs agricoles (échantillon)', projet_id: 1,
    visibilite: 'publique', competence_ids: [13],
    description: 'Partagé hors équipe par Smart Agriculture RDC.',
    url: 'https://example.org/datasets/capteurs-agricoles',
  }, il_y_a(2))
  creerRessourceDb(2, {
    ...base, type: 'article', titre: "Cahier des charges — Éducation Connectée", projet_id: 3,
    visibilite: 'projet', competence_ids: [18],
    description: "Réservé à l'équipe du projet.",
    url: 'https://example.org/education-connectee/cahier-des-charges',
  }, il_y_a(1))
}
amorcerRessources()

/* ══════════════════════════════════════════════════════════════════════════
   TALENTS (recherche, profil public, portfolio)
   ══════════════════════════════════════════════════════════════════════════ */

/** Projets terminés dont le membre fait partie de l'équipe, du plus récent au plus ancien. */
export function portfolioDb(userId: number): Projet[] {
  return projets
    .filter((projet) => projet.statut === 'termine' && estMembre(projet.id, userId))
    .sort((a, b) => (b.date_fin ?? '').localeCompare(a.date_fin ?? ''))
}

/**
 * Le profil PUBLIC d'un compte : tout sauf l'email (règle de sécurité du contrat).
 * On RECONSTRUIT l'objet champ par champ plutôt que de supprimer `email` d'une
 * copie : un nouveau champ privé ajouté plus tard ne fuitera pas par défaut.
 * `followers_count`/`is_following` valent 0/false : le follow est P1 (non livré).
 */
export function profilPublicDb(id: number): Profil | null {
  const p = profils.find((profil) => profil.id === id)
  if (!p) return null
  return {
    id: p.id,
    nom: p.nom,
    photo_url: p.photo_url,
    pays: p.pays,
    role_profil: p.role_profil,
    region: p.region,
    bio_courte: p.bio ? p.bio.slice(0, 160) : p.bio_courte,
    competences: p.competences,
    domaines: p.domaines,
    followers_count: 0,
    is_following: false,
    bio: p.bio,
    liens: p.liens,
    following_count: 0,
    projets_realises_count: portfolioDb(p.id).length,
    created_at: p.created_at,
  }
}

export interface FiltresTalentsDb {
  q: string | null
  competenceIds: number[]
  competenceMatch: 'any' | 'all'
  domaine: string | null
  pays: string | null
  region: string | null
  roleProfil: string | null
}

/** `GET /users` : l'utilisateur connecté est EXCLU des résultats ; tri par nom. */
export function listerTalentsDb(userId: number | null, f: FiltresTalentsDb): Talent[] {
  const terme = f.q?.trim().toLowerCase() ?? ''
  const resultats = profils.filter((p) => {
    if (p.id === userId) return false
    if (terme && !(p.nom.toLowerCase().includes(terme) || (p.bio ?? '').toLowerCase().includes(terme))) return false
    if (f.domaine && !p.domaines.includes(f.domaine as never)) return false
    if (f.pays && p.pays.toLowerCase() !== f.pays.toLowerCase()) return false
    if (f.region && !(p.region ?? '').toLowerCase().includes(f.region.toLowerCase())) return false
    if (f.roleProfil && p.role_profil !== f.roleProfil) return false
    if (f.competenceIds.length > 0) {
      const siennes = p.competences.map((comp) => comp.id)
      const ok =
        f.competenceMatch === 'all'
          ? f.competenceIds.every((id) => siennes.includes(id))
          : f.competenceIds.some((id) => siennes.includes(id))
      if (!ok) return false
    }
    return true
  })
  return resultats
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    .map((p) => {
      const pub = profilPublicDb(p.id) as Profil
      return {
        id: pub.id,
        nom: pub.nom,
        photo_url: pub.photo_url,
        pays: pub.pays,
        role_profil: pub.role_profil,
        region: pub.region,
        bio_courte: pub.bio_courte,
        competences: pub.competences,
        domaines: pub.domaines,
        followers_count: 0,
        is_following: false,
      }
    })
}
