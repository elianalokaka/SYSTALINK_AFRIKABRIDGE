import type { Competence, CompetenceUtilisateur, NiveauCompetence, ProfilPrive } from '../types'

/**
 * Jeu de démonstration — reflète le seeder décrit par le contrat (AGENTS.md § 2).
 *
 * Le contrat impose :
 *   - un CATALOGUE de compétences contenant au minimum Python, JavaScript, IoT,
 *     Réseaux, UI/UX — catalogue FERMÉ, alimenté par seeder, pas de création libre ;
 *   - ~10 profils multi-pays (CD, SN, CI, CM, BJ…) ;
 *   - un designer UI/UX au Sénégal (SN) ;
 *   - 5 à 8 projets dont « Smart Agriculture RDC » (module projets) ;
 *   - au moins un projet `termine` (module projets) ;
 *   - des comptes de démonstration pour le jury, mots de passe documentés ;
 *   - le compte d'Eliana N'EXISTE PAS : elle s'inscrit pendant la démo.
 */

/** Mot de passe commun des comptes de démonstration (documenté pour le jury). */
export const MOT_DE_PASSE_DEMO = 'Demo1234!'

/**
 * Le catalogue FERMÉ des compétences.
 * C'est lui que renvoie `GET /skills`. L'utilisateur ne peut PAS créer une
 * compétence : il choisit dans cette liste (règle du contrat).
 */
export const CATALOGUE_COMPETENCES: Competence[] = [
  { id: 1, nom: 'Python', categorie: 'langage' },
  { id: 2, nom: 'JavaScript', categorie: 'langage' },
  { id: 3, nom: 'TypeScript', categorie: 'langage' },
  { id: 4, nom: 'PHP', categorie: 'langage' },
  { id: 5, nom: 'Dart', categorie: 'langage' },
  { id: 6, nom: 'Laravel', categorie: 'framework' },
  { id: 7, nom: 'React', categorie: 'framework' },
  { id: 8, nom: 'Flutter', categorie: 'framework' },
  { id: 9, nom: 'Django', categorie: 'framework' },
  { id: 10, nom: 'Git', categorie: 'outil' },
  { id: 11, nom: 'Docker', categorie: 'outil' },
  { id: 12, nom: 'Figma', categorie: 'outil' },
  { id: 13, nom: 'IoT', categorie: 'domaine_technique' },
  { id: 14, nom: 'Réseaux', categorie: 'domaine_technique' },
  { id: 15, nom: 'Sécurité', categorie: 'domaine_technique' },
  { id: 16, nom: 'UI/UX', categorie: 'design' },
  { id: 17, nom: 'Design graphique', categorie: 'design' },
  { id: 18, nom: 'Agile', categorie: 'gestion_projet' },
  { id: 19, nom: 'Scrum', categorie: 'gestion_projet' },
]

/** Construit une compétence d'utilisateur (catalogue + niveau) à partir d'un id. */
function competence(id: number, niveau: NiveauCompetence): CompetenceUtilisateur {
  const source = CATALOGUE_COMPETENCES.find((comp) => comp.id === id)
  if (!source) throw new Error(`Compétence ${id} absente du catalogue`)
  return { ...source, niveau }
}

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
    competences: [competence(16, 'avance'), competence(2, 'intermediaire')],
    domaines: ['sante', 'education'],
  }),
  creerProfil(2, 'Jean-Marc Kabongo', 'jeanmarc@example.com', 'CD', 'developpeur_backend', {
    region: 'Kinshasa',
    bio: 'Développeur backend Laravel, passionné par les API robustes.',
    bio_courte: 'Backend Laravel à Kinshasa.',
    competences: [competence(6, 'avance'), competence(1, 'avance')],
    domaines: ['fintech', 'administration'],
  }),
  creerProfil(3, 'Fatou Ndiaye', 'fatou@example.com', 'SN', 'data_scientist', {
    region: 'Dakar',
    bio: 'Data scientist, je travaille sur des modèles au service de l’agriculture.',
    bio_courte: 'Data scientist à Dakar.',
    competences: [competence(1, 'avance')],
    domaines: ['agriculture', 'environnement'],
  }),
]

/** Exporte la fabrique pour le handler d'inscription. */
export { creerProfil }
