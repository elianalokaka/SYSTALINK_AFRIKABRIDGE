/** Libellés des compteurs de suivi (accord singulier / pluriel). */
export const libelleAbonnes = (n: number) => `${n} ${n > 1 ? 'abonnés' : 'abonné'}`
export const libelleAbonnements = (n: number) => `${n} ${n > 1 ? 'abonnements' : 'abonnement'}`
