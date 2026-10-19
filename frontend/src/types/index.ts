/**
 * Noms courts des DTO du contrat.
 *
 * ⚠️ `api.types.ts` est **GÉNÉRÉ** par `npm run types:api` depuis
 * `openapi-africabridgefinal.yaml`. **Ne jamais l'éditer à la main** : la
 * prochaine génération écraserait la modification, et le contrat ferait foi
 * contre le code — c'est exactement ce que la Règle des écarts interdit.
 *
 * Ce fichier-ci est écrit à la main et sert de **couche d'alias** : le reste du
 * code importe `ProfilPrive` au lieu de `components['schemas']['ProfilPrive']`.
 * Deux bénéfices :
 *   1. les composants ne dépendent pas de la structure de sortie de l'outil ;
 *   2. si on change d'outil de génération, seul ce fichier bouge.
 */

import type { components } from './api.types'

type Schemas = components['schemas']

/* ── Authentification ─────────────────────────────────────────────────────── */

export type UserLogin = Schemas['UserLogin']
export type UserRegister = Schemas['UserRegister']

/**
 * POURQUOI `Required<>` CI-DESSOUS ?
 *
 * Les schémas du contrat ne déclarent presque jamais `required`. L'outil de
 * génération en déduit donc que presque TOUS les champs sont optionnels
 * (`email?: string`, `id?: number`…). Or une RÉPONSE d'API est un objet COMPLET :
 * toutes ses clés sont présentes (éventuellement à `null`). `Required<>` rétablit
 * cette vérité dans le front, sans amender le contrat.
 *
 * NOTE : c'est un écart du contrat à corriger un jour (Règle des écarts,
 * catégorie D — amender le YAML pour déclarer `required` partout). En attendant,
 * le front ne doit pas écrire des `?.` partout pour un champ qui est TOUJOURS là.
 */

/** Profil de l'utilisateur CONNECTÉ — le seul schéma qui contient `email`. */
export type ProfilPrive = Required<Schemas['ProfilPrive']>

/* ── Profils ──────────────────────────────────────────────────────────────── */

/** Profil PUBLIC. Ne contient JAMAIS la clé `email`. */
export type Profil = Required<Schemas['Profil']>

/** Corps PATCH de `/users/me` : TOUT est optionnel — donc PAS de `Required<>`. */
export type ProfilUpdate = Schemas['ProfilUpdate']

export type UtilisateurResume = Required<Schemas['UtilisateurResume']>
export type Competence = Required<Schemas['Competence']>
export type CompetenceUtilisateur = Required<Schemas['CompetenceUtilisateur']>
export type LienProfil = Required<Schemas['LienProfil']>

/** Corps de `PUT /users/me/skills` — remplace TOUTE la liste de compétences. */
export type CompetencesUpdate = Schemas['CompetencesUpdate']

/* Types dérivés des enums EN LIGNE du contrat (pas des schémas nommés).
   Les générer ici évite de recopier la liste des valeurs à la main. */
export type CategorieCompetence = Competence['categorie']
export type NiveauCompetence = NonNullable<CompetenceUtilisateur['niveau']>

/* ── Énumérations partagées ───────────────────────────────────────────────────
   Générées depuis l'OpenAPI : ajouter une valeur au contrat doit CASSER la
   compilation des libellés (lib/labels.ts), pas produire un libellé vide. */

export type RoleProfil = Schemas['RoleProfil']
export type Domaine = Schemas['Domaine']
export type RoleEquipe = Schemas['RoleEquipe']
export type StatutProjet = Schemas['StatutProjet']
