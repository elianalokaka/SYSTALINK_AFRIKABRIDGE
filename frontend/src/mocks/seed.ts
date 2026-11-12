import type {
  Competence,
  CompetenceUtilisateur,
  Domaine,
  NiveauCompetence,
  ProfilPrive,
  Projet,
  StatutProjet,
  UtilisateurResume,
} from '../types'

/**
 * Jeu de démonstration — reflète le seeder décrit par le contrat (AGENTS.md § 2).
 *
 * Le contrat impose :
 *   - un CATALOGUE de compétences contenant au minimum Python, JavaScript, IoT,
 *     Réseaux, UI/UX — catalogue FERMÉ, alimenté par seeder, pas de création libre ;
 *   - ~10 profils multi-pays (CD, SN, CI, CM, BJ…) ;
 *   - un designer UI/UX au Sénégal (SN) ;
 *   - 5 à 8 projets dont « Smart Agriculture RDC » ;
 *   - au moins un projet `termine` ;
 *   - des comptes de démonstration pour le jury, mots de passe documentés ;
 *   - le compte d'Eliana N'EXISTE PAS : elle s'inscrit pendant la démo.
 */

/** Mot de passe commun des comptes de démonstration (documenté pour le jury). */
export const MOT_DE_PASSE_DEMO = 'Demo1234!'

/**
 * Le catalogue des compétences renvoyé par `GET /skills`.
 * Une saisie « Autre » peut y ajouter une entrée (même règle que l’API réelle).
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

/** Une compétence du CATALOGUE (sans niveau) à partir de son id. */
function competenceCatalogue(id: number): Competence {
  const source = CATALOGUE_COMPETENCES.find((comp) => comp.id === id)
  if (!source) throw new Error(`Compétence ${id} absente du catalogue`)
  return source
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
  /* Profils supplémentaires : le contrat prévoit ~10 profils multi-pays, ce qui
     donne de la matière à la recherche de talents (filtres, pagination). */
  creerProfil(4, 'Kwame Mensah', 'kwame@example.com', 'CI', 'developpeur_frontend', {
    region: 'Abidjan',
    bio: 'Développeur frontend React/TypeScript, attentif à l’accessibilité et aux performances sur réseaux lents.',
    bio_courte: 'Frontend React/TypeScript à Abidjan.',
    competences: [competence(7, 'avance'), competence(3, 'avance'), competence(2, 'avance'), competence(10, 'intermediaire')],
    domaines: ['education', 'commerce'],
    liens: [{ type: 'github', url: 'https://github.com/kwame-mensah' }],
  }),
  creerProfil(5, 'Chantal Mbarga', 'chantal@example.com', 'CM', 'ingenieur_iot', {
    region: 'Douala',
    bio: 'Ingénieure IoT : capteurs, passerelles LoRa et supervision. J’ai déployé des réseaux de capteurs agricoles.',
    bio_courte: 'Ingénieure IoT à Douala.',
    competences: [competence(13, 'avance'), competence(14, 'intermediaire'), competence(1, 'intermediaire')],
    domaines: ['agriculture', 'iot', 'energie'],
    liens: [{ type: 'linkedin', url: 'https://www.linkedin.com/in/chantal-mbarga' }],
  }),
  creerProfil(6, 'Olivier Adjovi', 'olivier@example.com', 'BJ', 'fullstack', {
    region: 'Cotonou',
    bio: 'Full-stack Laravel et React, je livre des MVP rapidement et proprement.',
    bio_courte: 'Full-stack Laravel/React à Cotonou.',
    competences: [competence(6, 'avance'), competence(7, 'intermediaire'), competence(4, 'avance'), competence(11, 'debutant')],
    domaines: ['fintech', 'commerce'],
    liens: [{ type: 'portfolio', url: 'https://olivier-adjovi.example.org' }],
  }),
  creerProfil(7, 'Sarah Lukusa', 'sarah@example.com', 'CD', 'chef_de_projet', {
    region: 'Lubumbashi',
    bio: 'Cheffe de projet certifiée Scrum, j’aide les équipes à livrer des projets à impact social.',
    bio_courte: 'Cheffe de projet Agile à Lubumbashi.',
    competences: [competence(18, 'avance'), competence(19, 'avance')],
    domaines: ['sante', 'administration'],
  }),
  creerProfil(8, 'Moussa Traoré', 'moussa@example.com', 'ML', 'developpeur_backend', {
    region: 'Bamako',
    bio: 'Backend Python/Django, API et sécurité. Intéressé par la fintech et l’identité numérique.',
    bio_courte: 'Backend Python/Django à Bamako.',
    competences: [competence(9, 'avance'), competence(1, 'avance'), competence(15, 'intermediaire'), competence(11, 'intermediaire')],
    domaines: ['fintech', 'administration'],
    liens: [{ type: 'gitlab', url: 'https://gitlab.com/moussa-traore' }],
  }),
  creerProfil(9, 'Nadia Benali', 'nadia@example.com', 'MA', 'data_scientist', {
    region: 'Casablanca',
    bio: 'Data scientist : prévision de rendements, vision par ordinateur et NLP.',
    bio_courte: 'Data scientist à Casablanca.',
    competences: [competence(1, 'avance'), competence(13, 'debutant')],
    domaines: ['agriculture', 'intelligence_artificielle', 'environnement'],
  }),
  creerProfil(10, 'Eric Habimana', 'eric@example.com', 'RW', 'etudiant', {
    region: 'Kigali',
    bio: 'Étudiant en génie logiciel, je cherche un premier projet collaboratif pour progresser.',
    bio_courte: 'Étudiant en génie logiciel à Kigali.',
    competences: [competence(2, 'debutant'), competence(8, 'debutant'), competence(5, 'debutant')],
    domaines: ['education', 'transport'],
  }),
]

