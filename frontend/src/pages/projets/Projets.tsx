import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, Input, SkeletonTexte } from '../../components/ui'
import { listerProjets } from '../../api/projets'
import { LISTE_DOMAINES } from '../../lib/labels'
import { CarteProjet } from './CarteProjet'

const CLASSE_SELECT = 'h-9 rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'

/**
 * « Explorer les projets » — la liste filtrable.
 *
 * Les filtres reflètent les paramètres du contrat : `q`, `domaine`, `statut`.
 * Le filtre est APPLIQUÉ côté serveur (le mock filtre réellement), pas côté
 * client : c'est le comportement attendu avec le vrai backend.
 */
export function Projets() {
  const [q, setQ] = useState('')
  const [statut, setStatut] = useState('')
  const [domaine, setDomaine] = useState('')

  const requete = useQuery({
    queryKey: ['projets', { q, statut, domaine }],
    queryFn: () =>
      listerProjets({
        q: q.trim() || undefined,
        statut: statut || undefined,
        domaine: domaine || undefined,
      }),
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-fg-1">Explorer les projets</h1>
          <p className="mt-1 text-sm text-fg-2">
            {requete.data?.meta.total ?? 0} projet{requete.data?.meta.total === 1 ? '' : 's'}
          </p>
        </div>
        <Link to="/projets/nouveau">
          <Button>Créer un projet</Button>
        </Link>
      </div>

      <Card>
        <CardCorps className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            aria-label="Rechercher un projet"
            placeholder="Rechercher un projet…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            aria-label="Filtrer par domaine"
            value={domaine}
            onChange={(e) => setDomaine(e.target.value)}
            className={CLASSE_SELECT}
          >
            <option value="">Tous les domaines</option>
            {LISTE_DOMAINES.map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer par statut"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className={CLASSE_SELECT}
          >
            <option value="">Tous les statuts</option>
            <option value="recrutement">Ouvert</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </CardCorps>
      </Card>

      {requete.isPending ? (
        <Card>
          <CardCorps>
            <SkeletonTexte lignes={5} />
          </CardCorps>
        </Card>
      ) : requete.data && requete.data.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requete.data.data.map((projet) => (
            <Link key={projet.id} to={`/projets/${projet.id}`}>
              <CarteProjet projet={projet} />
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            titre="Aucun projet ne correspond"
            description="Essaie d'élargir tes filtres, ou crée le premier projet."
            action={
              <Link to="/projets/nouveau">
                <Button>Créer un projet</Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  )
}
