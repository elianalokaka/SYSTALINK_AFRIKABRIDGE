import type { CompetenceUtilisateur, ProfilPrive } from '../types'

/**
 * Jeu de démonstration — reflète le seeder décrit par le contrat (AGENTS.md § 2).
 *
 * Le contrat impose :
 *   - un catalogue de compétences contenant au minimum Python, JavaScript, IoT,
 *     Réseaux, UI/UX ;
 *   - ~10 profils multi-pays (CD, SN, CI, CM, BJ…) ;
 *   - un designer UI/UX au Sénégal (SN) ;
 *   - 5 à 8 projets dont « Smart Agriculture RDC » (module projets) ;
 *   - au moins un projet `termine` (module projets) ;
 *   - des comptes de démonstration pour le jury, mots de passe documentés ;
 *   - le compte d'Eliana N'EXISTE PAS : elle s'inscrit pendant la démo.
 *
 * Ce fichier ne contient que le MINIMUM du module d'authentification. Les
 * compétences et projets complets viendront avec leurs modules respectifs.
 */

/** Mot de passe commun des comptes de démonstration (documenté pour le jury). */
export const MOT_DE_PASSE_DEMO = 'Demo1234!'

export const competencesDemo: CompetenceUtilisateur[] = [
  { id: 1, nom: 'Python', categorie: 'langage', niveau: 'avance' },
  { id: 2, nom: 'JavaScript', categorie: 'langage', niveau: 'intermediaire' },
  { id: 3, nom: 'IoT', categorie: 'domaine_technique', niveau: 'avance' },
  { id: 4, nom: 'Réseaux', categorie: 'domaine_technique', niveau: 'intermediaire' },
  { id: 5, nom: 'UI/UX', categorie: 'design', niveau: 'avance' },
  { id: 6, nom: 'Laravel', categorie: 'framework', niveau: 'avance' },
]

/** Fabrique un profil complet à partir du minimum, en appliquant les valeurs par défaut. */
function creerProfil(
  id: number,
  nom: string,
  email: string,
  pays: string,
  role_profil: ProfilPrive['role_profil'],
  supplement: Partial<ProfilPrive> = {}
): ProfilPrive {
  return {
    id,
    nom,
    email,
    pays,
    role_profil,
    photo_url: null,
    region: null,
    bio_courte: null,
    competences: [],
    domaines: [],
    followers_count: 0,
    is_following: false,
    following_count: 0,
    bio: null,
    liens: [],
    projets_realises_count: 0,
    created_at: '2026-01-10T09:00:00Z',
    ...supplement,
  }
}

/** Les comptes de démonstration, prêts à être utilisés avec `MOT_DE_PASSE_DEMO`. */
export const profilsDemo: ProfilPrive[] = [
  creerProfil(1, 'Aminata Diallo', 'aminata@example.com', 'SN', 'designer_ui_ux', {
    region: 'Dakar',
    bio: 'Designer UI/UX, 6 ans d’expérience. Je transforme des idées complexes en interfaces simples.',
    bio_courte: 'Designer UI/UX basée à Dakar.',
    competences: [competencesDemo[4], competencesDemo[1]],
    domaines: ['sante', 'education'],
  }),
  creerProfil(2, 'Jean-Marc Kabongo', 'jeanmarc@example.com', 'CD', 'developpeur_backend', {
    region: 'Kinshasa',
    bio: 'Développeur backend Laravel, passionné par les API robustes.',
    bio_courte: 'Backend Laravel à Kinshasa.',
    competences: [competencesDemo[5], competencesDemo[0]],
    domaines: ['fintech', 'administration'],
  }),
  creerProfil(3, 'Fatou Ndiaye', 'fatou@example.com', 'SN', 'data_scientist', {
    region: 'Dakar',
    bio: 'Data scientist, je travaille sur des modèles au service de l’agriculture.',
    bio_courte: 'Data scientist à Dakar.',
    competences: [competencesDemo[0]],
    domaines: ['agriculture', 'environnement'],
  }),
]

/** Exporte la fabrique pour le handler d'inscription. */
export { creerProfil }
