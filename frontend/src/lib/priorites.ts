/**
 * Disponibilité des opérations P1 du contrat.
 *
 * POURQUOI CE FICHIER EXISTE
 *   Le contrat marque 11 des 44 opérations en `x-priorite: P1` : elles « se
 *   coupent en premier en cas de retard ». Le front doit donc pouvoir retirer
 *   les écrans P1 **sans casser le reste**.
 *
 *   Sans ce fichier, on se retrouverait avec des `if (featureFlag)` dispersés
 *   dans dix composants. Ici, la bascule est UNE constante : le jour où le
 *   backend livre une opération, on passe `false` à `true` et rien d'autre.
 *
 * CE QU'IL FAUT RETENIR (voir docs/ANALYSE-CONTRAT.md § 4)
 *   Le P1 n'est pas totalement optionnel : trois familles très différentes.
 *   A — repli documenté par le contrat lui-même (`/stats`, `/me/dashboard`)
 *   B — champs fantômes à `false`/`0` : ne RIEN construire dessus, et surtout
 *       ne pas les AFFICHER (un `0` affiché est un mensonge visuel)
 *   C — fonctionnalités visibles : des pans d'interface entiers disparaissent
 */
export const priorites = {
  /** `POST`/`DELETE /users/{id}/follow` + listes abonnés/abonnements.
   *  `true` pendant le développement avec les mocks (module `feat/follow`).
   *  Si le backend ne livre pas le suivi : repasser à `false`, tout disparaît
   *  (bouton, compteurs, listes) sans rien casser. */
  follow: true,
  /** `GET /users/suggestions` (bloc « Talents suggérés »). `GET /projects/suggestions` n'est pas branché. */
  suggestions: true,
  /** `GET`/`POST /resources/{id}/comments` + `DELETE /comments/{id}`.
   *  `true` pendant le développement avec les mocks (module `feat/commentaires`).
   *  Si le backend ne les livre pas : repasser à `false` — fil de commentaires et
   *  compteurs disparaissent, sans rien casser. */
  commentaires: true,
  /** `GET /me/dashboard` */
  dashboard: true,
  /** `GET /stats` (route publique) */
  stats: false,
} as const

export type FonctionnaliteOptionnelle = keyof typeof priorites

/** `true` si l'opération P1 correspondante est livrée par le backend. */
export function estLivre(fonctionnalite: FonctionnaliteOptionnelle): boolean {
  return priorites[fonctionnalite]
}
