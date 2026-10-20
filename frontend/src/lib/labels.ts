import type {
  CategorieCompetence,
  Domaine,
  LienProfil,
  NiveauCompetence,
  RoleProfil,
  StatutDemande,
  StatutProjet,
  TypeRessource,
  VisibiliteRessource,
} from '../types'

/**
 * Libellés d'affichage des énumérations.
 *
 * Le contrat ne fournit les libellés QUE pour `StatutProjet` (« Ouvert » /
 * « En cours » / « Terminé »). Tous les autres sont décidés ici, en français.
 *
 * GARANTIE DE COMPLÉTUDE : chaque table est typée `Record<Enum, string>`.
 * Si on ajoute une valeur d'enum au contrat, ce fichier NE COMPILE PLUS tant
 * que le libellé n'est pas ajouté — on ne peut donc jamais afficher un enum
 * sans libellé. C'est voulu : c'est la source unique, jamais recopiée.
 */

export type TypeLien = LienProfil['type']

export const LIBELLES_ROLE_PROFIL: Record<RoleProfil, string> = {
  developpeur_frontend: 'Développeur frontend',
  developpeur_backend: 'Développeur backend',
  fullstack: 'Développeur full-stack',
  designer_ui_ux: 'Designer UI/UX',
  ingenieur_iot: 'Ingénieur IoT',
  data_scientist: 'Data scientist',
  chef_de_projet: 'Chef de projet',
  etudiant: 'Étudiant',
  entrepreneur: 'Entrepreneur',
  autre: 'Autre',
}

export const LIBELLES_DOMAINE: Record<Domaine, string> = {
  agriculture: 'Agriculture',
  sante: 'Santé',
  education: 'Éducation',
  fintech: 'Fintech',
  energie: 'Énergie',
  transport: 'Transport',
  iot: 'IoT',
  intelligence_artificielle: 'Intelligence artificielle',
  commerce: 'Commerce',
  environnement: 'Environnement',
  administration: 'Administration',
  autre: 'Autre',
}

/* Les SEULS libellés imposés par le contrat — ne pas les inventer ni les changer. */
export const LIBELLES_STATUT_PROJET: Record<StatutProjet, string> = {
  recrutement: 'Ouvert',
  en_cours: 'En cours',
  termine: 'Terminé',
}

export const LIBELLES_STATUT_DEMANDE: Record<StatutDemande, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
}

export const LIBELLES_CATEGORIE_COMPETENCE: Record<CategorieCompetence, string> = {
  langage: 'Langage',
  framework: 'Framework',
  outil: 'Outil',
  domaine_technique: 'Domaine technique',
  design: 'Design',
  gestion_projet: 'Gestion de projet',
  autre: 'Autre',
}

export const LIBELLES_NIVEAU: Record<NiveauCompetence, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

export const LIBELLES_TYPE_LIEN: Record<TypeLien, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  linkedin: 'LinkedIn',
  portfolio: 'Portfolio',
  twitter: 'Twitter',
  autre: 'Autre',
}

export const LIBELLES_TYPE_RESSOURCE: Record<TypeRessource, string> = {
  code: 'Code',
  lien: 'Lien',
  tutoriel: 'Tutoriel',
  api: 'API',
  document: 'Document',
  article: 'Article',
  autre: 'Autre',
}

export const LIBELLES_VISIBILITE_RESSOURCE: Record<VisibiliteRessource, string> = {
  projet: "Réservée à l'équipe",
  publique: 'Publique',
}

/** Listes ordonnées pour les menus déroulants (l'ordre d'affichage est un choix d'UI). */
export const LISTE_ROLES_PROFIL = Object.entries(LIBELLES_ROLE_PROFIL) as Array<[RoleProfil, string]>
export const LISTE_DOMAINES = Object.entries(LIBELLES_DOMAINE) as Array<[Domaine, string]>
export const LISTE_NIVEAUX = Object.entries(LIBELLES_NIVEAU) as Array<[NiveauCompetence, string]>
export const LISTE_TYPES_RESSOURCE = Object.entries(LIBELLES_TYPE_RESSOURCE) as Array<[TypeRessource, string]>
export const LISTE_TYPES_LIEN = Object.entries(LIBELLES_TYPE_LIEN) as Array<[TypeLien, string]>
