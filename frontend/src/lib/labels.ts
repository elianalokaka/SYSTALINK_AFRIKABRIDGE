import { useMemo } from 'react'
import { useI18n, type Cle } from '../i18n'
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
 * Libellés d'affichage des énumérations, dans la langue active.
 *
 * Les textes vivent dans `i18n/fr.ts` / `en.ts` (clés `enum.<groupe>.<valeur>`). Ici on ne
 * garde que la CORRESPONDANCE valeur d'enum → clé, typée `Record<Enum, Cle>` :
 *  - ajouter une valeur d'enum au contrat ne compile plus tant qu'elle n'a pas de clé ;
 *  - une clé inexistante dans les dictionnaires ne compile pas non plus.
 * On ne peut donc jamais afficher un enum sans libellé, dans aucune des deux langues.
 *
 * Usage : `const L = useLibelles()` puis `L.role[profil.role_profil]`, `L.domaine[d]`,
 * ou `L.listeDomaines` pour un menu déroulant.
 * Le contrat n'impose des libellés QUE pour `StatutProjet` (« Ouvert » / « En cours » / « Terminé »).
 */

export type TypeLien = LienProfil['type']

const CLES_ROLE: Record<RoleProfil, Cle> = {
  developpeur_frontend: 'enum.role.developpeur_frontend',
  developpeur_backend: 'enum.role.developpeur_backend',
  fullstack: 'enum.role.fullstack',
  designer_ui_ux: 'enum.role.designer_ui_ux',
  ingenieur_iot: 'enum.role.ingenieur_iot',
  data_scientist: 'enum.role.data_scientist',
  chef_de_projet: 'enum.role.chef_de_projet',
  etudiant: 'enum.role.etudiant',
  entrepreneur: 'enum.role.entrepreneur',
  autre: 'enum.role.autre',
}
const CLES_DOMAINE: Record<Domaine, Cle> = {
  agriculture: 'enum.domaine.agriculture',
  sante: 'enum.domaine.sante',
  education: 'enum.domaine.education',
  fintech: 'enum.domaine.fintech',
  energie: 'enum.domaine.energie',
  transport: 'enum.domaine.transport',
  iot: 'enum.domaine.iot',
  intelligence_artificielle: 'enum.domaine.intelligence_artificielle',
  commerce: 'enum.domaine.commerce',
  environnement: 'enum.domaine.environnement',
  administration: 'enum.domaine.administration',
  autre: 'enum.domaine.autre',
}
const CLES_STATUT_PROJET: Record<StatutProjet, Cle> = {
  recrutement: 'enum.statutProjet.recrutement',
  en_cours: 'enum.statutProjet.en_cours',
  termine: 'enum.statutProjet.termine',
}
const CLES_STATUT_DEMANDE: Record<StatutDemande, Cle> = {
  en_attente: 'enum.statutDemande.en_attente',
  acceptee: 'enum.statutDemande.acceptee',
  refusee: 'enum.statutDemande.refusee',
}
const CLES_CATEGORIE: Record<CategorieCompetence, Cle> = {
  langage: 'enum.categorie.langage',
  framework: 'enum.categorie.framework',
  outil: 'enum.categorie.outil',
  domaine_technique: 'enum.categorie.domaine_technique',
  design: 'enum.categorie.design',
  gestion_projet: 'enum.categorie.gestion_projet',
  autre: 'enum.categorie.autre',
}
const CLES_NIVEAU: Record<NiveauCompetence, Cle> = {
  debutant: 'enum.niveau.debutant',
  intermediaire: 'enum.niveau.intermediaire',
  avance: 'enum.niveau.avance',
}
const CLES_TYPE_LIEN: Record<TypeLien, Cle> = {
  github: 'enum.typeLien.github',
  gitlab: 'enum.typeLien.gitlab',
  linkedin: 'enum.typeLien.linkedin',
  portfolio: 'enum.typeLien.portfolio',
  twitter: 'enum.typeLien.twitter',
  autre: 'enum.typeLien.autre',
}
const CLES_TYPE_RESSOURCE: Record<TypeRessource, Cle> = {
  code: 'enum.typeRessource.code',
  lien: 'enum.typeRessource.lien',
  tutoriel: 'enum.typeRessource.tutoriel',
  api: 'enum.typeRessource.api',
  document: 'enum.typeRessource.document',
  article: 'enum.typeRessource.article',
  autre: 'enum.typeRessource.autre',
}
const CLES_VISIBILITE: Record<VisibiliteRessource, Cle> = {
  projet: 'enum.visibilite.projet',
  publique: 'enum.visibilite.publique',
}

function traduireTable<E extends string>(t: (c: Cle) => string, table: Record<E, Cle>): Record<E, string> {
  return Object.fromEntries(Object.entries<Cle>(table).map(([valeur, cle]) => [valeur, t(cle)])) as Record<E, string>
}
const liste = <E extends string>(table: Record<E, string>) => Object.entries(table) as Array<[E, string]>

export function useLibelles() {
  const { t } = useI18n()
  return useMemo(() => {
    const role = traduireTable(t, CLES_ROLE)
    const domaine = traduireTable(t, CLES_DOMAINE)
    const niveau = traduireTable(t, CLES_NIVEAU)
    const typeLien = traduireTable(t, CLES_TYPE_LIEN)
    const typeRessource = traduireTable(t, CLES_TYPE_RESSOURCE)
    return {
      role,
      domaine,
      statutProjet: traduireTable(t, CLES_STATUT_PROJET),
      statutDemande: traduireTable(t, CLES_STATUT_DEMANDE),
      categorie: traduireTable(t, CLES_CATEGORIE),
      niveau,
      niveauNonPrecise: t('enum.niveau.nonPrecise'),
      typeLien,
      typeRessource,
      visibilite: traduireTable(t, CLES_VISIBILITE),
      /** Listes ordonnées pour les menus déroulants (l'ordre d'affichage est un choix d'UI). */
      listeRoles: liste(role),
      listeDomaines: liste(domaine),
      listeNiveaux: liste(niveau),
      listeTypesRessource: liste(typeRessource),
      listeTypesLien: liste(typeLien),
    }
  }, [t])
}
