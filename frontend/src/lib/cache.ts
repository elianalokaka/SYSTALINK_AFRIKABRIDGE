import type { QueryClient } from '@tanstack/react-query'

/**
 * Gestion du cache TanStack Query après une écriture.
 *
 * POURQUOI CE FICHIER EXISTE
 *   Avec `staleTime = 30 s`, une donnée mise en cache est servie SANS nouvel
 *   appel pendant 30 secondes. Sans invalidation explicite après une écriture,
 *   on affichait donc des données fausses : un projet créé absent de la liste,
 *   un projet supprimé encore cliquable, un statut de demande périmé…
 *   Pire : quand le rafraîchissement finissait par arriver, l'écran basculait
 *   brutalement (« Projet introuvable » juste après avoir montré le projet).
 *
 *   Les clés de cache concernées par les projets et les équipes sont
 *   regroupées ici, pour qu'une écriture n'en oublie aucune.
 *
 * CLÉS (les ids ne sont pas du même type partout — c'est voulu, ne pas « corriger ») :
 *   ['projets', filtres]            liste « Explorer »
 *   ['mes-projets']                 mes projets
 *   ['projet', id: string]          détail (l'id vient de l'URL → chaîne)
 *   ['membres', id: number]         onglet Équipe
 *   ['demandes-projet', id, statut] onglet Demandes (propriétaire)
 *   ['mes-demandes']                demandes que j'ai envoyées
 *   ['demandes-recues']             demandes en attente sur MES projets (badge + tableau de bord)
 *   ['dashboard']                   tableau de bord (accueil)
 *   ['ressources', filtres]         bibliothèque
 *   ['ressource', id: string]       détail d'une ressource (id issu de l'URL)
 *   ['ressources-projet', id]       onglet « Ressources » d'un projet
 *   ['talents', filtres]            recherche de talents
 *   ['talent', id: string]          profil public (id issu de l'URL)
 *   ['portfolio', id: string]       projets réalisés d'un membre
 *   ['discussion', id: number]      fil de messages d'un projet (état de polling, cf. features/messagerie)
 */

/**
 * Marque périmé tout ce qu'une écriture sur un projet ou une équipe peut avoir
 * changé. Sans `projetId`, tous les projets sont concernés (création, suppression).
 * Sur-invalider est sans danger : seules les requêtes ACTIVES sont rechargées.
 */
export function rafraichirProjets(queryClient: QueryClient, projetId?: number): void {
  const invalider = (queryKey: unknown[]) => void queryClient.invalidateQueries({ queryKey })

  invalider(['projets'])
  invalider(['mes-projets'])
  invalider(['mes-demandes'])
  invalider(['demandes-recues'])
  invalider(['dashboard'])

  if (projetId === undefined) {
    invalider(['projet'])
    invalider(['membres'])
    invalider(['demandes-projet'])
  } else {
    invalider(['projet', String(projetId)])
    invalider(['membres', projetId])
    invalider(['demandes-projet', projetId])
  }
}

/** Après avoir créé, modifié ou supprimé une ressource. */
export function rafraichirRessources(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['ressources'] })
  void queryClient.invalidateQueries({ queryKey: ['ressource'] })
  void queryClient.invalidateQueries({ queryKey: ['ressources-projet'] })
}

/** Après une modification de MON profil : les fiches que les autres voient changent. */
export function rafraichirTalents(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['talents'] })
  void queryClient.invalidateQueries({ queryKey: ['talent'] })
  void queryClient.invalidateQueries({ queryKey: ['portfolio'] })
}

/** Retire du cache tout ce qui concerne un projet supprimé. */
export function oublierProjet(queryClient: QueryClient, projetId: number): void {
  queryClient.removeQueries({ queryKey: ['projet', String(projetId)] })
  queryClient.removeQueries({ queryKey: ['membres', projetId] })
  queryClient.removeQueries({ queryKey: ['demandes-projet', projetId] })
  queryClient.removeQueries({ queryKey: ['discussion', projetId] })
  queryClient.removeQueries({ queryKey: ['ressources-projet', projetId] })
  /* Les ressources du projet supprimé disparaissent aussi de la bibliothèque. */
  void queryClient.invalidateQueries({ queryKey: ['ressources'] })
}

/**
 * Vide le cache de TOUT SAUF la session.
 *
 * À appeler à chaque changement de compte (connexion, inscription, déconnexion,
 * expiration). Sans cela, le cache d'un utilisateur reste lisible par le suivant
 * pendant 30 secondes : `is_member`, `ma_demande_statut`, « mes projets »… ceux
 * de la personne précédente.
 */
export function purgerCacheSession(queryClient: QueryClient): void {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
}
