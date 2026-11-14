import { useState } from 'react'
import { Link } from 'react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Button, Card, CardCorps, CardEntete, EmptyState, SkeletonTexte, Tabs } from '../../components/ui'
import { abonnements, abonnes } from '../../api/suivi'
import { useNomDePays } from '../../lib/pays'
import { LIBELLES_ROLE_PROFIL } from '../../lib/labels'
import { libelleAbonnements, libelleAbonnes } from './reseau'

type OngletReseau = 'abonnes' | 'abonnements'

/** « 12 abonnés · 5 abonnements » — jamais affiché si le suivi n'est pas livré (l'appelant décide). */
export function CompteursSuivi({ nbAbonnes, nbAbonnements }: { nbAbonnes: number; nbAbonnements: number }) {
  return (
    <p className="text-sm tabular-nums text-fg-2">
      {libelleAbonnes(nbAbonnes)} · {libelleAbonnements(nbAbonnements)}
    </p>
  )
}

/**
 * Carte « Réseau » d'un membre : onglets « Abonnés » / « Abonnements »
 * (`GET /users/{id}/followers` et `/following`, paginés par 12).
 *
 * Le contrat renvoie des `UtilisateurResume` : pas de `is_following`, donc pas
 * de bouton « Suivre » dans ces lignes — on ouvre le profil pour suivre.
 * Seule la requête de l'onglet affiché part (pas de double chargement).
 */
export function ListeReseau({
  membreId,
  nbAbonnes,
  nbAbonnements,
}: {
  membreId: number
  nbAbonnes: number
  nbAbonnements: number
}) {
  const nomDePays = useNomDePays()
  const [onglet, setOnglet] = useState<OngletReseau>('abonnes')
  const [page, setPage] = useState(1)

  const requete = useQuery({
    queryKey: [onglet, String(membreId), page],
    queryFn: () => (onglet === 'abonnes' ? abonnes : abonnements)(membreId, { page, per_page: 12 }),
    placeholderData: keepPreviousData,
  })

  const dernierePage = requete.data?.meta.last_page ?? 1

  function changerOnglet(id: string) {
    setOnglet(id as OngletReseau)
    setPage(1)
  }

  return (
    <Card>
      <CardEntete titre="Réseau" />
      <div className="px-4">
        <Tabs
          avecPanneaux
          actif={onglet}
          onChange={changerOnglet}
          onglets={[
            { id: 'abonnes', libelle: 'Abonnés', compteur: nbAbonnes },
            { id: 'abonnements', libelle: 'Abonnements', compteur: nbAbonnements },
          ]}
        />
      </div>
      <CardCorps>
        <div role="tabpanel" id={`panneau-${onglet}`} aria-labelledby={`onglet-${onglet}`}>
          {requete.isPending ? (
            <SkeletonTexte lignes={3} />
          ) : requete.isError && !requete.data ? (
            <EmptyState
              titre="Impossible de charger cette liste"
              description="Vérifie ta connexion puis réessaie."
              action={
                <Button variante="secondaire" onClick={() => void requete.refetch()}>
                  Réessayer
                </Button>
              }
            />
          ) : requete.data && requete.data.data.length > 0 ? (
            <>
              <ul className="grid gap-3 sm:grid-cols-2">
                {requete.data.data.map((membre) => (
                  <li
                    key={membre.id}
                    className="flex items-center gap-3 rounded-md border border-border-subtle p-3"
                  >
                    <Avatar nom={membre.nom} photoUrl={membre.photo_url} taille="md" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/talents/${membre.id}`}
                        className="block truncate py-1 text-sm font-semibold text-fg-1 hover:text-accent"
                      >
                        {membre.nom}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge variante="info">{LIBELLES_ROLE_PROFIL[membre.role_profil]}</Badge>
                        <span className="text-xs text-fg-2">{nomDePays(membre.pays)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {dernierePage > 1 && (
                <nav aria-label="Pagination du réseau" className="mt-4 flex items-center justify-between gap-3">
                  <Button variante="secondaire" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Précédent
                  </Button>
                  <span className="text-sm tabular-nums text-fg-2">
                    Page {page} / {dernierePage}
                  </span>
                  <Button variante="secondaire" disabled={page >= dernierePage} onClick={() => setPage((p) => p + 1)}>
                    Suivant
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <p className="text-sm text-fg-3">
              {onglet === 'abonnes' ? 'Aucun abonné pour l’instant.' : 'Ne suit personne pour l’instant.'}
            </p>
          )}
        </div>
      </CardCorps>
    </Card>
  )
}
