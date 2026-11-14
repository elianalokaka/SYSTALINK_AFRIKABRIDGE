import type { FilMessages, Message } from '../../types'

/**
 * État d'une discussion + fonctions de FUSION pures.
 *
 * Tout ce qui est délicat dans la messagerie (ordre, doublons, curseurs,
 * suppressions) est ici, sans React ni réseau : c'est ce qui rend le polling
 * prévisible.
 */

/** Nombre de messages demandés par appel (défaut du contrat). */
export const TAILLE_PAGE = 50

export interface EtatDiscussion {
  /** Messages affichés, triés par id croissant, sans doublon. */
  messages: Message[]
  /**
   * Plus grand id JAMAIS vu par un appel serveur. C'est lui qui sert de `apres_id`.
   * Pas « l'id du dernier message affiché » : après une suppression, ce dernier
   * id reculerait et le curseur ne serait plus monotone (A-13).
   */
  dernierId: number
  /** `meta.server_time` du dernier appel, en CHAÎNE BRUTE — jamais converti (A-5). */
  serverTime: string | null
  /** `true` quand il n'y a plus d'historique plus ancien à charger. */
  historiqueComplet: boolean
  /** `true` quand le dernier poll était plein : il reste probablement des messages à rattraper. */
  enRetard: boolean
}

export const ETAT_VIDE: EtatDiscussion = {
  messages: [],
  dernierId: 0,
  serverTime: null,
  historiqueComplet: false,
  enRetard: false,
}

/** Fusionne par id (la valeur reçue gagne), retire `retires`, trie par id croissant. */
function fusionnerMessages(existants: Message[], recus: Message[], retires: number[] = []): Message[] {
  const parId = new Map<number, Message>()
  for (const message of existants) parId.set(message.id, message)
  for (const message of recus) parId.set(message.id, message)
  for (const id of retires) parId.delete(id)
  return [...parId.values()].sort((a, b) => a.id - b.id)
}

function plusGrandId(messages: Message[], plancher: number): number {
  return messages.reduce((max, message) => Math.max(max, message.id), plancher)
}

/**
 * Résultat d'un POLL (premier chargement ou `apres_id`) : AJOUTE en queue,
 * retire les `supprimes`, avance le curseur, retient `server_time` tel quel.
 */
export function fusionnerPoll(etat: EtatDiscussion | undefined, fil: FilMessages): EtatDiscussion {
  const base = etat ?? ETAT_VIDE
  return {
    messages: fusionnerMessages(base.messages, fil.data, fil.supprimes),
    dernierId: plusGrandId(fil.data, base.dernierId),
    serverTime: fil.meta.server_time,
    /* Premier chargement : s'il revient moins de messages que demandé, tout est déjà là. */
    historiqueComplet: etat ? base.historiqueComplet : fil.data.length < TAILLE_PAGE,
    enRetard: fil.data.length >= TAILLE_PAGE,
  }
}

/**
 * Résultat d'un chargement d'HISTORIQUE (`avant_id`) : INSÈRE en tête.
 * Ne touche NI au curseur NI à `server_time` : ce sont ceux du polling.
 */
export function fusionnerHistorique(etat: EtatDiscussion, fil: FilMessages): EtatDiscussion {
  return {
    ...etat,
    messages: fusionnerMessages(etat.messages, fil.data),
    historiqueComplet: fil.data.length < TAILLE_PAGE,
  }
}

/**
 * Ajoute MON message tout juste envoyé, pour qu'il apparaisse sans attendre le
 * prochain poll. Le curseur ne bouge PAS volontairement : si un coéquipier a
 * écrit juste avant moi, avancer `dernierId` jusqu'à mon id lui ferait sauter
 * son message. Le poll suivant renverra le mien en doublon, absorbé par la fusion.
 */
export function ajouterEnvoye(etat: EtatDiscussion | undefined, message: Message): EtatDiscussion {
  const base = etat ?? ETAT_VIDE
  return { ...base, messages: fusionnerMessages(base.messages, [message]) }
}

/** Retire un message supprimé par moi. */
export function retirerMessage(etat: EtatDiscussion | undefined, id: number): EtatDiscussion | undefined {
  if (!etat) return etat
  return { ...etat, messages: etat.messages.filter((message) => message.id !== id) }
}
