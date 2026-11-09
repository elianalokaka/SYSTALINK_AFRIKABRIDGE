/** Limite du contrat (`CommentaireCreate.contenu`, 1 à 1000 caractères). */
export const LONGUEUR_MAX_COMMENTAIRE = 1000

/** « 1 commentaire », « 3 commentaires » (accord singulier / pluriel). */
export const libelleCommentaires = (n: number) => `${n} ${n > 1 ? 'commentaires' : 'commentaire'}`
