import { Avatar, Badge, Card, CardCorps, ProgressBar } from '../../components/ui'
import { useLibelles } from '../../lib/labels'
import type { ProjetCarte } from '../../types'
import { varianteStatut } from './statut'

/**
 * Carte d'un projet en liste.
 *
 * Elle n'est PAS cliquable en soi : la navigation appartient à la page qui la
 * rend (lien `<Link>` autour). Ça la laisse réutilisable dans un contexte sans
 * route (ex. le futur tableau de bord).
 */
export function CarteProjet({
  projet,
  demandesEnAttente = 0,
}: {
  projet: ProjetCarte
  /** Demandes à traiter (propriétaire) : affiche une pastille d'alerte. */
  demandesEnAttente?: number
}) {
  const L = useLibelles()
  return (
    <Card className="h-full transition-colors hover:border-border-strong">
      <CardCorps className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 truncate text-sm font-semibold text-fg-1">{projet.nom}</h2>
          <Badge variante={varianteStatut(projet.statut)}>{L.statutProjet[projet.statut]}</Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {projet.domaines.map((domaine) => (
            <Badge key={domaine} variante="neutre">
              {L.domaine[domaine]}
            </Badge>
          ))}
        </div>

        {demandesEnAttente > 0 && (
          <Badge variante="attente">
            {demandesEnAttente} demande{demandesEnAttente > 1 ? 's' : ''} à traiter
          </Badge>
        )}

        <p className="line-clamp-2 text-sm text-fg-2">{projet.description_courte}</p>

        <ProgressBar valeur={projet.progression} afficherValeur={false} className="mt-auto" />

        <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar nom={projet.createur.nom} photoUrl={projet.createur.photo_url} taille="sm" />
            <span className="truncate text-xs text-fg-2">{projet.createur.nom}</span>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-fg-3">
            {projet.nombre_membres_actuel}/{projet.nombre_membres_souhaite}
          </span>
        </div>
      </CardCorps>
    </Card>
  )
}