/* ══════════════════════════════════════════════════════════════════════════
   PROJETS
   ══════════════════════════════════════════════════════════════════════════ */

function profilParId(id: number): ProfilPrive {
  const profil = profilsDemo.find((profil) => profil.id === id)
  if (!profil) throw new Error(`Profil ${id} absent du seed`)
  return profil
}

/** Identité courte d'un créateur — `UtilisateurResume` (jamais d'email). */
function resume(profil: ProfilPrive): UtilisateurResume {
  return {
    id: profil.id,
    nom: profil.nom,
    photo_url: profil.photo_url,
    pays: profil.pays,
    role_profil: profil.role_profil,
  }
}

/**
 * Membres par projet (id d'utilisateur). Le créateur y figure toujours.
 * C'est cette liste qui permet au mock de calculer `is_member` par spectateur.
 */
export const membresParProjet: Record<number, number[]> = {
  1: [3, 1], // Smart Agriculture RDC — Fatou (créatrice) + Aminata
  2: [1], // E-Santé Mobile — Aminata
  3: [2, 1, 3], // Éducation Connectée — Jean-Marc + Aminata + Fatou
  4: [2], // Paiement Mobile Panafricain — Jean-Marc
  5: [3, 2, 1], // Énergie Solaire Rurale (terminé) — Fatou + Jean-Marc + Aminata
  6: [1], // Gestion des Déchets — Aminata
}

/** Fabrique un projet complet. `is_member`/`ma_demande_statut` sont posés à
 *  `false`/`null` : ce sont des champs PAR SPECTATEUR, recalculés par le mock. */
function creerProjet(
  id: number,
  nom: string,
  domaines: Domaine[],
  statut: StatutProjet,
  progression: number,
  nombreMembresSouhaite: number,
  createurId: number,
  competencesIds: number[],
  description: string,
  objectifs: string,
  supplement: Partial<Projet> = {}
): Projet {
  const membres = membresParProjet[id] ?? [createurId]
  return {
    id,
    nom,
    domaines,
    statut,
    progression,
    nombre_membres_souhaite: nombreMembresSouhaite,
    nombre_membres_actuel: membres.length,
    description,
    objectifs,
    competences_recherchees: competencesIds.map(competenceCatalogue),
    createur: resume(profilParId(createurId)),
    lien_realisation: null,
    date_fin: null,
    is_member: false,
    ma_demande_statut: null,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z',
    ...supplement,
  }
}

/** Les 6 projets de démonstration, dont « Smart Agriculture RDC » et un `termine`. */
export const projetsDemo: Projet[] = [
  creerProjet(
    1,
    'Smart Agriculture RDC',
    ['agriculture', 'iot'],
    'recrutement',
    30,
    6,
    3,
    [1, 13, 7],
    'Plateforme de capteurs IoT pour aider les exploitations familiales à optimiser irrigation et rendement.',
    'Déployer 200 capteurs d’humidité dans la région de Kinshasa et fournir un tableau de bord de suivi aux agriculteurs.'
  ),
  creerProjet(
    2,
    'E-Santé Mobile',
    ['sante'],
    'recrutement',
    15,
    4,
    1,
    [8, 16],
    'Application mobile de prise de rendez-vous et de télémédecine pour les zones rurales.',
    'Réduire les délais de consultation en connectant les patients aux professionnels de santé via mobile.'
  ),
  creerProjet(
    3,
    'Éducation Connectée',
    ['education'],
    'en_cours',
    60,
    5,
    2,
    [7, 6, 16],
    'Plateforme de cours en ligne hors-ligne pour les élèves sans connexion stable.',
    'Diffuser des contenus pédagogiques téléchargeables et suivre la progression des élèves.'
  ),
  creerProjet(
    4,
    'Paiement Mobile Panafricain',
    ['fintech'],
    'recrutement',
    10,
    7,
    2,
    [6, 1, 15],
    'Solution de paiement interopérable entre opérateurs mobiles et commerçants.',
    'Faciliter les transferts et paiements sans compte bancaire, avec une sécurité renforcée.'
  ),
  creerProjet(
    5,
    'Énergie Solaire Rurale',
    ['energie', 'environnement'],
    'termine',
    100,
    3,
    3,
    [13, 1],
    'Kits solaires autonomes pour électrifier les écoles et dispensaires isolés.',
    'Électrifier 30 infrastructures publiques et former les techniciens locaux à la maintenance.',
    {
      lien_realisation: 'https://exemple.org/energie-solaire-rurale',
      date_fin: '2025-11-20',
      updated_at: '2025-11-20T16:00:00Z',
    }
  ),
  creerProjet(
    6,
    'Gestion des Déchets',
    ['environnement'],
    'recrutement',
    5,
    3,
    1,
    [16, 12],
    'Application de collecte et de tri sélectif des déchets avec cartographie des points de dépôt.',
    'Améliorer le recyclage en ville grâce à une cartographie participative et des alertes de collecte.'
  ),
]

/** Exporte les fabriques réutilisées par la base de données mockée. */
export { competenceCatalogue, creerProfil, profilParId, resume }
