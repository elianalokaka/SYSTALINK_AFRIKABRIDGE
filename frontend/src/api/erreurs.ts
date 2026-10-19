/**
 * Normalisation des erreurs de l'API.
 *
 * Les composants ne manipulent JAMAIS un `AxiosError` : ils reçoivent toujours
 * une `ErreurApi` aux propriétés stables. C'est ce qui permet d'écrire
 * `erreur.messageChamp('email')` sans savoir comment Laravel emballe ses 422.
 *
 * Correspondance avec la sémantique verrouillée du contrat (AGENTS.md § 2) :
 *   401 → session absente       403 → Policy Laravel (NON une déconnexion)
 *   409 → conflit métier        413 → corps > 16 Mo
 *   419 → jeton CSRF (traité par l'intercepteur, ne remonte pas ici)
 *   422 → validation par champ  429 → throttle (respecter Retry-After)
 */

export class ErreurApi extends Error {
  /** Code HTTP. `0` signifie « le serveur n'a pas répondu » (réseau coupé). */
  readonly statut: number
  /** Erreurs par champ, forme Laravel : `{ email: ["..."] }`. */
  readonly errors: Record<string, string[]>
  /** Secondes à attendre, renseigné sur les 429. */
  readonly retryAfter?: number

  constructor(
    statut: number,
    message: string,
    errors: Record<string, string[]> = {},
    retryAfter?: number
  ) {
    super(message)
    this.name = 'ErreurApi'
    this.statut = statut
    this.errors = errors
    this.retryAfter = retryAfter
  }

  get reseauIndisponible(): boolean {
    return this.statut === 0
  }
  /** Session absente ou expirée. */
  get nonAuthentifie(): boolean {
    return this.statut === 401
  }
  /** Action non autorisée — l'utilisateur est connecté, il n'a pas le droit. */
  get nonAutorise(): boolean {
    return this.statut === 403
  }
  get introuvable(): boolean {
    return this.statut === 404
  }
  /** Conflit métier : déjà membre, demande en attente, équipe complète… */
  get conflit(): boolean {
    return this.statut === 409
  }
  /** Le corps dépassait 16 Mo — refusé par Nginx/PHP, pas par la validation. */
  get tropVolumineux(): boolean {
    return this.statut === 413
  }
  /** Validation par champ. */
  get validation(): boolean {
    return this.statut === 422
  }
  get tropDeRequetes(): boolean {
    return this.statut === 429
  }

  /**
   * Premier message d'erreur d'un champ — le format attendu par `<FormField>`.
   *
   *   const erreurs = { email: erreur.messageChamp('email') }
   *   <FormField id="email" erreur={erreurs.email} …>
   */
  messageChamp(champ: string): string | undefined {
    return this.errors[champ]?.[0]
  }

  /** Tous les champs en erreur, prêts pour un formulaire. */
  erreursParChamp(): Record<string, string> {
    const resultat: Record<string, string> = {}
    for (const [champ, messages] of Object.entries(this.errors)) {
      if (messages.length > 0) resultat[champ] = messages[0]
    }
    return resultat
  }
}

/** Message de repli quand le serveur n'en fournit aucun. */
export function messageParDefaut(statut: number): string {
  switch (statut) {
    case 0:
      return 'Serveur injoignable. Vérifie ta connexion.'
    case 400:
      return 'Requête invalide.'
    case 401:
      return 'Ta session a expiré. Reconnecte-toi.'
    case 403:
      return "Tu n'as pas les droits pour cette action."
    case 404:
      return 'Élément introuvable.'
    case 409:
      return 'Cette action entre en conflit avec l’état actuel.'
    case 413:
      return 'Fichier trop volumineux (16 Mo maximum).'
    case 419:
      return 'Ta session de sécurité a expiré. Réessaie.'
    case 422:
      return 'Certains champs sont invalides.'
    case 429:
      return 'Trop de tentatives. Patiente un instant.'
    case 500:
    case 502:
    case 503:
      return 'Le serveur a rencontré un problème. Réessaie plus tard.'
    default:
      return 'Une erreur est survenue.'
  }
}
